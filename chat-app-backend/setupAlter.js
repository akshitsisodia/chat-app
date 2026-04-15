const pg = require("pg");
const { Pool } = pg;

const user = "postgres";
const host = "localhost";
const database = "chat_app";
const password = "akshit";
const port = 5432;

const pool = new Pool({
  user,
  host,
  database,
  password,
  port,
});

async function alterTables() {
//   await pool.query(`
//          ALTER TABLE group_keys
// ADD COLUMN nonce TEXT,
// ADD COLUMN ephemeral_public_key TEXT;
//           `);

  // await pool.query(`
  //         ALTER TABLE message_files
  //         ADD COLUMN IF NOT EXISTS encrypted_key TEXT,
  //         ADD COLUMN IF NOT EXISTS iv TEXT,
  //         ADD COLUMN IF NOT EXISTS file_nonce TEXT;
  //         `);

  //   await pool.query(`
  //           ALTER TABLE users
  //           ADD verification_expires_at TIMESTAMP
  //   `);

  // await pool.query(`
  //          ALTER TABLE chats
  //         ADD COLUMN type TEXT DEFAULT 'private',
  //         ADD COLUMN name TEXT,
  //         ADD COLUMN photo TEXT,
  //         ADD COLUMN created_by UUID REFERENCES users(id),
  //         ADD COLUMN pair_key TEXT;
  //   `);

  // await pool.query(`
  //          ALTER TABLE chat_members ADD COLUMN role TEXT DEFAULT 'member';
  //   `);

  await pool.query(`
           ALTER TABLE messages
            ALTER COLUMN nonce DROP NOT NULL;
    `);

  console.log("Table altered");
  process.exit();
}

alterTables();
