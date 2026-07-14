import fs from 'fs';
import pg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const sql = fs.readFileSync(path.join(root, 'supabase/migrations/001_oswan_schema.sql'), 'utf8');

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
}

const env = { ...loadEnv(path.join(root, '.env')), ...process.env };
const ref = (env.VITE_SUPABASE_URL || '').match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
const pwd = (env.SUPABASE_DB_PASSWORD || '').trim();

if (!ref) {
  console.error('VITE_SUPABASE_URL missing');
  process.exit(1);
}
if (!pwd) {
  console.error('Add SUPABASE_DB_PASSWORD=... to .env (Database password from Supabase settings)');
  process.exit(2);
}

const urls = [
  `postgresql://postgres.${ref}:${encodeURIComponent(pwd)}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres:${encodeURIComponent(pwd)}@db.${ref}.supabase.co:5432/postgres`,
];

let ok = false;
for (const connectionString of urls) {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query(sql);
    console.log('migrate=ok');
    ok = true;
    await client.end();
    break;
  } catch (e) {
    console.error('try_fail:', String(e.message).slice(0, 160));
    try {
      await client.end();
    } catch {
      /* */
    }
  }
}
process.exit(ok ? 0 : 3);
