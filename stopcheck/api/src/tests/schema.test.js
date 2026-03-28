const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

describe('Database Schema Validation', () => {
  it('contains all 7 required tables', () => {
    const tables = [
      'organizations', 'events', 'stop_signs', 'riders',
      'oauth_tokens', 'compliance_results', 'rider_summaries',
    ];
    for (const t of tables) {
      assert.ok(schema.includes(`CREATE TABLE ${t}`), `Missing table: ${t}`);
    }
  });

  it('events table has event_window_start and event_window_end columns', () => {
    assert.ok(schema.includes('event_window_start'));
    assert.ok(schema.includes('event_window_end'));
  });

  it('stop_signs table has crossing_guard columns', () => {
    assert.ok(schema.includes('crossing_guard'));
    assert.ok(schema.includes('guard_confirmed_by'));
    assert.ok(schema.includes('guard_confirmed_at'));
  });

  it('compliance_results supports guard_waived status', () => {
    assert.ok(schema.includes('guard_waived'));
  });

  it('oauth_tokens has unique constraint on rider_id + platform', () => {
    assert.ok(schema.includes('UNIQUE(rider_id, platform)'));
  });

  it('oauth_tokens references riders with ON DELETE CASCADE', () => {
    assert.ok(schema.includes('REFERENCES riders(id) ON DELETE CASCADE'));
  });

  it('uses UUID primary keys with gen_random_uuid()', () => {
    const uuidCount = (schema.match(/gen_random_uuid\(\)/g) || []).length;
    assert.ok(uuidCount >= 7, `Expected >=7 UUID defaults, found ${uuidCount}`);
  });

  it('uses parameterized-safe column types (no raw text interpolation)', () => {
    // Ensure no string concatenation patterns that would indicate SQL injection risk
    assert.ok(!schema.includes('||'), 'Schema should not use string concatenation');
  });

  it('rider_summaries has dq_confirmed and dq_confirmed_by columns', () => {
    assert.ok(schema.includes('dq_confirmed'));
    assert.ok(schema.includes('dq_confirmed_by'));
    assert.ok(schema.includes('dq_confirmed_at'));
  });

  it('has appropriate indexes', () => {
    assert.ok(schema.includes('idx_events_org'));
    assert.ok(schema.includes('idx_riders_auth_token'));
    assert.ok(schema.includes('idx_oauth_tokens_rider'));
    assert.ok(schema.includes('idx_compliance_results_rider'));
  });
});
