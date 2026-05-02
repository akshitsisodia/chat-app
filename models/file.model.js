const { pool } = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const FileModel = {
  async create(
    { message_id, url, type, name, encrypted_key, iv, file_nonce },
    client,
  ) {
    const executor = client || pool;
    const query = `
    INSERT INTO message_files (message_id, url, type, name, encrypted_key, iv, file_nonce)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *
    `;
    const values = [message_id, url, type, name, encrypted_key, iv, file_nonce];
    const { rows } = await executor.query(query, values);
    return rows[0];
  },

};

module.exports = FileModel;
