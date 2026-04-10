const { pool } = require("./config/db");

async function dropTables() {

  // await pool.query(`
  //         DROP TABLE IF EXISTS messages
  //         `);
  // await pool.query(`
  //         DELETE FROM messages;
  //         `);

  console.log("chats Tables rows dropped");
  process.exit();
}

dropTables();
