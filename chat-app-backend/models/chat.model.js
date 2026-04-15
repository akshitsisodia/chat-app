const { pool } = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const CustomError = require("../utils/CustomError");

const ChatModel = {
  async createChat({ pairKey }, client) {
    const executor = client || pool;

    const id = uuidv4();

    const query = `
      INSERT INTO chats (
        id,
        type,
        created_at,
        updated_at,
        pair_key
      )
      VALUES ($1, 'private', NOW(), NOW(), $2)
      RETURNING *
    `;

    const values = [id, pairKey];

    const { rows } = await executor.query(query, values);

    return rows[0] || null;
  },

  async create({ type, name, photo, created_by, pair_key }, client) {
    const executor = client || pool;
    const id = uuidv4();

    if (type === "private" && !pair_key) {
      throw new CustomError("pair_key required for private chat", 400);
    }

    if (type === "group") {
      pair_key = null;
    }

    const query = `
      INSERT INTO chats (
        id,
        type,
        name,
        photo,
        created_by,
        created_at,
        updated_at,
        pair_key
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6)
      RETURNING *
    `;

    const values = [id, type, name, photo, created_by, pair_key];

    const { rows } = await executor.query(query, values);

    return rows[0] || null;
  },

  async findById(id, client) {
    const executor = client || pool;
    const query = `
        SELECT * FROM chats
        WHERE id = $1
        `;
    const values = [id];

    const { rows } = await executor.query(query, values);

    return rows[0]?.id || null;
  },

  async findByPairKey(pair_key, client) {
    const executor = client || pool;

    const query = `
    SELECT * FROM chats
    WHERE pair_key = $1
    LIMIT 1
    `;
    const values = [pair_key];

    const { rows } = await executor.query(query, values);

    return rows[0] || null;
  },

  async updateChat(chatId, client) {
    const executor = client || pool;

    const query = `
    WITH prev AS (
      SELECT id, (created_at = updated_at) AS is_first_update
      FROM chats
      WHERE id = $1
    )
    UPDATE chats
    SET updated_at = NOW()
    WHERE id = $1
    RETURNING id,
              (SELECT is_first_update FROM prev) AS is_first_update;
`;

    const { rows } = await executor.query(query, [chatId]);
    return rows[0]; // includes is_first_update
  },
};

module.exports = ChatModel;
