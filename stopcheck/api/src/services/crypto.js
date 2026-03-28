/**
 * AES-256-GCM encryption for OAuth tokens.
 * Key comes from TOKEN_ENCRYPTION_KEY env var ONLY — never hardcoded, never logged.
 * Per spec section 11.3.
 */
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey() {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is not set');
  }
  // Key must be 32 bytes (256 bits) — accept hex or base64
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  if (key.length === 44) {
    return Buffer.from(key, 'base64');
  }
  // Raw 32-byte key
  const buf = Buffer.from(key, 'utf-8');
  if (buf.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes (256 bits)');
  }
  return buf;
}

function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const tag = cipher.getAuthTag();

  // Format: iv:tag:ciphertext (all hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(encryptedStr) {
  const key = getKey();
  const parts = encryptedStr.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const tag = Buffer.from(parts[1], 'hex');
  const encrypted = Buffer.from(parts[2], 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };
