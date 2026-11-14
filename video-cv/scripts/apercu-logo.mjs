import { readFileSync } from 'node:fs';
import puppeteer from 'puppeteer';
const L = JSON.parse(readFileSync('assets/donnees-logo.json', 'utf8'));
const a = L.ancrages;
const b = await puppeteer.launch();
const p = await b.newPage();
await p.setViewport({ width: 540, height: 800 });
await p.setContent(`<body style="margin:0;background:#0E1326">
<svg viewBox="${L.viewBox}" width="530" height="800" style="display:block;margin:auto">
<path d="${L.traitsPleins}" fill="#F3EEE3" fill-rule="evenodd"/>
<line x1="0" x2="1614" y1="${a.hautCircuit}" y2="${a.hautCircuit}" stroke="red" stroke-width="6"/>
${a.olives.map(o=>`<ellipse cx="${o.cx}" cy="${o.cy}" rx="140" ry="190" fill="none" stroke="lime" stroke-width="6"/>`).join('')}
</svg></body>`);
await p.screenshot({ path: 'out/apercu-logo.png' });
await b.close();
