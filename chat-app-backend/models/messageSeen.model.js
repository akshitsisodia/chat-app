const { pool } = require("../config/db");

const MessageSeenModel = {
  async markSeen({ chatId, senderId }, client) {
    const executor = client || pool;

    const query = `
        INSERT INTO message_seen (message_id, user_id)
        SELECT id, $2
        FROM messages
        WHERE chat_id = $1
              AND sender_id != $2
        ON CONFLICT DO NOTHING;
    `;

    const values = [chatId, senderId];

    await executor.query(query, values);
  },
};

module.exports = MessageSeenModel;
