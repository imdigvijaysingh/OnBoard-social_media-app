import rateLimit from "express-rate-limit";

/**
 * Volumetric IP-level rate limiter for login attempts
 * Limits each IP to 10 login requests per 15-minute window
 */
export const loginIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfterSeconds = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    const retryAfterMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
    
    return res.status(429).json({
      message: `Too many login attempts from this network. Please wait ${retryAfterMinutes} minute${retryAfterMinutes > 1 ? "s" : ""} before trying again.`,
      retryAfterMinutes,
      retryAfterSeconds,
    });
  },
});
