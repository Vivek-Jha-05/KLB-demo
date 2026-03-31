const NodeCache = require('node-cache');

// Initialize cache with default TTL of 120 seconds
const cache = new NodeCache({ stdTTL: 120, checkperiod: 120 });

/**
 * Cache middleware for read requests
 * @param {number} ttl - Time to live in seconds
 */
const cacheMiddleware = (ttl) => (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  const key = req.originalUrl || req.url;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    return res.json(cachedResponse);
  }

  // Intercept res.json to store response in cache
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    cache.set(key, body, ttl);
    return originalJson(body);
  };

  next();
};

/**
 * Invalidate cache by key or pattern
 * @param {string|RegExp} pattern 
 */
const invalidateCache = (pattern) => {
  const keys = cache.keys();
  if (typeof pattern === 'string') {
    const filteredKeys = keys.filter(key => key.includes(pattern));
    cache.del(filteredKeys);
  } else if (pattern instanceof RegExp) {
    const filteredKeys = keys.filter(key => pattern.test(key));
    cache.del(filteredKeys);
  } else {
    cache.flushAll();
  }
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
};
