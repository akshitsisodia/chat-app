const { pool } = require("../config/db");
const { v4: uuidv4 } = require("uuid");

const OtpModel = {
  async create({ email, otp }) {
    const id = uuidv4();

    await pool.query(`DELETE FROM otp_codes WHERE email = $1`, [email]);

    const query = `
    INSERT INTO otp_codes (
        id,
        email,
        otp,
        expires_at,
        created_at
    )
    VALUES($1, $2, $3, NOW() + INTERVAL '2 minutes', NOW())
    RETURNING id, email, otp, expires_at;
    `;

    const values = [id, email, otp];

    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async verifyOtp({ email, otp }) {
    const query = `
    SELECT *
    FROM otp_codes
    WHERE email = $1
    AND otp = $2
    AND expires_at > NOW()
    LIMIT 1;
  `;

    const { rows } = await pool.query(query, [email, otp]);

    return rows[0];
  },

  async updateOtpAttempts({ email }) {
    const query = `
    UPDATE otp_codes
    SET attempts = attempts + 1
    WHERE id = (
      SELECT id FROM otp_codes
      WHERE email = $1
      AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    )
    RETURNING attempts;
  `;

    const { rows } = await pool.query(query, [email]);
    return rows[0];
  },

  async deleteOtp({ id }) {
    const query = `
    DELETE FROM otp_codes
    WHERE id = $1
    RETURNING id;
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },
};

module.exports = OtpModel;
