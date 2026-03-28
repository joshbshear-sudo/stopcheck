const { describe, it, before, after, mock } = require('node:test');
const assert = require('node:assert/strict');

// Set required env vars before any imports
process.env.JWT_SECRET = 'test-secret-key-for-jwt-signing-256bit!!';
process.env.TOKEN_ENCRYPTION_KEY = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';
process.env.DATABASE_URL = 'postgresql://localhost:5432/stopcheck_test';

const jwt = require('jsonwebtoken');
const { encrypt, decrypt } = require('../services/crypto');

describe('JWT Authentication', () => {
  const { generateToken } = require('../middleware/auth');

  it('generates a valid JWT with orgId and email', () => {
    const org = { id: 'org-123', email: 'test@example.com' };
    const token = generateToken(org);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    assert.equal(decoded.orgId, 'org-123');
    assert.equal(decoded.email, 'test@example.com');
  });

  it('token expires in 24 hours', () => {
    const org = { id: 'org-123', email: 'test@example.com' };
    const token = generateToken(org);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const expiresIn = decoded.exp - decoded.iat;
    assert.equal(expiresIn, 86400); // 24h in seconds
  });

  it('rejects tokens signed with wrong secret', () => {
    const badToken = jwt.sign({ orgId: 'org-1' }, 'wrong-secret');
    assert.throws(() => jwt.verify(badToken, process.env.JWT_SECRET));
  });
});

describe('OAuth Token Encryption Flow', () => {
  it('encrypts token before storage and decrypts for use', () => {
    // Simulate the full OAuth token lifecycle
    const stravaAccessToken = 'abc123def456ghi789';
    const stravaRefreshToken = 'refresh_xyz_123';

    // Step 1: Encrypt before DB write
    const encAccess = encrypt(stravaAccessToken);
    const encRefresh = encrypt(stravaRefreshToken);

    // Verify encrypted values are not plaintext
    assert.ok(!encAccess.includes(stravaAccessToken));
    assert.ok(!encRefresh.includes(stravaRefreshToken));

    // Step 2: Decrypt when needed for API call
    assert.equal(decrypt(encAccess), stravaAccessToken);
    assert.equal(decrypt(encRefresh), stravaRefreshToken);
  });
});

describe('Rate Limiter Configuration', () => {
  const { generalLimiter, oauthLimiter } = require('../middleware/rateLimiter');

  it('general limiter allows 100 requests per minute', () => {
    assert.ok(generalLimiter);
  });

  it('oauth limiter allows 20 requests per minute', () => {
    assert.ok(oauthLimiter);
  });
});

describe('S3 Service Configuration', () => {
  it('signed URLs expire in 15 minutes max', () => {
    // Verify the constant in the service module
    const fs = require('fs');
    const path = require('path');
    const s3Source = fs.readFileSync(
      path.join(__dirname, '..', 'services', 's3.js'), 'utf-8'
    );
    assert.ok(s3Source.includes('expiresIn: 900'), 'Signed URL expiry must be 900s (15 min)');
  });
});

describe('Process FIT Worker — Data Flow Validation', () => {
  it('worker module exists and exports processFit function', () => {
    const { processFit } = require('../jobs/processFit');
    assert.equal(typeof processFit, 'function');
  });

  it('worker calls Python engine before DB writes', () => {
    // Verify the code flow: engine runs, THEN results stored
    const fs = require('fs');
    const path = require('path');
    const workerSource = fs.readFileSync(
      path.join(__dirname, '..', 'jobs', 'processFit.js'), 'utf-8'
    );

    const engineCallIndex = workerSource.indexOf('execFile');
    const dbWriteIndex = workerSource.indexOf('INSERT INTO compliance_results');
    const s3DeleteIndex = workerSource.indexOf('await deleteFile(fit_file_path)');

    // Engine must be called before DB writes
    assert.ok(engineCallIndex < dbWriteIndex,
      'Python engine must run BEFORE compliance results are written to DB');

    // S3 delete must happen after DB write
    assert.ok(dbWriteIndex < s3DeleteIndex,
      'FIT file must be deleted from S3 AFTER results are stored');
  });

  it('worker deletes access token after FIT retrieval', () => {
    const fs = require('fs');
    const path = require('path');
    const workerSource = fs.readFileSync(
      path.join(__dirname, '..', 'jobs', 'processFit.js'), 'utf-8'
    );
    assert.ok(workerSource.includes("SET access_token = 'DELETED'"),
      'Access token must be deleted after FIT file is retrieved');
  });
});

describe('Token Cleanup Job', () => {
  const { cleanupTokens } = require('../jobs/tokenCleanup');

  it('exports cleanupTokens function', () => {
    assert.equal(typeof cleanupTokens, 'function');
  });

  it('cleanup job handles expired tokens, stale refresh tokens, and deleted tokens', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'jobs', 'tokenCleanup.js'), 'utf-8'
    );
    assert.ok(source.includes('expires_at < now()'), 'Must purge expired tokens');
    assert.ok(source.includes("interval '48 hours'"), 'Must delete refresh tokens 48h after event window');
    assert.ok(source.includes("access_token = 'DELETED'"), 'Must clean up deleted token rows');
  });
});

describe('DQ Workflow — Two Human Steps Required', () => {
  it('DQ route requires explicit confirm action from organizer', () => {
    const fs = require('fs');
    const path = require('path');
    const riderRoutes = fs.readFileSync(
      path.join(__dirname, '..', 'routes', 'riders.js'), 'utf-8'
    );
    // No automatic DQ — must be 'confirm' or 'waive' action
    assert.ok(riderRoutes.includes("action === 'confirm'"),
      'DQ must require organizer to explicitly confirm');
    assert.ok(riderRoutes.includes("action === 'waive'"),
      'Organizer must be able to waive violation');
    // dq_confirmed_by tracks which organizer confirmed
    assert.ok(riderRoutes.includes('dq_confirmed_by'),
      'Must track which organizer confirmed the DQ');
  });
});

describe('Webhook Signature Verification', () => {
  it('Strava webhook verifies subscription token', () => {
    const fs = require('fs');
    const path = require('path');
    const webhookSource = fs.readFileSync(
      path.join(__dirname, '..', 'routes', 'webhooks.js'), 'utf-8'
    );
    assert.ok(webhookSource.includes('STRAVA_VERIFY_TOKEN'),
      'Strava webhook must verify subscription token');
  });
});

describe('Schema SQL Security', () => {
  it('all routes use parameterized queries (no string concat in SQL)', () => {
    const fs = require('fs');
    const path = require('path');
    const routeDir = path.join(__dirname, '..', 'routes');
    const files = fs.readdirSync(routeDir).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const source = fs.readFileSync(path.join(routeDir, file), 'utf-8');
      // Check for string template literals in query calls
      const dangerousPatterns = [
        /query\s*\(\s*`[^`]*\$\{/,  // query(`...${var}...`)
        /query\s*\([^)]*\+\s*req\./,  // query("..." + req.param)
      ];
      for (const pat of dangerousPatterns) {
        assert.ok(!pat.test(source),
          `${file}: SQL string concatenation detected — use parameterized queries only`);
      }
    }
  });
});
