// Quota journalier du chatbot : par visiteur (IP hachée) et global, stocké dans la
// collection PocketBase `chat_quota` (voir scripts/setup-chat-quota-collection.js).
// Si PocketBase est injoignable ou non configuré, repli sur un compteur mémoire
// (par instance, donc plus laxiste) pour ne jamais couper le chatbot.
const crypto = require('crypto');
const { PB_URL } = require('./pb');

const COLLECTION = 'chat_quota';
const LIMIT_IP = positiveInt(process.env.CHAT_LIMIT_IP_DAY, 40);
const LIMIT_GLOBAL = positiveInt(process.env.CHAT_LIMIT_GLOBAL_DAY, 600);
const PB_TIMEOUT_MS = 4000;
const IP_SALT = process.env.CHAT_IP_SALT || 'portfolio-chat';

const memory = new Map();
let cachedAuth = null;
let fallbackWarned = false;

function positiveInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Secondes avant minuit UTC, pour l'en-tête Retry-After.
function secondsUntilReset() {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000));
}

// L'IP n'est jamais stockée en clair : hachage salé tronqué.
function ipKey(ip) {
  return 'ip:' + crypto.createHash('sha256').update(IP_SALT + '|' + String(ip)).digest('hex').slice(0, 24);
}

async function pb(method, path, token, body) {
  const res = await fetch(PB_URL + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(PB_TIMEOUT_MS),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function auth() {
  if (cachedAuth && cachedAuth.expiresAt > Date.now()) return cachedAuth.token;
  const { status, json } = await pb('POST', '/api/collections/users/auth-with-password', null, {
    identity: process.env.PB_SERVICE_EMAIL,
    password: process.env.PB_SERVICE_PASSWORD,
  });
  if (status !== 200 || !json || !json.token) throw new Error(`auth PocketBase HTTP ${status}`);
  cachedAuth = { token: json.token, expiresAt: Date.now() + 30 * 60 * 1000 };
  return json.token;
}

async function readCounts(token, day, keys) {
  const filter = `(day='${day}' && (${keys.map((k) => `key='${k}'`).join(' || ')}))`;
  const query = `perPage=${keys.length}&fields=id,key,count&filter=${encodeURIComponent(filter)}`;
  const { status, json } = await pb('GET', `/api/collections/${COLLECTION}/records?${query}`, token);
  if (status !== 200 || !json) throw new Error(`lecture quota HTTP ${status}`);
  const found = new Map();
  for (const item of json.items || []) found.set(item.key, { id: item.id, count: Number(item.count) || 0 });
  return found;
}

async function increment(token, day, key, existing) {
  if (existing) {
    const { status } = await pb('PATCH', `/api/collections/${COLLECTION}/records/${existing.id}`, token, { 'count+': 1 });
    if (status !== 200) throw new Error(`incrément quota HTTP ${status}`);
    return;
  }
  const { status } = await pb('POST', `/api/collections/${COLLECTION}/records`, token, { key, day, count: 1 });
  if (status === 200) return;
  if (status === 400) {
    // Course : un autre appel vient de créer l'enregistrement — relecture puis incrément.
    const again = await readCounts(token, day, [key]);
    const record = again.get(key);
    if (record) return increment(token, day, key, record);
  }
  throw new Error(`création quota HTTP ${status}`);
}

async function consumeInPocketBase(ipk, day) {
  const token = await auth();
  const counts = await readCounts(token, day, ['global', ipk]);
  const global = counts.get('global');
  const ip = counts.get(ipk);
  if (global && global.count >= LIMIT_GLOBAL) return { allowed: false, scope: 'global' };
  if (ip && ip.count >= LIMIT_IP) return { allowed: false, scope: 'ip' };
  await Promise.all([increment(token, day, 'global', global), increment(token, day, ipk, ip)]);
  return { allowed: true };
}

function consumeInMemory(key, day, limit) {
  const record = memory.get(key);
  const count = record && record.day === day ? record.count : 0;
  if (count >= limit) return false;
  memory.set(key, { day, count: count + 1 });
  if (memory.size > 5000) memory.clear();
  return true;
}

// Retourne { allowed, scope? } ; scope vaut 'ip' ou 'global' quand le quota est atteint.
async function consume(ipAddress) {
  const day = today();
  const ipk = ipKey(ipAddress);
  if (process.env.PB_SERVICE_EMAIL && process.env.PB_SERVICE_PASSWORD) {
    try {
      return await consumeInPocketBase(ipk, day);
    } catch (err) {
      cachedAuth = null;
      console.error('quota: repli mémoire (' + err.message + ')');
    }
  } else if (!fallbackWarned) {
    fallbackWarned = true;
    console.warn('quota: PB_SERVICE_EMAIL/PB_SERVICE_PASSWORD absents, compteur mémoire seulement');
  }
  if (!consumeInMemory('global', day, LIMIT_GLOBAL)) return { allowed: false, scope: 'global' };
  if (!consumeInMemory(ipk, day, LIMIT_IP)) return { allowed: false, scope: 'ip' };
  return { allowed: true };
}

module.exports = { consume, secondsUntilReset, LIMIT_IP, LIMIT_GLOBAL };
