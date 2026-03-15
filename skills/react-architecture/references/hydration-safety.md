# Hydration Safety Reference

Complete reference for avoiding hydration mismatches in server-rendered React applications.

---

## The Problem

During server-side rendering (SSR), React runs component code on the server to produce HTML. On the client, React "hydrates" that HTML by attaching event handlers and reconciling the virtual DOM. If the server-rendered output differs from the client's first render, React throws a hydration mismatch error.

The most common cause: **using browser-only APIs during initial render** (in useState initializers, at module scope, or in the render body).

---

## Browser APIs That Cause Hydration Mismatches

### Complete List

| Category | API | Why it mismatches |
|----------|-----|-------------------|
| **Time** | `Date.now()` | Different on server vs client |
| **Time** | `new Date()` | Different timestamps |
| **Random** | `Math.random()` | Non-deterministic |
| **Random** | `crypto.randomUUID()` | Non-deterministic |
| **Window** | `window.innerWidth` / `window.innerHeight` | Does not exist on server |
| **Window** | `window.location` | Server has no location |
| **Window** | `window.matchMedia()` | Server cannot query media |
| **Window** | `window.scrollY` / `window.scrollX` | Server has no scroll position |
| **Window** | `window.devicePixelRatio` | Server has no display |
| **Document** | `document.cookie` | Server has no cookies (in component code) |
| **Document** | `document.referrer` | Server has no referrer |
| **Document** | `document.title` | Server has no document |
| **Document** | `document.visibilityState` | Server has no visibility |
| **Navigator** | `navigator.userAgent` | Server has no navigator |
| **Navigator** | `navigator.language` | Different on server |
| **Navigator** | `navigator.onLine` | Server is always "online" |
| **Navigator** | `navigator.geolocation` | Server has no geolocation |
| **Storage** | `localStorage.getItem()` | Does not exist on server |
| **Storage** | `sessionStorage.getItem()` | Does not exist on server |
| **Intl** | `Intl.DateTimeFormat().resolvedOptions().timeZone` | Server timezone differs from client |
| **Intl** | `Intl.NumberFormat().format()` with locale detection | Server locale may differ |
| **Media** | `window.matchMedia("(prefers-color-scheme: dark)")` | Server cannot detect theme |
| **Media** | `window.matchMedia("(prefers-reduced-motion)")` | Server cannot detect motion preference |
| **Performance** | `performance.now()` | Different on server vs client |

---

## Safe Initialization Patterns

### Pattern 1: Null init + useEffect (most common)

Use when you need a browser value but can render without it.

```typescript
const [timezone, setTimezone] = useState<string | null>(null);

useEffect(() => {
  setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
}, []);

// Render handles null case
return <span>{timezone ?? "Detecting..."}</span>;
```

### Pattern 2: Default value + useEffect correction

Use when you have a sensible server-side default.

```typescript
const [isOnline, setIsOnline] = useState(true); // safe default

useEffect(() => {
  setIsOnline(navigator.onLine);

  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}, []);
```

### Pattern 3: useSyncExternalStore (subscriptions)

Use when you need to subscribe to a browser API that changes over time. The third argument is the server snapshot.

```typescript
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    () => false // server snapshot: safe default
  );
}

// Usage
const isDark = useMediaQuery("(prefers-color-scheme: dark)");
const isDesktop = useMediaQuery("(min-width: 768px)");
```

### Pattern 4: Suppressing hydration for specific elements

Use as a last resort when content is inherently client-only (e.g., timestamps).

```tsx
function RelativeTime({ date }: { date: Date }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Server and first client render match
    return <time dateTime={date.toISOString()}>{date.toISOString()}</time>;
  }

  // After hydration, show relative time
  return <time dateTime={date.toISOString()}>{formatRelative(date)}</time>;
}
```

### Pattern 5: Stable IDs with useId

Use when you need unique IDs for accessibility (labels, ARIA attributes).

```tsx
function FormField({ label }: { label: string }) {
  const id = useId(); // stable across server and client

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} />
    </>
  );
}
```

---

## Anti-Patterns

### Never: Browser API in useState initializer

```typescript
// WRONG - hydration mismatch guaranteed
const [width] = useState(() => window.innerWidth);
const [id] = useState(() => crypto.randomUUID());
const [theme] = useState(() =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
);
```

### Never: Browser API in render body

```typescript
// WRONG - runs during SSR, crashes or mismatches
function Component() {
  const width = window.innerWidth; // crashes on server
  const theme = document.cookie.includes("dark") ? "dark" : "light";
  return <div style={{ width }}>{theme}</div>;
}
```

### Never: typeof window check in useState initializer

```typescript
// WRONG - server returns "fallback", client returns real value = mismatch
const [tz] = useState(() =>
  typeof window !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "UTC"
);
```

The problem: server renders with "UTC", client renders with "America/New_York". React sees a mismatch.

---

## Testing Hydration Issues

### Manual verification

1. Disable JavaScript in the browser
2. Load the page -- observe the server-rendered HTML
3. Re-enable JavaScript
4. Compare: if content flickers or changes on hydration, there is a mismatch

### Automated detection

React logs hydration mismatches as warnings in development mode. Grep for:

- `Warning: Text content did not match`
- `Warning: Expected server HTML to contain a matching`
- `Warning: Hydration failed because the initial UI does not match`

### Testing pattern

```typescript
// Render component in SSR mode (e.g., with renderToString)
// Then hydrate and assert no console warnings
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";

const html = renderToString(<Component />);
container.innerHTML = html;

const consoleSpy = vi.spyOn(console, "error");
hydrateRoot(container, <Component />);
expect(consoleSpy).not.toHaveBeenCalledWith(
  expect.stringContaining("Hydration")
);
```

---

## Quick Decision Tree

```
Need a browser value in initial render?
  |
  +-- Can you provide a safe default?
  |     +-- Yes -> Pattern 2 (default + useEffect correction)
  |     +-- No  -> Pattern 1 (null init + useEffect)
  |
  +-- Does the value change over time (subscription)?
  |     +-- Yes -> Pattern 3 (useSyncExternalStore)
  |
  +-- Is it an ID for accessibility?
  |     +-- Yes -> Pattern 5 (useId)
  |
  +-- Is it inherently client-only display (relative time, locale-specific)?
        +-- Yes -> Pattern 4 (mounted check)
```
