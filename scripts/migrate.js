import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../src/db.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=(await fs.readdir(path.join(root,'migrations'))).filter(name=>name.endsWith('.sql')).sort();
await db.query('CREATE TABLE IF NOT EXISTS schema_migrations(name TEXT PRIMARY KEY,applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
for(const name of files){
  const done=await db.query('SELECT 1 FROM schema_migrations WHERE name=$1',[name]);
  if(done.rowCount) continue;
  const sql=await fs.readFile(path.join(root,'migrations',name),'utf8');
  const client=await db.connect();
  try{await client.query('BEGIN');await client.query(sql);await client.query('INSERT INTO schema_migrations(name) VALUES($1)',[name]);await client.query('COMMIT');console.log(`Applied ${name}`)}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
}
await db.end();
