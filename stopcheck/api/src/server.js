// Load .env for local development; Railway injects env vars directly
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '..', '.env') });

// Log env var presence at startup (not values — security)
console.log('[STARTUP] JWT_SECRET set:', !!process.env.JWT_SECRET);
console.log('[STARTUP] DATABASE_URL set:', !!process.env.DATABASE_URL);
console.log('[STARTUP] NODE_ENV:', process.env.NODE_ENV);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const { generalLimiter } = require('./middleware/rateLimiter');
const { createWorker } = require('./config/redis');
const { processFit } = require('./jobs/processFit');
const { startCleanupSchedule } = require('./jobs/tokenCleanup');

const app = express();

// Trust Railway's load balancer for correct IP in rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(generalLimiter);

// Body parsing — webhooks need raw body for signature verification
app.use('/api/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '5mb' }));

// Routes
app.use('/api/organizations', require('./routes/organizations'));

// Podium endpoint — no auth required, mounted before events router
app.use('/api/podium', require('./routes/podium'));
app.use('/api/sponsorships', require('./routes/sponsorships'));
app.use('/api/email', require('./routes/emailPreview'));

app.use('/api/events', require('./routes/events'));
app.use('/api/events', require('./routes/stopSigns'));
app.use('/api/events', require('./routes/riders'));
app.use('/api/rider', require('./routes/riders'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/webhooks/stripe', require('./routes/stripeWebhook'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/overpass', require('./routes/overpass'));
app.use('/api/events', require('./routes/export'));
app.use('/api/oauth/strava', require('./routes/oauth/strava'));
app.use('/api/oauth/garmin', require('./routes/oauth/garmin'));
app.use('/api/oauth/wahoo', require('./routes/oauth/wahoo'));
app.use('/api/auth/wahoo', require('./routes/oauth/wahoo'));  // Wahoo dashboard registered this path

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), app_url: process.env.APP_URL || 'NOT SET' });
});

// Engine spawn check — verifies the Python detection engine is reachable from
// the container. Imports the module via `python -c` so it covers the same
// path resolution processFit.js uses (no FIT file required).
app.get('/api/health/engine', (req, res) => {
  const { execFile } = require('child_process');
  const enginePath = require('path').resolve(__dirname, '..', '..', '..', 'engine');
  execFile(
    'python',
    ['-c', 'import sys, stopcheck_engine; print(stopcheck_engine.__file__); print(sys.version)'],
    { cwd: enginePath, timeout: 10000 },
    (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          error: err.message,
          stderr: stderr || null,
          cwd: enginePath,
        });
      }
      const [enginePathLine, pythonVersion] = stdout.trim().split('\n');
      res.json({
        ok: true,
        engine_path: enginePathLine,
        python_version: pythonVersion,
        cwd: enginePath,
      });
    }
  );
});

// Serve React frontend (production build)
const WEB_DIST = path.resolve(__dirname, '..', '..', 'web', 'dist');
if (fs.existsSync(WEB_DIST)) {
  app.use(express.static(WEB_DIST));

  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(WEB_DIST, 'index.html'));
    }
  });
}

// Start server
const PORT = process.env.PORT || 3000;

function start() {
  app.listen(PORT, () => {
    console.log(`StopCheck API running on port ${PORT}`);
  });

  // Start BullMQ worker for FIT processing
  if (process.env.REDIS_URL) {
    const worker = createWorker('process_fit', async (job) => {
      return processFit(job);
    }, { concurrency: 5 });

    worker.on('completed', (job, result) => {
      console.log(`FIT processing completed for job ${job.id}:`, result);
    });

    worker.on('failed', (job, err) => {
      console.error(`FIT processing failed for job ${job.id}:`, err.message);
    });

    // Start token cleanup schedule (every 6 hours)
    startCleanupSchedule();
  }

  // Start email reminder schedule (hourly check, independent of Redis)
  const { startEmailSchedule } = require('./jobs/emailJobs');
  startEmailSchedule();
}

// Export for testing
module.exports = { app, start };

if (require.main === module) {
  start();
}
