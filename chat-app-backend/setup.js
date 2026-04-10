const { pool } = require("./config/db");

async function createTables() {
  // users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        is_verified BOOLEAN DEFAULT FALSE,
        password_hash TEXT,
        photo TEXT DEFAULT 'https://i.pinimg.com/736x/62/01/0d/62010d848b790a2336d1542fcda51789.jpg',
        public_key TEXT,
        encrypted_private_key TEXT,
        salt TEXT,
        iv TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        login_attempts INTEGER DEFAULT 0 CHECK (login_attempts <= 5),
        lockout_until TIMESTAMP,
        password_reset_token TEXT,
        password_reset_token_expires TIMESTAMP,
        password_changed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // otp codes table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS otp_codes 
    (
        id UUID PRIMARY KEY,
        email TEXT NOT NULL,
        otp TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        attempts INTEGER DEFAULT 0
    )
    `);

  // chats table
  await pool.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
      `);

  // chat menmbers table
  await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_members (
        chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (chat_id, user_id)
      );
      `);

  // messages table
  await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id),
        content TEXT,
        nonce TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      `);

  // unreads
  await pool.query(`
     CREATE TABLE IF NOT EXISTS chat_unreads (
      chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      unread_count INT DEFAULT 0,
      PRIMARY KEY (chat_id, user_id)
    );
  `);

  // seen
  await pool.query(`
   CREATE TABLE IF NOT EXISTS message_seen (
      message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (message_id, user_id)
    );
  `);

  // files_message
  await pool.query(`
   CREATE TABLE IF NOT EXISTS message_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type TEXT,       
    name TEXT,
    size INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
  );
  `);

  console.log("users Tables created");
  process.exit();
}

createTables();
