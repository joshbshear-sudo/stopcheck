const rateLimit = require('express-rate-limit');

// Per spec section 11.4: 20 req/min on OAuth callbacks, 100/min on general API
// validate: false disables the X-Forwarded-For check in express-rate-limit v7
// (trust proxy is set on the Express app, but v7 still throws without this)
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many requests, please try again later' },
});

const oauthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many OAuth requests, please try again later' },
});

module.exports = { generalLimiter, oauthLimiter };
