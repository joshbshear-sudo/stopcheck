const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

let connection = null;

function getRedisConnection() {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

function createQueue(name) {
  return new Queue(name, { connection: getRedisConnection() });
}

function createWorker(name, processor, opts = {}) {
  return new Worker(name, processor, {
    connection: getRedisConnection(),
    ...opts,
  });
}

module.exports = { getRedisConnection, createQueue, createWorker };
