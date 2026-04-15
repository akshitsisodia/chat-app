const { pool } = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const MessageModel = {
  async create({ chatId, senderId, content, nonce }, client) {
    const executor = client || pool;

    const id = uuidv4();

    const query = `
    INSERT INTO messages (
    id,
    chat_id,
    sender_id,
    content,
    nonce,
    created_at
    )
    VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    NOW()
    )
    RETURNING *
    `;

    const values = [id, chatId, senderId, content, nonce];

    const { rows } = await executor.query(query, values);

    return rows[0];
  },

  async find({ chatId, senderId, limit, offset }, client) {
    const executor = client || pool;

    const query = `
    SELECT
    m.id,
    m.content,
    m.nonce,
    m.sender_id,
    m.created_at,

    COALESCE(f.files, '[]') AS files,

    EXISTS (
      SELECT 1
      FROM message_seen ms
      WHERE ms.message_id = m.id
        AND ms.user_id != $2
    ) AS seen

    FROM messages m

    LEFT JOIN (
      SELECT
        mf.message_id,
        json_agg(
          json_build_object(
            'url', mf.url,
            'name', mf.name,
            'type', mf.type,
            'file_nonce', mf.file_nonce,
            'encrypted_key', mf.encrypted_key,
            'iv', mf.iv
          )
        ) AS files
      FROM message_files mf
      GROUP BY mf.message_id
    ) f ON f.message_id = m.id

    WHERE m.chat_id = $1
    ORDER BY m.created_at DESC
    LIMIT $3 OFFSET $4;
    `;

    const values = [chatId, senderId, limit, offset];

    try {
      const { rows } = await executor.query(query, values);

      return rows;
    } catch (error) {
      console.log(error);
    }
  },

  async countMessages({ chatId }, client) {
    const executor = client || pool;

    const query = `
        SELECT COUNT(*) 
        FROM messages
        WHERE chat_id = $1
    `;

    const values = [chatId];

    const { rows } = await executor.query(query, values);

    return Number(rows[0].count);
  },
};

module.exports = MessageModel;
