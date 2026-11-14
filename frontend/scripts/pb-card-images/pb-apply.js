// Usage (depuis frontend/) : node scripts/pb-card-images/pb-apply.js
//
// Remplace les visuels de cartes hébergés sur ibb.co / image-heberg (10,2 Mo au total)
// par les WebP 1200 px de ce dossier (0,84 Mo), hébergés sur PocketBase :
//   1. upload du fichier dans le champ fichier `images` du projet (append, rien n'est supprimé),
//   2. imageUrls[0] := URL PocketBase du fichier.
// Sauvegarde des anciennes URL : pb-images-before.json (rollback = PATCH imageUrls avec l'ancienne
// valeur). Le script relit chaque fiche avant d'écrire et saute celles dont imageUrls[0] a changé.
// Identifiants superuser : PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD dans frontend/.env.
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const PB = 'https://coastal-abagail-axelads-a874777e.koyeb.app';
const plan = JSON.parse(fs.readFileSync(path.join(__dirname, 'plan.json'), 'utf8'));

(async () => {
  const auth = await fetch(`${PB}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: process.env.PB_ADMIN_EMAIL, password: process.env.PB_ADMIN_PASSWORD }),
  });
  if (!auth.ok) {
    console.error('auth failed', auth.status, await auth.text());
    process.exit(1);
  }
  const token = (await auth.json()).token;
  const H = { Authorization: token };

  let ok = 0;
  const results = [];
  for (const it of plan) {
    if (it.after >= it.before) {
      console.log('skip (pas de gain)', it.slug);
      continue;
    }
    // 1. relire l'état courant
    const cur = await (await fetch(`${PB}/api/collections/projects/records/${it.id}`, { headers: H })).json();
    if ((cur.imageUrls || [])[0] !== it.url) {
      console.log('skip (imageUrls[0] a changé)', it.slug);
      continue;
    }
    // 2. upload du fichier (append)
    const fd = new FormData();
    fd.append('images+', new Blob([fs.readFileSync(path.join(__dirname, it.file))], { type: 'image/webp' }), it.file);
    const up = await fetch(`${PB}/api/collections/projects/records/${it.id}`, { method: 'PATCH', headers: H, body: fd });
    if (!up.ok) {
      console.error('upload failed', it.slug, up.status, await up.text());
      process.exit(1);
    }
    const rec = await up.json();
    const fname = rec.images[rec.images.length - 1];
    const newUrl = `${PB}/api/files/projects/${it.id}/${fname}`;
    // 3. imageUrls[0] := nouvelle URL
    const urls = [...(cur.imageUrls || [])];
    urls[0] = newUrl;
    const p2 = await fetch(`${PB}/api/collections/projects/records/${it.id}`, {
      method: 'PATCH',
      headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrls: urls }),
    });
    if (!p2.ok) {
      console.error('imageUrls patch failed', it.slug, p2.status, await p2.text());
      process.exit(1);
    }
    // 4. vérification
    const chk = await fetch(newUrl, { method: 'HEAD' });
    console.log(chk.ok ? 'OK ' : '?? ', it.slug, '->', fname, chk.status, chk.headers.get('content-length'));
    results.push({ id: it.id, slug: it.slug, oldUrl: it.url, newUrl });
    ok++;
  }
  fs.writeFileSync(path.join(__dirname, 'pb-images-after.json'), JSON.stringify(results, null, 2));
  console.log('done', ok, 'records');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
