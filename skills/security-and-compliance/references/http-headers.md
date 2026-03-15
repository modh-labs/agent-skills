# HTTP Security Headers Configuration

## Required Headers

Every web application MUST include these headers. For Next.js, add to `next.config.mjs`:

```typescript
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
        {
          key: "Referrer-Policy",
          value: "origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
  ];
}
```

---

## Header Purposes

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS for 2 years, including subdomains. Submit to HSTS preload list. |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME type sniffing. Stops XSS via file uploads where browser guesses content type. |
| `X-Frame-Options` | `DENY` | Blocks iframe embedding entirely. Prevents clickjacking attacks. |
| `X-XSS-Protection` | `1; mode=block` | Enables browser XSS filter in legacy browsers. Modern browsers rely on CSP instead. |
| `Referrer-Policy` | `origin-when-cross-origin` | Sends full URL for same-origin, only origin for cross-origin. Limits data leakage in referrer headers. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables browser APIs not needed by the application. Reduces attack surface. |

---

## Content Security Policy (CSP)

CSP is project-specific. Build yours based on actual script/style/image sources:

```typescript
{
  key: "Content-Security-Policy",
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Tighten as possible
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.your-domain.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
}
```

### CSP Best Practices

- Start strict, then relax as needed
- Use `'nonce-*'` instead of `'unsafe-inline'` when possible
- Never allow `'unsafe-eval'` in production unless absolutely required
- Use `report-uri` or `report-to` to monitor violations before enforcing
- `frame-ancestors 'none'` is the CSP equivalent of `X-Frame-Options: DENY`

---

## Verification

After deploying, verify headers with:

```bash
curl -I https://your-domain.com | grep -i "x-frame\|x-content\|strict-transport\|referrer\|permissions\|content-security"
```

Or use [securityheaders.com](https://securityheaders.com) for a full audit.
