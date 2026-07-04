type RateLimitRecord = {
  count: number;
  resetTime: number;
};

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Checks if a request key has exceeded the maximum rate limit.
 *
 * @param key       Unique identifier (e.g. IP address or user ID)
 * @param limit     Max number of allowed requests in the window
 * @param windowMs  Time window duration in milliseconds
 * @returns         true if the request is rate-limited (blocked), false otherwise
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return false;
  }

  record.count++;
  return record.count > limit;
}
