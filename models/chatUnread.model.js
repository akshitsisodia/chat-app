const { pool } = require("../config/db");

const ChatUnreads = {
  // async createOrupdateUnreads({ chatId, receiverId }, client) {
  //   const executor = client || pool;

  //   const query = `
  //   INSERT INTO chat_unreads (chat_id, user_id, unread_count)
  //   VALUES ($1, $2, 1)
  //   ON CONFLICT (chat_id, user_id)
  //   DO UPDATE
  //   SET unread_count = chat_unreads.unread_count + 1
  //   RETURNING unread_count
  //   `;

  //   const { rows } = await executor.query(query, [chatId, receiverId]);

  //   return rows[0]?.unread_count || 0;
  // },

  async createOrupdateUnreads({ chatId, receiverIds }, client) {
    const executor = client || pool;
    const query = `
    INSERT INTO chat_unreads (chat_id, user_id, unread_count)
SELECT 
  $1 AS chat_id,
  user_id,
  1
FROM (
  SELECT DISTINCT user_id
  FROM UNNEST($2::uuid[]) AS user_id
) t

ON CONFLICT (chat_id, user_id)
DO UPDATE
SET unread_count = chat_unreads.unread_count + EXCLUDED.unread_count;
  `;

    await executor.query(query, [chatId, receiverIds]);
  },

  async resetUnreads({ chatId, senderId }, client) {
    const executor = client || pool;

    const query = `
        UPDATE chat_unreads
        SET unread_count = 0
        WHERE chat_id = $1
            AND user_id = $2;
    `;

    const values = [chatId, senderId];

    const { rows } = await executor.query(query, values);

    return rows[0];
  },
};
module.exports = ChatUnreads;
