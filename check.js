const { Client } = require('pg');
async function runTest() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:54322/postgres' });
  await client.connect();
  const res = await client.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
  console.log(res.rows);
  await client.end();
}
runTest();
