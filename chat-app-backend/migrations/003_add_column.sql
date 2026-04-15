-- ALTER TABLE users
-- ADD COLUMN verification_expires_at TIMESTAMP;

-- ALTER TABLE users
-- ALTER COLUMN verification_expires_at
-- TYPE TIMESTAMPTZ;

ALTER TABLE messages
            ALTER COLUMN nonce DROP NOT NULL;

ALTER TABLE chat_members ADD COLUMN role TEXT DEFAULT 'member';

 ALTER TABLE chats
          ADD COLUMN type TEXT DEFAULT 'private',
          ADD COLUMN name TEXT,
          ADD COLUMN photo TEXT,
          ADD COLUMN created_by UUID REFERENCES users(id),
          ADD COLUMN pair_key TEXT;