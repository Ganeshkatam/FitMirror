const { Client } = require('pg');
const fs = require('fs');

async function runTest() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:54322/postgres'
  });
  
  client.on('notice', (msg) => {
    console.log('NOTICE:', msg.message);
  });
  
  await client.connect();
  const sql = fs.readFileSync('supabase/tests/database/01_order_snapshot.test.sql', 'utf8');
  
  try {
    const res = await client.query(sql);
    console.log('Result:', JSON.stringify(res.rows || res));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

runTest();
