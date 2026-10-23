function createRateLimiter({ windowMs = 60 * 1000, max = 60, message = 'Too many requests' } = {}) {
  const buckets = new Map();

  function resolveClientKey(req) {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
      const firstIp = forwardedFor.split(',')[0].trim();
      if (firstIp) {
        return firstIp;
      }
    }

    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      const firstIp = String(forwardedFor[0]).split(',')[0].trim();
      if (firstIp) {
        return firstIp;
      }
    }

    return req.ip || 'unknown';
  }

  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (now - bucket.start > windowMs) {
        buckets.delete(key);
      }
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const key = resolveClientKey(req);
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || now - existing.start > windowMs) {
      buckets.set(key, { count: 1, start: now });
      return next();
    }

    existing.count += 1;

    if (existing.count > max) {
      return res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMITED', message },
      });
    }

    return next();
  };
}

module.exports = {
  createRateLimiter,
};
