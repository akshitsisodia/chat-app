// runMigration.js
const fs = require("fs");
const pkg = require("pg");

const { Pool } = pkg;

const pool = new Pool({
  connectionString:"postgresql://chat_user:fCZIGyyEwI8X4s16HbxQKg0iSjE2h7cZ@dpg-d7cac08sfn5c73cc1l40-a.singapore-postgres.render.com/chat_app_u9o2",
  ssl: { rejectUnauthorized: false },
});

const sql = fs.readFileSync("./migrations/001_init.sql", "utf-8");
// const sql = fs.readFileSync("./migrations/002_indexes.sql", "utf-8");
// const sql = fs.readFileSync("./migrations/003_add_column.sql", "utf-8");
// const sql = fs.readFileSync("./migrations/005_delete.sql", "utf-8");

(async () => {
  try {
    await pool.query(sql);
    console.log("Migration ran successfully");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
})();
