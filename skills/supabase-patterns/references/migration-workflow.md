# Migration Workflow Reference

## Complete Step-by-Step

### 1. Edit the Domain SQL File

Find (or create) the appropriate domain file in your schemas directory. Each domain groups related tables.

```
schemas/
  items.sql          # Items, item_tags, item_categories
  users.sql          # Users, user_preferences
  orders.sql         # Orders, order_items, payments
  organizations.sql  # Orgs, memberships, settings
```

### 2. Apply Your Schema Change

Edit the relevant domain SQL file. Examples of common changes:

**New table:**

```sql
-- schemas/items.sql

-- ============================================================================
-- TABLE: item_reviews
-- ============================================================================

CREATE TABLE item_reviews (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy (REQUIRED on every table)
  organization_id text NOT NULL,

  -- Foreign keys
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id text NOT NULL,

  -- Core fields
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_item_reviews_org ON item_reviews(organization_id);
CREATE INDEX idx_item_reviews_item ON item_reviews(item_id);

-- RLS
ALTER TABLE item_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "item_reviews_org_read" ON item_reviews
  FOR SELECT
  TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::text);

CREATE POLICY "item_reviews_org_write" ON item_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::text);

CREATE POLICY "item_reviews_service_role" ON item_reviews
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grants
GRANT SELECT, INSERT ON TABLE item_reviews TO authenticated;
GRANT ALL ON TABLE item_reviews TO service_role;

-- Auto-update timestamp trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON item_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**New column:**

```sql
-- Add to the CREATE TABLE or as ALTER TABLE in the domain file
ALTER TABLE items ADD COLUMN priority text DEFAULT 'normal';
```

**New index:**

```sql
CREATE INDEX idx_items_priority ON items(priority);
```

### 3. Generate the Migration

```bash
supabase db diff -f <descriptive_name> --linked
```

Naming conventions:
- `add_item_reviews_table`
- `add_priority_to_items`
- `add_admin_delete_policy_to_orders`

This creates: `migrations/<TIMESTAMP>_<name>.sql`

### 4. Review the Generated SQL

Open the generated file and verify:

- [ ] Correct table and column definitions
- [ ] RLS enabled with appropriate policies
- [ ] Indexes for frequently-queried columns
- [ ] Foreign keys with correct ON DELETE behavior
- [ ] No unintended changes (diff may pick up other pending edits)
- [ ] Grants for authenticated and service_role

### 5. Apply the Migration

```bash
supabase db push --linked
```

### 6. Generate TypeScript Types

```bash
supabase gen types typescript --linked > lib/supabase/database.types.ts
```

Verify the new types appear correctly in the generated file.

### 7. Create/Update the Repository

Add repository functions for the new table. Follow the repository pattern:

- Accept `SupabaseClient` as first parameter
- Use `select("*")` always
- Use generated types (Row, Insert, Update)
- Build a query builder for joins

---

## New Table Checklist

Every new table must have:

- [ ] `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- [ ] `organization_id text NOT NULL`
- [ ] `created_at timestamptz DEFAULT now()`
- [ ] `updated_at timestamptz DEFAULT now()`
- [ ] Index on `organization_id`
- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- [ ] Org isolation policy for `authenticated` role
- [ ] Full access policy for `service_role`
- [ ] `GRANT` statements for both roles
- [ ] `update_updated_at_column()` trigger

---

## RLS Policy Templates

### Read-Only for Authenticated Users

```sql
CREATE POLICY "items_org_read" ON "public"."items"
  FOR SELECT
  TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::text);
```

### Full CRUD for Authenticated Users

```sql
CREATE POLICY "items_org_all" ON "public"."items"
  FOR ALL
  TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::text)
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::text);
```

### Admin-Only Write, Everyone Read

```sql
-- Everyone in org can read
CREATE POLICY "items_org_read" ON "public"."items"
  FOR SELECT
  TO authenticated
  USING (organization_id = (auth.jwt() ->> 'org_id')::text);

-- Only admins can write
CREATE POLICY "items_admin_write" ON "public"."items"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = (auth.jwt() ->> 'org_id')::text
    AND (auth.jwt() ->> 'org_role') = 'org:admin'
  );

CREATE POLICY "items_admin_update" ON "public"."items"
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = (auth.jwt() ->> 'org_id')::text
    AND (auth.jwt() ->> 'org_role') = 'org:admin'
  );

CREATE POLICY "items_admin_delete" ON "public"."items"
  FOR DELETE
  TO authenticated
  USING (
    organization_id = (auth.jwt() ->> 'org_id')::text
    AND (auth.jwt() ->> 'org_role') = 'org:admin'
  );
```

### Service Role (Webhooks, System Operations)

```sql
CREATE POLICY "items_service_role" ON "public"."items"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### Public Read

```sql
CREATE POLICY "items_public_read" ON "public"."items"
  FOR SELECT
  TO anon, authenticated
  USING (true);
```

---

## Common Commands

| Task | Command |
|------|---------|
| Generate migration from diff | `supabase db diff -f <name> --linked` |
| Apply migrations | `supabase db push --linked` |
| Generate TypeScript types | `supabase gen types typescript --linked > lib/supabase/database.types.ts` |
| Reset local database | `supabase db reset` |
| Open database GUI | `supabase studio` |
| Pull remote schema | `supabase db pull` |

---

## Dangerous Operations -- Proceed with Caution

| Operation | Risk | Safe Alternative |
|-----------|------|------------------|
| `DROP TABLE` | Data loss | Archive rows first, confirm no references |
| `ALTER COLUMN ... SET NOT NULL` | Fails if NULLs exist | Backfill first, then add constraint |
| `RENAME COLUMN` | Breaks running code | Multi-step: add new, backfill, drop old |
| `DROP COLUMN` | Breaks running code | Remove code references first, deploy, then drop |
| `supabase db reset` | Destroys all local data | Only for development |
