const { pool } = require("../config/db");

const GroupKeyModel = {
  async insertGroupKeys({ chatId, keys }, client) {
    const executor = client || pool;

    const values = [];
    const placeholders = keys.map((k, i) => {
      const base = i * 5;

      values.push(
        chatId,
        k.userId,
        k.encryptedKey,
        k.nonce,
        k.ephemeralPublicKey,
      );

      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
    });

    const query = `
    INSERT INTO group_keys
    (chat_id, user_id, encrypted_key, nonce, ephemeral_public_key)
    VALUES ${placeholders.join(",")}
  `;

    await executor.query(query, values);
  },
  async getGroupKey({ chatId, userId }, client) {
    const executor = client || pool;

    const query = `
    SELECT *
    FROM group_keys
    WHERE chat_id = $1 AND user_id = $2
    ORDER BY key_version DESC
    LIMIT 1
  `;

    const { rows } = await executor.query(query, [chatId, userId]);
    return rows[0];
  },

  async getGroupKeys({ chatId, userId }, client) {
    const executor = client || pool;

    const query = `
    SELECT key_version, encrypted_key, nonce, ephemeral_public_key
    FROM group_keys
    WHERE chat_id = $1 AND user_id = $2
    ORDER BY key_version ASC
  `;

    const { rows } = await executor.query(query, [chatId, userId]);
    return rows;
  },

  async rotateGroupKey({ chatId, keys }, client) {
    const executor = client || pool;

    await executor.query("BEGIN");

    // get next version
    const { rows } = await client.query(
      `SELECT key_version
   FROM group_keys
   WHERE chat_id = $1
   FOR UPDATE`,
      [chatId]
    );

    const version =
      (rows.length ? Math.max(...rows.map(r => r.key_version)) : 0) + 1;

    const values = [];
    const placeholders = keys.map((k, i) => {
      const base = i * 6;

      values.push(
        chatId,
        k.userId,
        k.encryptedKey,
        k.nonce,
        k.ephemeralPublicKey,
        version
      );

      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
    });

    const query = `
    INSERT INTO group_keys (
        chat_id,
        user_id, 
        encrypted_key,
        nonce,
        ephemeral_public_key, 
        key_version
    )
    VALUES ${placeholders.join(",")}
  `;

    await executor.query(query, values);

    await executor.query("COMMIT");

    return version;
  },
};

module.exports = GroupKeyModel;
