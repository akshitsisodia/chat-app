-- ALTER TABLE users
-- ADD COLUMN verification_expires_at TIMESTAMP;

-- ALTER TABLE users
-- ALTER COLUMN verification_expires_at
-- TYPE TIMESTAMPTZ;

-- ALTER TABLE messages
--             ALTER COLUMN nonce DROP NOT NULL;

-- ALTER TABLE chat_members ADD COLUMN role TEXT DEFAULT 'member';

--  ALTER TABLE chats
--           ADD COLUMN type TEXT DEFAULT 'private',
--           ADD COLUMN name TEXT,
--           ADD COLUMN photo TEXT,
--           ADD COLUMN created_by UUID REFERENCES users(id),
--           ADD COLUMN pair_key TEXT;


    -- ALTER TABLE messages 
    --     ADD COLUMN key_version INT NULL;

    --    ALTER TABLE chat_members
    --        ADD COLUMN status TEXT NOT NULL DEFAULT 'active',
    --        ADD COLUMN joined_at TIMESTAMP DEFAULT NOW(),
    --        ADD COLUMN left_at TIMESTAMP;


    --   ALTER TABLE messages
    --         ADD COLUMN message_type TEXT NOT NULL DEFAULT 'user' 


    --   ALTER TABLE chat_members
    --       ADD CONSTRAINT chat_members_status_check
    --       CHECK (status IN ('active', 'left', 'removed', 'banned'));            