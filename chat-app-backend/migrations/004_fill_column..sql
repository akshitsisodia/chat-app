WITH pairs AS (
  SELECT
    cm.chat_id,
    string_agg(cm.user_id::text, '_' ORDER BY cm.user_id::text) AS pair_key,
    count(*) AS member_count
  FROM chat_members cm
  GROUP BY cm.chat_id
)
UPDATE chats c
SET pair_key = p.pair_key
FROM pairs p
WHERE c.id = p.chat_id
  AND p.member_count = 2;