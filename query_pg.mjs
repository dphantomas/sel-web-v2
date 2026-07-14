import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: "postgresql://neondb_owner:npg_8g5tlBsIZjwa@ep-young-butterfly-ac3f4soo-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" });
await client.connect();
const res = await client.query('SELECT id, name, type, "cloudflareKey" FROM "Resource";');
console.log(res.rows);
await client.end();
