-- messages (already good)
CREATE INDEX idx_messages_chat_created
ON messages(chat_id, created_at DESC);

-- chat members
CREATE INDEX idx_chat_members_user
ON chat_members(user_id);

CREATE INDEX idx_chat_members_chat_status
ON chat_members(chat_id, status);

-- unread
CREATE INDEX idx_unreads_user
ON chat_unreads(user_id);

-- seen
CREATE INDEX idx_message_seen_user
ON message_seen(user_id);

-- group keys (optimized)
CREATE INDEX idx_group_keys_latest
ON group_keys(chat_id, user_id, key_version DESC);

-- private chat uniqueness
CREATE UNIQUE INDEX unique_pair_key_private
ON chats(pair_key)
WHERE type = 'private';