const { pool } = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const FileModel = {
  async create({ message_id, url, type, name, encrypted_key, iv, nonce }) {
    const query = `
    INSERT INTO message_files (message_id, url, type, name, encrypted_key, iv, file_nonce)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *
    `;
    const values = [message_id, url, type, name, encrypted_key, iv, nonce];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },
  // async create({}) {
  //   const query = ``;
  //   const values = [];
  //   const { rows } = await pool.query(query, values);
  //   return rows[0];
  // },
};

module.exports = FileModel;
