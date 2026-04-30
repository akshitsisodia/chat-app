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

async function indexTables() {
  await pool.query(`
           CREATE INDEX IF NOT EXISTS idx_group_keys_chat_user
ON group_keys(chat_id, user_id);
    `);
  // await pool.query(`
  //          CREATE UNIQUE INDEX unique_pair_key ON chats(pair_key);
  //   `);

  //   await pool.query(`
  //            CREATE UNIQUE INDEX unique_pair_key ON chats(pair_key);
  //     `);

  // 30 april updates 
  // await pool.query(`
  //           CREATE INDEX idx_chat_members_active
  //           ON chat_members (chat_id, status);
  //     `);


  console.log("index added to table");
  process.exit();
}

indexTables();
