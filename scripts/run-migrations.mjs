import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');

const connectionString = process.env.MIGRATION_DATABASE_URL;
if (!connectionString) {
  console.error('MIGRATION_DATABASE_URL není nastaven.');
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const files = readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

try {
  await client.connect();
  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8');
    console.log(`Spouštím ${file}...`);
    await client.query(sql);
    console.log(`OK: ${file}`);
  }
  console.log('Všechny migrace proběhly úspěšně.');
} catch (err) {
  console.error('Migrace selhala:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
