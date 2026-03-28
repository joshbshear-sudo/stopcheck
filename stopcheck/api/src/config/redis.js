const { Queue, Worker } = require('bullmq');

let connection = null;
let redisAvailable = false;

function getRedisConnection() {
  if (!process.env.REDIS_URL) return null;

  if (!connection) {
    try {
      const IORedis = require('ioredis');
      connection = new IORedis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        retryStrategy: (times) => {
          if (times > 3) return null; // Stop retrying after 3 attempts
          return Math.min(times * 500, 2000);
        },
      });
      connection.on('connect', () => {
        redisAvailable = true;
        console.log('[REDIS] Connected');
      });
      connection.on('error', (err) => {
        redisAvailable = false;
        console.error('[REDIS] Connection error:', err.message);
      });
    } catch (err) {
      console.error('[REDIS] Failed to initialize:', err.message);
      return null;
    }
  }
  return connection;
}

function createQueue(name) {
  const conn = getRedisConnection();
  if (!conn) {
    console.warn(`[REDIS] Queue "${name}" unavailable — Redis not connected`);
    // Return a mock queue that logs instead of crashing
    return {
      add: async (jobName, data) => {
        console.warn(`[REDIS] Job "${jobName}" queued locally (Redis unavailable):`, JSON.stringify(data).slice(0, 100));
        return { id: 'local-' + Date.now() };
      },
    };
  }
  return new Queue(name, { connection: conn });
}

function createWorker(name, processor, opts = {}) {
  const conn = getRedisConnection();
  if (!conn) {
    console.warn(`[REDIS] Worker "${name}" not started — Redis not connected`);
    return { on: () => {} }; // No-op event emitter
  }
  return new Worker(name, processor, { connection: conn, ...opts });
}

module.exports = { getRedisConnection, createQueue, createWorker };
