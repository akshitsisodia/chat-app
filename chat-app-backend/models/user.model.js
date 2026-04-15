const { pool } = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const UserModel = {
  async createUser({ name, email }, client) {
    const executor = client || pool;

    const id = uuidv4();
    const query = `
    INSERT INTO users(
    id,
    name,
    email,
    is_verified,
    is_active,
    login_attempts,
    created_at,
    updated_at
    )

    VALUES(
    $1, $2, $3,FALSE, TRUE, 0, NOW(), NOW()
    )
    `;

    const values = [id, name, email];

    const { rows } = await executor.query(query, values);
    return rows[0];
  },

  async findByEmail(email, client) {
    const executor = client || pool;

    const query = `
      SELECT *
      FROM users
      WHERE email = $1
      LIMIT 1;
    `;
    const { rows } = await executor.query(query, [email]);
    return rows[0];
  },

  async updateName({ email, name }, client) {
    const executor = client || pool;

    const query = `
      UPDATE users
        SET name= $2
      WHERE email = $1
    `;
    const values = [email, name];

    const { rows } = await executor.query(query, values);
    return rows[0];
  },

  async markVerified(email, client) {
    const executor = client || pool;

    const query = `
      UPDATE users
      SET is_verified = true,
          verification_expires_at = NOW() + INTERVAL '2 minutes',
          updated_at = NOW()
      WHERE email = $1
      RETURNING id, email, is_verified, updated_at, verification_expires_at;
    `;
    const values = [email];

    const { rows } = await executor.query(query, values);
    return rows[0];
  },
  async unmarkVerified({ id }, client) {
    const executor = client || pool;

    const query = `
      UPDATE users
      SET is_verified = false,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, email, is_verified, updated_at;
    `;
    const { rows } = await executor.query(query, [id]);
    return rows[0];
  },

  async setUser(
    { email, passwordHash, publicKey, encryptedPrivateKey, salt, iv },
    client,
  ) {
    const executor = client || pool;

    const query = `
        UPDATE users
        SET
            password_hash = $2,
            public_key = $3,
            encrypted_private_key = $4,
            salt = $5,
            iv = $6,
            updated_at = NOW()
        WHERE email = $1
            AND is_verified = true
            AND password_hash IS NULL
        RETURNING
          id,
          name,
          email,
          photo,
          public_key,
          is_active,
          created_at,
          updated_at;
      `;

    const values = [
      email,
      passwordHash,
      publicKey,
      encryptedPrivateKey,
      salt,
      iv,
    ];

    const { rows } = await executor.query(query, values);

    return rows[0];
  },

  async incrementLoginAttempts(id, client) {
    const executor = client || pool;

    const query = `
        UPDATE users
        SET login_attempts = login_attempts + 1,
            updated_at = NOW()
        WHERE id = $1
        RETURNING login_attempts, lockout_until;
      `;

    const { rows } = await executor.query(query, [id]);

    return rows[0];
  },

  async lockAccount(id, client) {
    const executor = client || pool;

    const query = `
        UPDATE users
        SET lockout_until = NOW() + INTERVAL '10 minutes',
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, lockout_until;
      `;

    const { rows } = await executor.query(query, [id]);

    return rows[0];
  },

  async resetLoginAttempts(id, client) {
    const executor = client || pool;

    const query = `
        UPDATE users
        SET login_attempts = 0,
            lockout_until = NULL,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id;
      `;

    const { rows } = await executor.query(query, [id]);

    return rows[0];
  },

  async findById(id, client) {
    const executor = client || pool;

    const query = `
        SELECT
          id,
          name,
          email,
          photo,
          public_key,
          is_active,
          login_attempts,
          lockout_until,
          created_at,
          updated_at
        FROM users
        WHERE id = $1
        LIMIT 1;
      `;

    const { rows } = await executor.query(query, [id]);

    return rows[0];
  },
  async findByIds(ids, client) {
    const executor = client || pool;

    const query = `
    SELECT id, public_key
    FROM users
    WHERE id = ANY($1::uuid[])
  `;

    const { rows } = await executor.query(query, [ids]);
    return rows;
  },

  async findUsers({ search, limit, skip }, client) {
    const executor = client || pool;

    const query = `
    SELECT 
      id,
      name,
      email,
      photo,
      public_key
    FROM users
    WHERE is_active = true
      AND (
        name ILIKE $1
        OR email ILIKE $1
        Or id = $2
      )
    LIMIT $3 OFFSET $4      
    `;

    const values = [`%${search}%`, Number(search) || null, limit, skip];

    const { rows } = await executor.query(query, values);
    return rows;
  },

  async countUsers({ search }, client) {
    const executor = client || pool;

    const query = `
    SELECT COUNT(*) 
    FROM users
    WHERE is_active = true
      AND (
        name ILIKE $1
        OR email ILIKE $1
        Or id = $2
      )
    `;
    const values = [`%${search}%`, Number(search) || null];

    const { rows } = await executor.query(query, values);

    return Number(rows[0].count);
  },

  //   async setPasswordResetToken(id, token, expiresAt) {
  //     const query = `
  //       UPDATE users
  //       SET password_reset_token = $2,
  //           password_reset_token_expires = $3,
  //           updated_at = NOW()
  //       WHERE id = $1
  //       RETURNING id;
  //     `;
  //     const { rows } = await pool.query(query, [id, token, expiresAt]);
  //     return rows[0];
  //   },

  //   async updatePassword(id, passwordHash) {
  //     const query = `
  //       UPDATE users
  //       SET password_hash = $2,
  //           password_changed_at = NOW(),
  //           password_reset_token = NULL,
  //           password_reset_token_expires = NULL,
  //           updated_at = NOW()
  //       WHERE id = $1
  //       RETURNING id, password_changed_at;
  //     `;
  //     const { rows } = await pool.query(query, [id, passwordHash]);
  //     return rows[0];
  //   },
};

module.exports = UserModel;
