/**
 * Generic webhook handler template.
 *
 * Copy this file when creating a new webhook handler.
 * Replace placeholders with your domain-specific logic.
 */

import { z } from "zod";

// ------------------------------------------------------------------
// 1. Payload Schema (colocated with handler)
// ------------------------------------------------------------------

export const EventPayloadSchema = z.object({
  id: z.string().min(1),
  type: z.string(),
  data: z.object({
    entity_id: z.string(),
    // ... add fields specific to this event
  }),
  created_at: z.number(),
});

export type EventPayload = z.infer<typeof EventPayloadSchema>;

// ------------------------------------------------------------------
// 2. Context Interface (injected by route, not created by handler)
// ------------------------------------------------------------------

interface WebhookContext {
  organizationId?: string;
  supabase: unknown; // Replace with your typed DB client
  logger: {
    start: () => void;
    success: (data?: Record<string, unknown>) => void;
    failure: (error: Error) => void;
    info: (data: Record<string, unknown>, message: string) => void;
    debug: (data: Record<string, unknown>, message: string) => void;
    warn: (data: Record<string, unknown>, message: string) => void;
    setEntityId: (key: string, value: string) => void;
  };
}

interface WebhookResult {
  success: boolean;
  [key: string]: unknown;
}

// ------------------------------------------------------------------
// 3. Handler Function
// ------------------------------------------------------------------

export async function handleEventName(
  payload: EventPayload,
  context: WebhookContext
): Promise<WebhookResult> {
  const { supabase, logger, organizationId } = context;

  logger.start();

  try {
    // ---- Step 1: Idempotency check ----
    // Webhooks can be delivered multiple times. Always check first.
    //
    // const existing = await repository.findByExternalId(supabase, payload.id);
    // if (existing) {
    //   logger.info({}, "Already processed (idempotent skip)");
    //   logger.success({ reason: "already_processed" });
    //   return { success: true, reason: "already_processed" };
    // }

    // ---- Step 2: Validate & enrich ----
    logger.debug(
      { payload_keys: Object.keys(payload.data) },
      "Processing payload"
    );

    // ---- Step 3: Core business logic ----
    // const result = await processEvent(supabase, payload, organizationId);

    // ---- Step 4: Update tags with created entity IDs ----
    // logger.setEntityId("order_id", result.id);

    // ---- Step 5: Non-blocking side effects ----
    // try {
    //   await triggerNotifications(result);
    // } catch (sideEffectError) {
    //   logger.warn(
    //     { err: sideEffectError },
    //     "Side effects failed (non-critical)"
    //   );
    // }

    // ---- Step 6: Success ----
    logger.success({ entity_id: payload.data.entity_id });
    return { success: true, entityId: payload.data.entity_id };
  } catch (error) {
    logger.failure(error as Error);
    throw error;
  }
}

// ------------------------------------------------------------------
// 4. Registry Entry (add this to handler-registry.ts)
// ------------------------------------------------------------------
//
// import { EventPayloadSchema, handleEventName } from "./handlers/event-name";
//
// export const WEBHOOK_HANDLERS = {
//   "entity.event_name": {
//     schema: EventPayloadSchema,
//     execute: handleEventName,
//     requiresOrganization: true,
//   },
// };
