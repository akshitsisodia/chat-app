const { pool } = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const ChatModel = {
  async createChat() {
    const id = uuidv4();
    const query = `
        INSERT INTO chats (
        id ,
        created_at,
        updated_at
        )
        VALUES($1, NOW(), NOW())
        RETURNING id
        `;
    const values = [id];

    const { rows } = await pool.query(query, values);

    return rows[0]?.id || null;
  },

  async findById(id) {
    const query = `
        SELECT * FROM chats
        WHERE id = $1
        `;
    const values = [id];

    const { rows } = await pool.query(query, values);

    return rows[0]?.id || null;
  },

  async updateChat(chatId) {
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

    const { rows } = await pool.query(query, [chatId]);
    return rows[0]; // includes is_first_update
  },
};

module.exports = ChatModel;
