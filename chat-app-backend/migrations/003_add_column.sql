-- ALTER TABLE users
-- ADD COLUMN verification_expires_at TIMESTAMP;

ALTER TABLE users
ALTER COLUMN verification_expires_at
TYPE TIMESTAMPTZ;