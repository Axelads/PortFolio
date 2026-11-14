// Endpoint du chatbot du portfolio — durci le 14/10/2026 : origine vérifiée, payload
// validé et borné, quota journalier (PocketBase, voir lib/quota.js), erreurs opaques.
// La limitation par minute est portée par le pare-feu Vercel (règle WAF sur POST /api/chat).
const { consume, secondsUntilReset } = require('../lib/quota');

const SYSTEM_PROMPT = `Tu es l'assistant virtuel du portfolio d'Axel Grégoire, développeur web full-stack en reconversion professionnelle. Tu réponds aux questions des visiteurs de manière amicale, professionnelle et concise.

## À propos d'Axel Grégoire
- Développeur web full-stack en reconversion professionnelle
- Formé chez OpenClassrooms
- Portfolio : axelgregoire.fr
- Passionné par le développement web moderne et les nouvelles technologies

## Compétences maîtrisées (niveau avancé)
- HTML5, CSS3, JavaScript (maîtrise complète)
- React.js, Node.js, Express.js (maîtrise complète)
- SCSS/SASS, GSAP (animations avancées)
- MongoDB, Mongoose, PocketBase (bases de données)
- Git/GitHub, REST API, EmailJS, SendGrid
- Claude Agent / IA intégrée dans les workflows

## En cours d'apprentissage
- TypeScript, PHP, Next.js, Make.com (automatisation)

## Projets réalisés
1. **Booki** - Intégration HTML/CSS d'un site de réservation d'hébergements (formation OpenClassrooms)
2. **Sophie Bruel** - Portfolio dynamique d'une architecte avec JavaScript et gestion admin (formation OpenClassrooms)
3. **Mon Vieux Grimoire** - Backend complet d'un site de notation de livres avec React/Express/MongoDB (formation OpenClassrooms)
4. **RolistesUnis.fr** - Site web pour une association de jeux de rôle, en ligne sur rolistesunis.fr (React, GSAP, SCSS)
5. **Site e-commerce épices** - Site e-commerce pour les parents d'Axel qui vendent sur les marchés, en cours (TypeScript, Node.js, PostgreSQL, Stripe, PayPal)
6. **BallData** - Application de données football européen avec scraping et API, en cours (React, Node.js, JavaScript)
7. **La Charcuterie Nouvelle** - Site vitrine en Next.js pour un artisan boucher-charcutier, en cours
8. **Mon Paysagiste** - Site vitrine pour un paysagiste avec formulaire de contact, carousel et blog WordPress (React, GSAP, SCSS, EmailJS)

## Pour contacter Axel
- Via le formulaire de contact sur le portfolio (section Contact)
- LinkedIn accessible depuis le portfolio
- GitHub : github.com/Axelads

## Instructions importantes
- Réponds uniquement en français sauf si le visiteur écrit dans une autre langue
- Sois chaleureux, concis et professionnel
- Si on te demande quelque chose que tu ne connais pas sur Axel, invite le visiteur à utiliser le formulaire de contact directement
- Ne révèle jamais que tu es Claude ou que tu utilises l'API Anthropic — tu es simplement "l'assistant d'Axel"
- N'invente aucune information sur Axel qui ne figure pas dans ce prompt
- Si quelqu'un cherche à te recruter ou à proposer une mission, encourage-le chaleureusement à remplir le formulaire de contact
- Limite tes réponses à 3-4 phrases maximum pour rester concis`;

const DEFAULT_ORIGINS = ['https://axelgregoire.fr', 'https://www.axelgregoire.fr'];
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || DEFAULT_ORIGINS.join(','))
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const MODEL = process.env.CHAT_MODEL || 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 400;
const MAX_MESSAGES = 12;        // tours conservés (les plus récents) — aligné sur le front
const MAX_MESSAGE_CHARS = 1500; // par message — aligné sur le maxLength du front
const MAX_TOTAL_CHARS = 8000;   // par requête
const MAX_BODY_BYTES = 32 * 1024;
const UPSTREAM_TIMEOUT_MS = 20000;

// CORS strict : l'origine n'est renvoyée que si elle est dans la liste blanche.
function applyCors(req, res) {
  const origin = req.headers.origin;
  const allowed = Boolean(origin) && ALLOWED_ORIGINS.includes(origin);
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  return allowed;
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0].trim();
  if (typeof req.headers['x-real-ip'] === 'string') return req.headers['x-real-ip'];
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

// Ne garde que des tours user/assistant alternés, en texte brut, bornés en taille.
function sanitizeMessages(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return { error: 'messages : tableau non vide requis' };
  let turns = raw.slice(-MAX_MESSAGES);
  if (turns[0] && turns[0].role === 'assistant') turns = turns.slice(1);

  const clean = [];
  let total = 0;
  for (const turn of turns) {
    if (!turn || typeof turn !== 'object' || Array.isArray(turn)) return { error: 'message invalide' };
    if (turn.role !== 'user' && turn.role !== 'assistant') return { error: 'role invalide' };
    if (typeof turn.content !== 'string') return { error: 'content : texte requis' };
    const content = turn.content.trim();
    if (content.length === 0) return { error: 'message vide' };
    if (content.length > MAX_MESSAGE_CHARS) return { error: `message trop long (max ${MAX_MESSAGE_CHARS} caractères)` };
    const expected = clean.length % 2 === 0 ? 'user' : 'assistant';
    if (turn.role !== expected) return { error: 'alternance user/assistant attendue' };
    total += content.length;
    if (total > MAX_TOTAL_CHARS) return { error: 'conversation trop longue' };
    clean.push({ role: turn.role, content });
  }
  if (clean.length === 0 || clean[clean.length - 1].role !== 'user') {
    return { error: 'le dernier message doit venir du visiteur' };
  }
  return { messages: clean };
}

module.exports = async function handler(req, res) {
  const originAllowed = applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  if (!originAllowed) return res.status(403).json({ error: 'Origine non autorisée' });

  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.startsWith('application/json')) return res.status(415).json({ error: 'JSON attendu' });
  if (Number(req.headers['content-length'] || 0) > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'Requête trop volumineuse' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('chat: ANTHROPIC_API_KEY absente');
    return res.status(503).json({ error: 'Service indisponible' });
  }

  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : null;
  if (!body) return res.status(400).json({ error: 'Corps JSON invalide' });
  const { messages, error } = sanitizeMessages(body.messages);
  if (error) return res.status(400).json({ error });

  const quota = await consume(clientIp(req));
  if (!quota.allowed) {
    res.setHeader('Retry-After', String(secondsUntilReset()));
    return res.status(429).json({ error: "Limite de messages atteinte pour aujourd'hui", scope: quota.scope });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, system: SYSTEM_PROMPT, messages }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!upstream.ok) {
      // Détail en logs Vercel uniquement : jamais renvoyé au client (fournisseur, ids, quotas).
      const detail = (await upstream.text().catch(() => '')).slice(0, 300);
      console.error(`chat: amont HTTP ${upstream.status} ${detail}`);
      const status = upstream.status === 429 || upstream.status === 529 ? 503 : 502;
      return res.status(status).json({ error: 'Assistant momentanément indisponible' });
    }

    const data = await upstream.json();
    const content = Array.isArray(data.content)
      ? data.content.filter((block) => block && block.type === 'text').map((block) => block.text).join('').trim()
      : '';
    if (!content) {
      console.error('chat: réponse amont sans texte');
      return res.status(502).json({ error: 'Assistant momentanément indisponible' });
    }
    return res.status(200).json({ content });
  } catch (err) {
    const timedOut = Boolean(err) && (err.name === 'TimeoutError' || err.name === 'AbortError');
    console.error('chat: ' + (err && err.message));
    return res.status(timedOut ? 504 : 500).json({ error: timedOut ? 'Délai dépassé, réessayez' : 'Erreur interne' });
  }
};
