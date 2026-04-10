const { pool } = require("../config/db");
// const { v4: uuidv4 } = require("uuid");

const ChatMemberModel = {
  async createMember({ chatId, senderId }) {
    const query = `
        INSERT INTO chat_members 
        (chat_id, user_id)
        VALUES  ( $1, $2)
        `;
    const values = [chatId, senderId];

    pool.query(query, values);
  },
  async createMembers({ chatId, senderId, receiverId }) {
    const query = `
        INSERT INTO chat_members 
        (chat_id, user_id)
        VALUES  ( $1, $2),
                ( $1, $3 )
        `;
    const values = [chatId, senderId, receiverId];

    pool.query(query, values);
  },
  async findChatByMember({ senderId }) {
    const query = `
        SELECT chat_id
        FROM chat_members
        WHERE user_id IN ($1)
        GROUP BY chat_id
        HAVING COUNT(DISTINCT user_id) = 1;
        `;
    const values = [senderId];

    const { rows } = await pool.query(query, values);

    return rows[0]?.chat_id || null;
  },
  async findChatByMembers({ senderId, receiverId }) {
    const query = `
        SELECT chat_id
        FROM chat_members
        WHERE user_id IN ($1, $2)
        GROUP BY chat_id
        HAVING COUNT(DISTINCT user_id) = 2;
        `;
    const values = [senderId, receiverId];

    const { rows } = await pool.query(query, values);

    return rows[0]?.chat_id || null;
  },

  async findChat({ chatId, userId }) {
    const query = `
    SELECT 
    c.id AS chat_id,

    u.id AS user_id,
    u.public_key,
    u.name,
    u.photo,

    m.content AS last_message,
    m.created_at AS last_message_time,
    m.nonce,

    COALESCE(cu.unread_count, 0) AS unread_count

    FROM chats c

    JOIN chat_members cm 
      ON cm.chat_id = c.id

    JOIN chat_members other_cm 
      ON other_cm.chat_id = c.id 
      AND other_cm.user_id != $1

    JOIN users u 
      ON u.id = other_cm.user_id

    JOIN LATERAL (
      SELECT content, nonce, created_at
      FROM messages
      WHERE chat_id = c.id
      ORDER BY created_at DESC
      LIMIT 1
    ) m ON true

    LEFT JOIN chat_unreads cu
      ON cu.chat_id = c.id 
        AND cu.user_id = $1

    WHERE cm.user_id = $1 
      AND cm.chat_id = $2;
    `;

    const values = [userId, chatId];

    const { rows } = await pool.query(query, values);

    return rows[0];
  },

  async findChatsByUID(userId) {
    const query = `
    SELECT 
      c.id AS chat_id,

      u.id AS user_id,
      u.public_key,
      u.name,
      u.photo,

      m.content AS last_message,
      m.created_at AS last_message_time,
      m.nonce,

      cu.unread_count

    FROM chats c

    JOIN chat_members cm 
      ON cm.chat_id = c.id

    JOIN chat_members other_cm 
      ON other_cm.chat_id = c.id 
      AND other_cm.user_id != $1

    JOIN users u 
      ON u.id = other_cm.user_id

    LEFT JOIN LATERAL (
      SELECT content, nonce, created_at
      FROM messages
      WHERE chat_id = c.id
      ORDER BY created_at DESC
      LIMIT 1
    ) m ON true

    LEFT JOIN chat_unreads cu
      ON cu.chat_id = c.id 
         AND cu.user_id = $1

    WHERE cm.user_id = $1

    ORDER BY c.updated_at DESC;
  `;

    const { rows } = await pool.query(query, [userId]);
    return rows;
  },

  async findReceiver({ chatId, senderId }) {
    const query = `
    SELECT u.*
    FROM chat_members cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.chat_id = $1
    AND cm.user_id != $2;
    `;

    const values = [chatId, senderId];

    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  },
};

module.exports = ChatMemberModel;
