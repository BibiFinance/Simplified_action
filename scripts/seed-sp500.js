/**
 * Script une fois : télécharge le CSV S&P 500 et écrit data/sp500.json.
 * À lancer manuellement si besoin : node scripts/seed-sp500.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { parse } = require('csv-parse/sync');

const URL = 'https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv';
const outPath = path.join(__dirname, '..', 'data', 'sp500.json');

https.get(URL, (res) => {
  const chunks = [];
  res.on('data', (c) => chunks.push(c));
  res.on('end', () => {
    const text = Buffer.concat(chunks).toString('utf8');
    const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true });
    const out = rows
      .map((r) => ({
        symbol: (r.Symbol || r.symbol || '').trim().toUpperCase(),
        name: (r.Security || r.Name || '').trim() || (r.Symbol || '').trim(),
        sector: (r['GICS Sector'] || r.sector || '').trim() || '-',
        industry: (r['GICS Sub-Industry'] || r.industry || '').trim() || '-',
      }))
      .filter((x) => x.symbol && x.name);
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(out));
    console.log('OK: ' + out.length + ' entreprises -> data/sp500.json');
  });
}).on('error', (e) => {
  console.error('Erreur:', e.message);
  process.exit(1);
});
