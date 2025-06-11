import pg from 'pg';
const { Client } = pg;

async function checkFunction() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:54322/postgres'
  });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT pg_get_functiondef(oid)
      FROM pg_proc
      WHERE proname = 'sync_email_verification_status'
    `);

    if (result.rows[0]) {
      console.log('Function definition:');
      console.log(result.rows[0].pg_get_functiondef);
    } else {
      console.log('Function not found');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkFunction();
