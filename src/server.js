import app from './app.js';
import { config } from './config.js';
import { db } from './db.js';

const server=app.listen(config.PORT,()=>console.log(`English Edu API running on http://localhost:${config.PORT}`));

async function shutdown(signal){
  console.log(`${signal} received, shutting down`);
  server.close(async()=>{await db.end();process.exit(0)});
  setTimeout(()=>process.exit(1),10_000).unref();
}
process.on('SIGTERM',()=>shutdown('SIGTERM'));
process.on('SIGINT',()=>shutdown('SIGINT'));
