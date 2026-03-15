# Sentry Patterns Reference

## Domain Exception Factory

The `createDomainCapture()` factory generates typed capture functions per business domain. Each function:
1. Normalizes the error (string -> Error, unknown -> generic Error)
2. Auto-injects request context tags via `getContextTags()` (user_id, org_id, request_id)
3. Sets domain-prefixed tags for dashboard filtering
4. Applies custom fingerprinting for intelligent issue grouping

### Factory Implementation Pattern

```typescript
interface DomainCaptureConfig {
  domain: string;
  tagPrefix: string;
}

interface BaseDomainContext {
  organizationId?: string;
  stage: string;
  metadata?: Record<string, unknown>;
}

function createDomainCapture<TContext extends BaseDomainContext>(
  config: DomainCaptureConfig
) {
  return (error: unknown, context: TContext) => {
    const normalizedError = error instanceof Error
      ? error
      : new Error(String(error));

    Sentry.withScope((scope) => {
      // Auto-inject request context (user_id, org_id, etc.)
      const ctxTags = getContextTags();
      for (const [key, value] of Object.entries(ctxTags)) {
        scope.setTag(key, value);
      }

      // Domain-specific tags
      scope.setTag(`${config.tagPrefix}.critical`, "true");
      scope.setTag(`${config.tagPrefix}.stage`, context.stage);
      if (context.organizationId) {
        scope.setTag(`${config.tagPrefix}.organization_id`, context.organizationId);
      }

      // Additional context-specific tags
      for (const [key, value] of Object.entries(context)) {
        if (key !== "stage" && key !== "organizationId" && key !== "metadata" && value) {
          scope.setTag(`${config.tagPrefix}.${key}`, String(value));
        }
      }

      // Fingerprinting for grouping
      scope.setFingerprint([
        `${config.domain}-failure`,
        context.stage,
        context.organizationId ?? "unknown",
      ]);

      // Attach metadata as context (not searchable, for debugging)
      if (context.metadata) {
        scope.setContext(`${config.domain}_metadata`, context.metadata);
      }

      Sentry.captureException(normalizedError);
    });
  };
}
```

### Example: Generating Domain Capture Functions

```typescript
// Define stage types per domain
type OrderFailureStage =
  | "validation" | "payment_gateway" | "inventory_check"
  | "fulfillment" | "notification" | "refund";

interface OrderExceptionContext extends BaseDomainContext {
  organizationId: string;
  stage: OrderFailureStage;
  orderId?: string;
  customerId?: string;
}

// Generate the typed capture function
const captureOrderException = createDomainCapture<OrderExceptionContext>({
  domain: "order",
  tagPrefix: "order",
});

// Usage
captureOrderException(error, {
  organizationId: "org_123",
  stage: "payment_gateway",
  orderId: "ord_456",
});
// Tags set: order.critical=true, order.stage=payment_gateway,
//           order.organization_id=org_123, order.orderId=ord_456
// Fingerprint: ["order-failure", "payment_gateway", "org_123"]
```

### Common Domain Examples

| Domain | Capture Function | Typical Stages |
|--------|-----------------|----------------|
| Orders | `captureOrderException` | validation, payment, fulfillment, notification |
| Payments | `capturePaymentException` | webhook, storage, matching, refund |
| Webhooks | `captureWebhookException` | signature, parse, handler, side_effect |
| AI | `captureAIException` | analysis, scoring, translation, generation |
| Auth | `captureAuthException` | login, signup, sync, token_refresh |
| Email | `captureEmailException` | send, template, delivery, bounce |
| Onboarding | `captureOnboardingException` | validation, save, connection |

---

## Tag Constants Pattern

Centralize all tag keys to prevent typos and enable refactoring:

```typescript
// @/lib/sentry/tags.ts

// Request context tags (auto-injected)
export const CTX_TAGS = {
  USER_ID: "ctx.user_id",
  ORG_ID: "ctx.organization_id",
  ORG_SLUG: "ctx.organization_slug",
  REQUEST_ID: "ctx.request_id",
  SESSION_ID: "ctx.session_id",
} as const;

// Domain tag groups
export const ORDER_TAGS = {
  CRITICAL: "order.critical",
  STAGE: "order.stage",
  ORG_ID: "order.organization_id",
  ORDER_ID: "order.order_id",
} as const;

export const WEBHOOK_TAGS = {
  CRITICAL: "webhook.critical",
  SOURCE: "webhook.source",
  EVENT_TYPE: "webhook.event_type",
  STAGE: "webhook.stage",
  ORG_ID: "webhook.organization_id",
} as const;

export const AI_TAGS = {
  CRITICAL: "ai.critical",
  STAGE: "ai.stage",
  MODEL: "ai.model",
  ORG_ID: "ai.organization_id",
} as const;

// ... one group per domain
```

### Metric Constants

```typescript
// @/lib/sentry/metrics.ts

export const METRICS = {
  WEBHOOK: {
    PROCESSED: "webhook.processed",
    DURATION_MS: "webhook.duration_ms",
    FAILED: "webhook.failed",
  },
  AI: {
    TOKENS_PROMPT: "ai.tokens.prompt",
    TOKENS_COMPLETION: "ai.tokens.completion",
    DURATION_MS: "ai.duration_ms",
    OPERATIONS: "ai.operations",
  },
  DB: {
    QUERY_DURATION_MS: "db.query.duration_ms",
  },
} as const;
```

---

## Tracing and Span Patterns

### Architecture: Built-in OpenTelemetry

Use the error tracking SDK's native OTEL support. Only add `@opentelemetry/api` for `trace.getActiveSpan()`.

### Trace Context Utilities

```typescript
// @/lib/tracing/context.ts
import {
  getTracingOptions,     // For AI agent calls
  getCurrentTraceId,     // For manual log correlation
  getCurrentSpanId,      // For span-level correlation
} from "@/lib/tracing/otel-context";
```

### Custom Spans

```typescript
const result = await Sentry.startSpan(
  { name: "function.process-order", op: "function" },
  async (span) => {
    const result = await processOrder(input);
    span.setAttributes({
      "order.item_count": result.items.length,
      "order.total": result.total,
    });
    return result;
  }
);
```

### Dynamic Sampling

Categorize operations into tiers for sampling:

| Tier | Sample Rate (Prod) | Examples |
|------|-------------------|----------|
| Critical | 100% | Checkout, payment, onboarding |
| Important | 50% | Server actions, DB queries, API calls |
| Low-value | 10% | Health checks, static assets, status |
| Default | 10% | Everything else |

```typescript
// tracesSampler function example
function tracesSampler(samplingContext: SamplingContext): number {
  const name = samplingContext.transactionContext?.name ?? "";

  if (CRITICAL_PATH_PATTERNS.some(p => p.test(name))) return 1.0;
  if (IMPORTANT_PATTERNS.some(p => p.test(name))) return 0.5;
  if (LOW_VALUE_PATTERNS.some(p => p.test(name))) return 0.1;

  return 0.1; // default
}
```

### Context Enrichment

Use a span processor to auto-inject user/org context into every span:

```typescript
// Auto-injects from AsyncLocalStorage request context:
// - user_id, organization_id, organization_slug
// - request_id, session_id
```

### Request Context (AsyncLocalStorage)

Middleware populates request context:

```typescript
interface RequestContext {
  requestId: string;
  userId?: string;
  sessionId?: string;
  organizationId?: string;
  organizationRole?: string;
  userAgent?: string;
  ip?: string;
  path?: string;
  method?: string;
  tags: Record<string, string>;
}
```

Access anywhere:
```typescript
import { getContext, addContextTags } from "@/lib/request-context";
const ctx = getContext();
addContextTags({ "custom.tag": "value" });
```

---

## AI Instrumentation Patterns

### Instrumented Agent Generate

```typescript
import { instrumentedAgentGenerate } from "@/lib/ai/instrumentation";

const result = await instrumentedAgentGenerate(
  agent, messages, options,
  {
    operation: "sentiment-analysis",
    modelName: "claude-sonnet-4-5-20250929",
    organizationId,
    entityId: recordId,
  },
);
```

Auto-captures:
- Span (`ai.chat.completions`) with token counts
- Metrics: `ai.tokens.prompt`, `ai.tokens.completion`, `ai.duration`
- Robust JSON recovery for structured output validation errors
- Error handling with `captureException`

### Track AI Operation (Lighter Weight)

```typescript
import { trackAIOperation } from "@/lib/ai/instrumentation";

trackAIOperation("translation", "success", {
  modelName: "gpt-4o",
  organizationId,
  durationMs: elapsed,
  promptTokens: 500,
  completionTokens: 200,
});
```

### Expected Trace Waterfall

```
[Transaction] background-job.analyze-record
  +-- [Span] run-analysis (step)
      +-- [Span] ai.sentiment-analysis
          +-- [Span] agent.generate (from tracing options)
              +-- [Span] openai.chat.completions
```

---

## Auto-Injected Log Fields

Every log from the structured logger automatically includes (when available):

| Attribute | Source |
|-----------|--------|
| `trace_id` | OpenTelemetry active span |
| `span_id` | OpenTelemetry active span |
| `user_id` | Auth context |
| `organization_id` | Auth context |
| `request_id` | AsyncLocalStorage request context |
| `session_id` | AsyncLocalStorage request context |

### Attribute Naming Convention

- Always `snake_case` for uniform searching
- Domain-namespaced: `order_id`, `webhook_provider`, `ai_model_id`, `payment_intent_id`
- General attributes: `user_id`, `organization_id`, `trace_id` (no prefix)

---

## Sentry Config Integration Points

### Server Config
- Profiling integration (flame graphs)
- AI provider integrations (Anthropic, OpenAI, Google)
- Context enrichment span processor
- PII scrubbing on database breadcrumbs

### Edge Config
- Edge-compatible fetch tracing
- AI provider integration (with `force` flag if bundler breaks auto-detection)

### Client Config
- Session replay with privacy controls (mask all text, inputs, media)
- Browser tracing integration
- Trace propagation targets (same-origin + API domains)

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Traces not connected | Missing tracing options in AI calls | Pass `tracingOptions` to agent |
| `trace_id` missing from logs | No active span, or using `console.log` | Use structured logger |
| Logs not in error tracker | Production filters debug-level | Use `info` or higher |
| Duplicate logs | Console interception re-enabled | Remove `consoleLoggingIntegration` |
| High tag cardinality warnings | Using entity IDs as tags | Move to context |
