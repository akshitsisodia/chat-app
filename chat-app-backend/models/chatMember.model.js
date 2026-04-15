const { pool } = require("../config/db");
// const { v4: uuidv4 } = require("uuid");

const ChatMemberModel = {
  async addMember({ chat_id, user_id, role = "member" }, client) {
    const executor = client || pool;

    const query = `
        INSERT INTO chat_members 
        (chat_id, user_id, role)
        VALUES  ( $1, $2, $3)
        `;
    const values = [chat_id, user_id, role];

    executor.query(query, values);
  },

  async addMembers({ chatId, memberIds, adminId }, client) {
    const executor = client || pool;

    const values = [];
    const placeholders = memberIds.map((userId, i) => {
      const role = userId === adminId ? "admin" : "member";

      const base = i * 3;
      values.push(chatId, userId, role);

      return `($${base + 1}, $${base + 2}, $${base + 3})`;
    });

    const query = `
    INSERT INTO chat_members (chat_id, user_id, role)
    VALUES ${placeholders.join(",")}
  `;

    await executor.query(query, values);
  },

  async createMembers({ chatId, senderId, receiverId }, client) {
    const executor = client || pool;

    const query = `
        INSERT INTO chat_members 
        (chat_id, user_id)
        VALUES  ( $1, $2),
                ( $1, $3 )
        `;
    const values = [chatId, senderId, receiverId];

    executor.query(query, values);
  },

  async findChatByMember({ senderId }, client) {
    const executor = client || pool;

    const query = `
        SELECT chat_id
        FROM chat_members
        WHERE user_id IN ($1)
        GROUP BY chat_id
        HAVING COUNT(DISTINCT user_id) = 1;
        `;
    const values = [senderId];

    const { rows } = await executor.query(query, values);

    return rows[0]?.chat_id || null;
  },

  async findChatByMembers({ senderId, receiverId }, client) {
    const executor = client || pool;

    const query = `
        SELECT chat_id
        FROM chat_members
        WHERE user_id IN ($1, $2)
        GROUP BY chat_id
        HAVING COUNT(DISTINCT user_id) = 2;
        `;
    const values = [senderId, receiverId];

    const { rows } = await executor.query(query, values);

    return rows[0]?.chat_id || null;
  },

  // async findChat({ chatId, userId }, client) {
  //   const executor = client || pool;

  //   const query = `
  //   SELECT
  //   c.id AS chat_id,

  //   u.id AS user_id,
  //   u.public_key,
  //   u.name,
  //   u.photo,

  //   m.content AS last_message,
  //   m.created_at AS last_message_time,
  //   m.nonce,

  //   COALESCE(cu.unread_count, 0) AS unread_count

  //   FROM chats c

  //   JOIN chat_members cm
  //     ON cm.chat_id = c.id

  //   JOIN chat_members other_cm
  //     ON other_cm.chat_id = c.id
  //     AND other_cm.user_id != $1

  //   JOIN users u
  //     ON u.id = other_cm.user_id

  //   JOIN LATERAL (
  //     SELECT content, nonce, created_at
  //     FROM messages
  //     WHERE chat_id = c.id
  //     ORDER BY created_at DESC
  //     LIMIT 1
  //   ) m ON true

  //   LEFT JOIN chat_unreads cu
  //     ON cu.chat_id = c.id
  //       AND cu.user_id = $1

  //   WHERE cm.user_id = $1
  //     AND cm.chat_id = $2;
  //   `;

  //   const values = [userId, chatId];

  //   const { rows } = await executor.query(query, values);

  //   return rows[0];
  // },

  async findChatsByUID(userId, client) {
    const executor = client || pool;

    const query = `
   SELECT 
  c.id AS chat_id,
  c.type,

  CASE 
    WHEN c.type = 'group' THEN c.name
    ELSE u.name
  END AS chat_name,

  CASE 
    WHEN c.type = 'group' THEN c.photo
    ELSE u.photo
  END AS chat_photo,

  u.id AS user_id,
  u.name,
  u.photo,
  u.email,
  u.public_key,

  m.content AS last_message,
  m.nonce,
  m.created_at AS last_message_time,

  cu.unread_count

FROM chats c

JOIN chat_members my_cm
  ON my_cm.chat_id = c.id
 AND my_cm.user_id = $1

LEFT JOIN chat_members other_cm
  ON other_cm.chat_id = c.id
 AND other_cm.user_id != $1
 AND c.type = 'private'

LEFT JOIN users u
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

ORDER BY c.updated_at DESC;
    `;

    const { rows } = await executor.query(query, [userId]);
    return rows;
  },

  async findGroupsByUID(userId, client) {
    const executor = client || pool;

    const query = `
    SELECT 
      c.id AS chat_id,
      c.type,
      c.name AS chat_name,
      c.photo AS chat_photo,

      m.content AS last_message,
      m.nonce,
      m.created_at AS last_message_time,

      cu.unread_count

    FROM chats c

    JOIN chat_members cm
      ON cm.chat_id = c.id
      AND cm.user_id = $1

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

    WHERE c.type = 'group'

    ORDER BY c.updated_at DESC;
    `;

    const { rows } = await executor.query(query, [userId]);
    return rows;
  },

  async findReceiversByChatId({ chatId, senderId }, client) {
    const executor = client || pool;
    const query = `
    SELECT 
      cm.user_id,
      u.public_key,
      u.name,
      u.email,
      u.photo
    FROM chat_members cm
    JOIN users u 
      ON u.id = cm.user_id
    WHERE cm.chat_id = $1
      AND cm.user_id != $2
    `;

    const values = [chatId, senderId];

    const { rows } = await executor.query(query, values);
    return rows || null;
  },

  // async findChatProfile({ chatId, userId }, client) {
  //   const executor = client || pool;

  //   const query = `
  //   SELECT
  //   c. id AS chat_id,
  //   c.type,
  //   c.name AS chat_name,
  //   c.photo AS chat_photo,

  //   COALESCE(
  //     json_agg(
  //       jsonb_build_object(
  //         'id', u.id,
  //         'name', u.name,
  //         'photo', u.photo,
  //         'public_key', u.public_key,
  //         'role', cm.role
  //       )
  //     ) FILTER (WHERE u.id IS NOT NULL),
  //     '[]'
  //   ) AS members

  // FROM chats c

  // JOIN chat_members cm
  //   ON cm.chat_id = c.id

  // JOIN users u
  //   ON u.id = cm.user_id

  // WHERE c.id = $1
  //   AND EXISTS (
  //     SELECT 1
  //     FROM chat_members
  //     WHERE chat_id = c.id AND user_id = $2
  //   )

  //   GROUP BY c.id, c.type, c.name, c.photo;
  //   `;
  //   const values = [chatId, userId];

  //   const { rows } = await executor.query(query, values);
  //   return rows[0];
  // },

  async getChatMembers({ chatId, userId }, client) {
    const executor = client || pool;

    const query = `
  SELECT 
  cm.chat_id,

  json_agg(
    jsonb_build_object(
      'id', u.id,
      'name', u.name,
      'photo', u.photo,
      'email', u.email,
      'public_key', u.public_key,
      'role', cm.role
    )
  ) AS members

FROM chat_members cm

JOIN users u 
  ON u.id = cm.user_id

WHERE cm.chat_id = $1
  AND EXISTS (
    SELECT 1 
    FROM chat_members 
    WHERE chat_id = $1 AND user_id = $2
  )

GROUP BY cm.chat_id;
  `;
    const values = [chatId, userId];

    const { rows } = await executor.query(query, values);
    return rows[0];
  },
};

module.exports = ChatMemberModel;
