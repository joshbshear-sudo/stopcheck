const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

// Set test encryption key (32 bytes hex = 64 chars)
process.env.TOKEN_ENCRYPTION_KEY = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';

const { encrypt, decrypt } = require('../services/crypto');

describe('AES-256-GCM Token Encryption', () => {
  it('encrypts and decrypts a token correctly', () => {
    const original = 'strava_access_token_abc123xyz';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    assert.equal(decrypted, original);
  });

  it('produces different ciphertext for same plaintext (random IV)', () => {
    const token = 'same_token_value';
    const enc1 = encrypt(token);
    const enc2 = encrypt(token);
    assert.notEqual(enc1, enc2);
    // But both decrypt to same value
    assert.equal(decrypt(enc1), token);
    assert.equal(decrypt(enc2), token);
  });

  it('encrypted format is iv:tag:ciphertext in hex', () => {
    const encrypted = encrypt('test');
    const parts = encrypted.split(':');
    assert.equal(parts.length, 3);
    // IV = 12 bytes = 24 hex chars
    assert.equal(parts[0].length, 24);
    // Tag = 16 bytes = 32 hex chars
    assert.equal(parts[1].length, 32);
    // Ciphertext length > 0
    assert.ok(parts[2].length > 0);
  });

  it('rejects tampered ciphertext', () => {
    const encrypted = encrypt('secret_token');
    // Tamper with the ciphertext portion
    const parts = encrypted.split(':');
    parts[2] = 'ff' + parts[2].slice(2);
    const tampered = parts.join(':');
    assert.throws(() => decrypt(tampered));
  });

  it('rejects invalid format', () => {
    assert.throws(() => decrypt('not:valid'));
    assert.throws(() => decrypt(''));
  });

  it('handles empty string token', () => {
    const encrypted = encrypt('');
    const decrypted = decrypt(encrypted);
    assert.equal(decrypted, '');
  });

  it('handles long tokens', () => {
    const longToken = 'a'.repeat(2048);
    const encrypted = encrypt(longToken);
    const decrypted = decrypt(encrypted);
    assert.equal(decrypted, longToken);
  });
});

describe('Encryption key validation', () => {
  it('throws if TOKEN_ENCRYPTION_KEY is not set', () => {
    const saved = process.env.TOKEN_ENCRYPTION_KEY;
    delete process.env.TOKEN_ENCRYPTION_KEY;
    assert.throws(() => encrypt('test'), /TOKEN_ENCRYPTION_KEY/);
    process.env.TOKEN_ENCRYPTION_KEY = saved;
  });
});
