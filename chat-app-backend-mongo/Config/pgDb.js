const pkg = require("pg");
const { Pool } = pkg;

const user = process.env.PG_USER || "postgres";
const host = process.env.PG_HOST || "localhost";
const database = process.env.PG_DATABASE || "chat_app";
const password = process.env.PG_PASS || "akshit";
const port = process.env.PG_PORT || 5432;

const pool = new Pool({
  user,
  host,
  database,
  password,
  port,
});

async function initDB() {
  try {
    const res = await pool.query("SELECT 1");
    console.log("PostgreSQL connected");
  } catch (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1); // stop app if DB not connected
  }
}

module.exports = { pool, initDB };
