# Webhook Logger Reference

## Overview

The webhook logger is a specialized observability wrapper for webhook handlers. It enforces consistent lifecycle tracking, duration measurement, error capture, and Sentry tag application across all webhook providers.

---

## createWebhookLogger()

### Factory Signature

```typescript
interface WebhookLoggerConfig {
  provider: string;         // e.g., "stripe", "payment-provider", "auth-provider"
  handler: string;          // e.g., "handlePaymentSucceeded"
  eventType: string;        // e.g., "payment_intent.succeeded"
  organizationId?: string;  // Tag: webhook.organization_id
  durationThresholdMs?: number; // Default: 5000ms
}

function createWebhookLogger(config: WebhookLoggerConfig): WebhookLogger;
```

### Lifecycle Methods

| Method | Purpose | When to Call |
|--------|---------|-------------|
| `start()` | Start timer, apply Sentry tags | Beginning of handler |
| `success(data?)` | Log completion, warn if slow | After successful processing |
| `failure(error)` | Log error, capture to error tracker | In catch block |
| `info(data, message)` | Structured info log | Intermediate steps |
| `debug(data, message)` | Debug log (filtered in prod) | Verbose tracing |
| `warn(data, message)` | Warning (non-fatal) | Non-critical failures |
| `error(data, message)` | Error log | Errors without lifecycle end |
| `setEntityId(key, value)` | Update Sentry tag | After creating/finding entities |

### What Each Lifecycle Method Does

**`start()`**:
- Records start timestamp
- Sets Sentry tags: `webhook.provider`, `webhook.handler`, `webhook.event_type`, `webhook.organization_id`
- Logs: "Webhook handler started"

**`success(data?)`**:
- Calculates duration from `start()`
- Logs completion with duration
- If duration > threshold: logs slow operation warning
- Emits metric: `webhook.duration_ms`

**`failure(error)`**:
- Calculates duration from `start()`
- Logs error with full context
- Calls `captureWebhookException()` automatically
- Emits metric: `webhook.failed`

---

## Full Handler Template

```typescript
import { createWebhookLogger } from "@/lib/webhooks/webhook-logger";

export async function handleEventName(
  payload: EventPayload,
  organizationId?: string
) {
  const log = createWebhookLogger({
    provider: "stripe",
    handler: "handleEventName",
    eventType: "event.type",
    organizationId,
  });

  log.start();

  try {
    // 1. Idempotency check (webhooks can be delivered multiple times)
    const existing = await findExisting(payload.id);
    if (existing) {
      log.info({}, "Already processed (idempotent skip)");
      log.success({ reason: "already_processed" });
      return { success: true, reason: "already_processed" };
    }

    // 2. Validate payload
    log.debug({ payload_keys: Object.keys(payload) }, "Processing payload");

    // 3. Business logic
    const result = await processEvent(payload);

    // 4. Update Sentry tags with created entity IDs
    if (result.orderId) log.setEntityId("order_id", result.orderId);
    if (result.customerId) log.setEntityId("customer_id", result.customerId);

    // 5. Handle side effects (non-blocking)
    try {
      await triggerSideEffects(result);
    } catch (sideEffectError) {
      log.warn({ err: sideEffectError }, "Side effects failed (non-critical)");
    }

    // 6. Success
    log.success({ entity_id: result.id });
    return { success: true, ...result };

  } catch (error) {
    log.failure(error as Error);
    throw error;
  }
}
```

---

## withWebhookTracing Wrapper

For simpler handlers, use the wrapper to guarantee lifecycle calls:

```typescript
import {
  createWebhookLogger,
  withWebhookTracing,
} from "@/lib/webhooks/webhook-logger";

export async function handleSimpleEvent(payload: EventPayload) {
  const log = createWebhookLogger({
    provider: "auth-provider",
    handler: "handleSimpleEvent",
    eventType: "user.created",
  });

  return await withWebhookTracing(log, async () => {
    // Your handler logic -- start/success/failure are automatic
    const result = await processUser(payload);
    return { user_id: result.id };
  });
}
```

### How withWebhookTracing Works

```typescript
async function withWebhookTracing<T>(
  logger: WebhookLogger,
  fn: () => Promise<T>
): Promise<T> {
  logger.start();
  try {
    const result = await fn();
    logger.success(typeof result === "object" ? result : {});
    return result;
  } catch (error) {
    logger.failure(error as Error);
    throw error;
  }
}
```

---

## Idempotency Patterns

Webhooks can be delivered multiple times by the provider. Always guard against duplicate processing:

```typescript
// Pattern 1: Check by provider event ID
const existing = await repository.findByExternalId(payload.event_id);
if (existing) {
  log.info({}, "Already processed (idempotent skip)");
  log.success({ reason: "already_processed" });
  return { success: true };
}

// Pattern 2: Check by entity + timestamp
const recent = await repository.findRecentByEntity(
  payload.entity_id,
  { withinSeconds: 60 }
);
if (recent) {
  log.info({}, "Duplicate event within window");
  log.success({ reason: "duplicate_within_window" });
  return { success: true };
}
```

---

## Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Using raw `createModuleLogger()` in webhooks | Loses timing, tags, lifecycle | Use `createWebhookLogger()` |
| Forgetting `log.start()` | Timer never starts, tags never set | Always call first |
| Forgetting `log.success()` | Duration never logged | Always call on happy path |
| Not calling `log.failure()` on errors | Error tracker never captures | Always call in catch block |
| Processing duplicate events | Double-charges, duplicate records | Check for existing records first |
| Not setting entity IDs | Cannot filter by entity in dashboard | Call `setEntityId()` after creation |
| Side effects blocking main flow | Webhook times out | Try-catch non-critical operations |

---

## Quick Reference

| Pattern | Correct | Wrong |
|---------|---------|-------|
| Logger | `createWebhookLogger()` | `createModuleLogger()` |
| Start | `log.start()` | (nothing) |
| Success | `log.success({ data })` | `return result` |
| Failure | `log.failure(error)` | `throw error` (only) |
| Entity IDs | `log.setEntityId("order_id", id)` | (not setting) |
| Idempotency | Check existing first | Process blindly |
| Side effects | Try-catch separately | Let errors bubble up |
