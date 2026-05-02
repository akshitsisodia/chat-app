const pg = require("pg");
const { Pool } = pg;

let credentials;

const user = process.env?.PG_USER;
const host = process.env?.PG_HOST;
const database = process.env?.PG_DATABASE;
const password = process.env?.PG_PASS;
const port = process.env?.PG_PORT;
const url = process.env?.DATABASE_URL;

if (process.env.NODE_ENV === "production") {
  credentials = {
    connectionString: url,
    ssl: {
      rejectUnauthorized: false,
    },
  };
} else {
  credentials = {
    user,
    host,
    database,
    password,
    port,
  };
}
const pool = new Pool(credentials);

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
