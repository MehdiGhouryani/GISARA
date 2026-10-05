/**
 * Server Security, Rate Limiter, and Sanitization middleware
 */

// Simple in-memory rate limiting. Each limiter owns its own store so that, for
// example, write traffic can never consume the OTP or admin-login budget (they
// previously shared one Map keyed only by IP, so every limiter interfered with
// every other and the first limiter to touch an IP decided the window for all).
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
}

/**
 * Custom IP Rate Limiter middleware (independent counter per limiter instance).
 */
export function createRateLimiter(options: RateLimitOptions) {
  const store = new Map<string, RateLimitEntry>();

  // Prune expired entries so the map cannot grow without bound.
  const pruneTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetTime) store.delete(key);
    }
  }, Math.max(options.windowMs, 60 * 1000));
  pruneTimer.unref?.();

  return (req: any, res: any, next: any) => {
    // req.ip already honours Express's `trust proxy` setting; do not fall back to
    // the raw X-Forwarded-For header, which any client can spoof to dodge limits.
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();

    let entry = store.get(ip);

    if (!entry || now > entry.resetTime) {
      entry = { count: 1, resetTime: now + options.windowMs };
      store.set(ip, entry);
      return next();
    }

    entry.count++;
    if (entry.count > options.max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetTime - now) / 1000)));
      return res.status(429).json({
        success: false,
        message: options.message,
        retryAfterSeconds: Math.ceil((entry.resetTime - now) / 1000)
      });
    }

    next();
  };
}

/**
 * CSRF defence for cookie-authenticated APIs (Origin/Referer verification).
 * State-changing requests carrying an Origin (or, failing that, a Referer) that
 * is not this site or an explicitly allowed origin are rejected. Browsers always
 * attach Origin to cross-site POST/PUT/PATCH/DELETE, so a forged cross-site form
 * or fetch cannot pass. Requests with neither header are non-browser clients and
 * cannot be CSRF vectors (no ambient cookie is attached by a third-party page).
 * Extra origins can be allowed via ALLOWED_ORIGINS (comma separated).
 */
export function csrfOriginGuard(req: any, res: any, next: any) {
  const method = String(req.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();

  const source: string | undefined = req.headers['origin'] || req.headers['referer'];
  if (!source) return next();

  let sourceHost = '';
  try {
    sourceHost = new URL(source).host;
  } catch {
    return res.status(403).json({ success: false, message: 'درخواست نامعتبر است (منشأ نامعتبر).' });
  }

  const allowedHosts = new Set<string>();
  if (req.headers['host']) allowedHosts.add(String(req.headers['host']));
  for (const o of (process.env.ALLOWED_ORIGINS || '').split(',')) {
    const trimmed = o.trim();
    if (!trimmed) continue;
    try { allowedHosts.add(new URL(trimmed).host); } catch { /* ignore malformed entry */ }
  }

  if (!allowedHosts.has(sourceHost)) {
    return res.status(403).json({ success: false, message: 'درخواست از منشأ غیرمجاز رد شد.' });
  }
  next();
}

/**
 * Request Timeout Guard middleware - prevents hanging requests from exhausting server worker threads
 */
export function requestTimeoutMiddleware(timeoutMs = 8000) {
  return (req: any, res: any, next: any) => {
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          code: 503,
          message: 'مدت زمان پاسخ‌دهی سرور به پایان رسید (Timeout). لطفاً مجدداً تلاش فرمایید.'
        });
      }
    }, timeoutMs);

    // Clear timeout on response completion
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
}
/**
 * Set secure response headers (Helmet alternative customized for AI Studio preview iframes)
 */
export function securityHeadersMiddleware(req: any, res: any, next: any) {
  // Set fundamental security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Strict production policy: scripts may only come from this origin - no inline
    // script, no eval - which is what actually neutralises injected <script>/handlers.
    // (`style-src 'unsafe-inline'` is kept only because React renders inline style
    // attributes; it does not allow script execution.)
    // Embedding is limited to this site; add trusted embedders via CSP_FRAME_ANCESTORS
    // (space separated, e.g. "https://partner.example").
    const frameAncestors = ["'self'", ...(process.env.CSP_FRAME_ANCESTORS || '').split(/\s+/).filter(Boolean)].join(' ');
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "font-src 'self' data: https://cdn.jsdelivr.net",
        "img-src 'self' data: blob: https:",
        "media-src 'self' blob: https:",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        `frame-ancestors ${frameAncestors}`
      ].join('; ')
    );
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    // Browsers ignore HSTS over plain http, so this is safe behind a TLS-terminating proxy.
    res.setHeader('Strict-Transport-Security', 'max-age=15552000');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  } else {
    // Development only: Vite's HMR/React-refresh injects inline scripts and uses eval,
    // and the preview runs inside an iframe. NEVER ship this policy to production.
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://*.unsplash.com https://cdn.jsdelivr.net https://*.googleapis.com https://*.gstatic.com; img-src 'self' data: https:; font-src 'self' data: https: https://cdn.jsdelivr.net; object-src 'none'; base-uri 'self'; frame-ancestors 'self' *;"
    );
  }

  next();
}

/**
 * Clean user inputs against dangerous characters (XSS mitigation)
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Strip literal angle brackets
    .replace(/javascript:/gi, '') // Strip javascript protocol
    .replace(/on\w+=/gi, '') // Strip event handler injection
    .trim();
}

/**
 * Recursive global XSS sanitizer middleware for body, query, and params
 */
export function globalXssSanitizerMiddleware(req: any, res: any, next: any) {
  const sanitize = (val: any): any => {
    if (typeof val === 'string') {
      return sanitizeInput(val);
    }
    if (Array.isArray(val)) {
      return val.map(sanitize);
    }
    if (val !== null && typeof val === 'object') {
      const cleaned: any = {};
      for (const key of Object.keys(val)) {
        cleaned[key] = sanitize(val[key]);
      }
      return cleaned;
    }
    return val;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
}

/**
 * Prevents HTTP Parameter Pollution (HPP) by flattening array parameters in query/params
 */
export function preventParameterPollutionMiddleware(req: any, res: any, next: any) {
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      if (Array.isArray(req.query[key])) {
        // Flatten to the last parameter value if an array is submitted maliciously
        req.query[key] = req.query[key][req.query[key].length - 1];
      }
    }
  }
  next();
}
