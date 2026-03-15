# Mock Patterns Reference

## Supabase Mock Client

The mock client simulates the Supabase query builder chain pattern. Every chainable method returns the mock chain, allowing you to set up expected return values at the terminal method.

### Implementation

```typescript
// test/mocks/supabase.mock.ts
import { vi } from "vitest";

export function createMockSupabaseClient() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    gt: vi.fn(),
    gte: vi.fn(),
    lt: vi.fn(),
    lte: vi.fn(),
    like: vi.fn(),
    ilike: vi.fn(),
    in: vi.fn(),
    is: vi.fn(),
    not: vi.fn(),
    or: vi.fn(),
    filter: vi.fn(),
    match: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    range: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    count: vi.fn(),
    head: vi.fn(),
    csv: vi.fn(),
    then: vi.fn(),
  };

  // By default, every chain method returns the chain itself
  for (const method of Object.values(chain)) {
    method.mockReturnValue(chain);
  }

  const client = {
    from: vi.fn().mockReturnValue(chain),
    rpc: vi.fn().mockReturnValue(chain),
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    _chain: chain, // Exposed for test setup
  };

  return client;
}
```

---

## Common Mock Setups

### Mock Insert -> Select -> Single

```typescript
const mockDb = createMockSupabaseClient();

mockDb._chain.insert.mockReturnValue(mockDb._chain);
mockDb._chain.select.mockReturnValue(mockDb._chain);
mockDb._chain.single.mockResolvedValue({
  data: { id: "123", name: "Test Record", created_at: new Date().toISOString() },
  error: null,
});
```

### Mock Select -> Eq -> Order (List Query)

```typescript
mockDb._chain.select.mockReturnValue(mockDb._chain);
mockDb._chain.eq.mockReturnValue(mockDb._chain);
mockDb._chain.order.mockResolvedValue({
  data: [
    { id: "1", name: "First" },
    { id: "2", name: "Second" },
  ],
  error: null,
});
```

### Mock Select -> Eq -> Single (Get by ID)

```typescript
mockDb._chain.select.mockReturnValue(mockDb._chain);
mockDb._chain.eq.mockReturnValue(mockDb._chain);
mockDb._chain.single.mockResolvedValue({
  data: { id: "123", name: "Found Record" },
  error: null,
});
```

### Mock Error Response

```typescript
mockDb._chain.single.mockResolvedValue({
  data: null,
  error: { message: "Not found", code: "PGRST116" },
});
```

### Mock Update -> Eq

```typescript
mockDb._chain.update.mockReturnValue(mockDb._chain);
mockDb._chain.eq.mockResolvedValue({
  data: { id: "123", status: "updated" },
  error: null,
});
```

### Mock Delete -> Eq

```typescript
mockDb._chain.delete.mockReturnValue(mockDb._chain);
mockDb._chain.eq.mockResolvedValue({
  data: null,
  error: null,
});
```

---

## Verifying Calls

```typescript
// Verify table name
expect(mockDb.from).toHaveBeenCalledWith("orders");

// Verify insert data
expect(mockDb._chain.insert).toHaveBeenCalledWith({
  name: "New Order",
  amount: 1000,
});

// Verify filter
expect(mockDb._chain.eq).toHaveBeenCalledWith("id", "order_123");

// Verify ordering
expect(mockDb._chain.order).toHaveBeenCalledWith("created_at", {
  ascending: false,
});
```

---

## Type Casting

When passing the mock to functions that expect a typed client:

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";

const result = await myRepoFunction(
  mockDb as unknown as SupabaseClient,
  input
);
```

---

## Mocking RPC Calls

```typescript
mockDb.rpc.mockResolvedValue({
  data: { count: 42 },
  error: null,
});

// Verify
expect(mockDb.rpc).toHaveBeenCalledWith("my_function", {
  param1: "value1",
});
```

---

## Reset Between Tests

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  // Or create a fresh mock:
  mockDb = createMockSupabaseClient();
});
```

Always reset mocks between tests to prevent state leakage. Either use `vi.clearAllMocks()` or create a fresh mock instance in `beforeEach`.
