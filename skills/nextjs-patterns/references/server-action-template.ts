// Reference: Full server action template with Zod validation, repository usage, and revalidatePath
// Usage: Copy and adapt for new route actions

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  createItem,
  deleteItem,
  getItemById,
  updateItem,
} from "@/lib/repositories/items";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const CreateItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
});

const UpdateItemSchema = CreateItemSchema.partial();

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Get item by ID
 */
export async function getItemAction(
  id: string
): Promise<ActionResponse<Item>> {
  try {
    const supabase = await createClient();
    const item = await getItemById(supabase, id);

    if (!item) {
      return { success: false, error: "Item not found" };
    }

    return { success: true, data: item };
  } catch (error) {
    console.error("Failed to fetch item", { error, id });
    return { success: false, error: "Failed to fetch item" };
  }
}

/**
 * Create new item with Zod validation
 */
export async function createItemAction(
  input: unknown
): Promise<ActionResponse<Item>> {
  // 1. Validate at the boundary
  const parsed = CreateItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    // 2. Use repository (never direct supabase.from())
    const supabase = await createClient();
    const item = await createItem(supabase, parsed.data);

    // 3. Invalidate cache
    revalidatePath("/items");
    revalidatePath("/dashboard");

    return { success: true, data: item };
  } catch (error) {
    console.error("Failed to create item", { error });
    return { success: false, error: "Failed to create item" };
  }
}

/**
 * Update existing item
 */
export async function updateItemAction(
  id: string,
  input: unknown
): Promise<ActionResponse<Item>> {
  const parsed = UpdateItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const supabase = await createClient();
    const item = await updateItem(supabase, id, parsed.data);

    revalidatePath("/items");
    revalidatePath(`/items/${id}`);
    revalidatePath("/dashboard");

    return { success: true, data: item };
  } catch (error) {
    console.error("Failed to update item", { error, id });
    return { success: false, error: "Failed to update item" };
  }
}

/**
 * Delete item
 */
export async function deleteItemAction(
  id: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    await deleteItem(supabase, id);

    revalidatePath("/items");
    revalidatePath("/dashboard");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete item", { error, id });
    return { success: false, error: "Failed to delete item" };
  }
}

// ---------------------------------------------------------------------------
// Client Component Usage (for reference -- do not include in actions.ts)
// ---------------------------------------------------------------------------
//
// "use client";
//
// import { useTransition } from "react";
// import { createItemAction } from "../actions";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
//
// export function ItemForm() {
//   const [isPending, startTransition] = useTransition();
//
//   function handleSubmit(formData: FormData) {
//     startTransition(async () => {
//       const result = await createItemAction({
//         title: formData.get("title") as string,
//         description: formData.get("description") as string,
//       });
//
//       if (result.success) {
//         // Show success toast, redirect, etc.
//       } else {
//         // Show error toast with result.error
//       }
//     });
//   }
//
//   return (
//     <form action={handleSubmit}>
//       <Input name="title" placeholder="Title" required />
//       <Input name="description" placeholder="Description" />
//       <Button type="submit" disabled={isPending}>
//         {isPending ? "Creating..." : "Create Item"}
//       </Button>
//     </form>
//   );
// }
