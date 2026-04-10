const { pool } = require("./config/db");

async function alterTables() {
  await pool.query(`
          ALTER TABLE message_files
          ADD COLUMN IF NOT EXISTS encrypted_key TEXT,
          ADD COLUMN IF NOT EXISTS iv TEXT,
          ADD COLUMN IF NOT EXISTS file_nonce TEXT;
          `);

  //   await pool.query(`
  //           ALTER TABLE users
  //           ADD verification_expires_at TIMESTAMP
  //   `);

  console.log("Table altered");
  process.exit();
}

alterTables();
