require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../lib/db');

(async () => {
  if (!db.isConfigured()) {
    console.log('DATABASE_URL non configurée');
    process.exit(0);
  }
  await db.ensureNotationsTable();
  const p = db.getPool();
  const tables = await p.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('notations', 'actions', 'users', 'stripe_subscriptions')
     ORDER BY table_name`
  );
  console.log('Tables:', tables.rows.map((r) => r.table_name).join(', '));

  for (const name of ['actions', 'notations']) {
    const count = await p.query(`SELECT COUNT(*)::int AS c FROM ${name}`);
    console.log(`${name}: ${count.rows[0].c} ligne(s)`);
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
