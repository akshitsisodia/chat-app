CREATE INDEX IF NOT EXISTS idx_group_keys_chat_user
ON group_keys(chat_id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS unique_pair_key ON chats(pair_key);

CREATE UNIQUE INDEX IF NOT EXISTS unique_pair_key ON chats(pair_key);