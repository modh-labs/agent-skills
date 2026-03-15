# RLS Policy Checklist

## Required for Every Table with User/Organization Data

### Step 1: Enable RLS

```sql
ALTER TABLE "public"."my_table" ENABLE ROW LEVEL SECURITY;
```

### Step 2: Create Organization Isolation Policy

**Preferred: Use the helper function**

```sql
-- Helper function (define once in your schema)
CREATE OR REPLACE FUNCTION can_access_organization_data(row_org_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Service role bypasses all checks
  IF current_setting('role', true) = 'service_role' THEN
    RETURN true;
  END IF;

  -- Check custom JWT claim (org_id)
  IF (auth.jwt() ->> 'org_id')::text = row_org_id THEN
    RETURN true;
  END IF;

  -- Check alternative JWT format (some auth providers use nested claims)
  IF (auth.jwt() -> 'o' ->> 'id')::text = row_org_id THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Apply to table
CREATE POLICY "my_table_org_isolation" ON "public"."my_table"
  FOR SELECT
  TO authenticated
  USING (can_access_organization_data("organization_id"));
```

**Alternative: Inline policy (simpler but less flexible)**

```sql
CREATE POLICY "org_isolation" ON "public"."my_table"
  FOR ALL
  USING (
    organization_id = (auth.jwt() ->> 'org_id')::text
  );
```

### Step 3: Service Role Policy

```sql
CREATE POLICY "service_role_all" ON "public"."my_table"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### Step 4: Audit Log Protection (if applicable)

For immutable audit tables, deny updates and deletes:

```sql
CREATE POLICY "audit_no_update" ON "public"."audit_logs"
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "audit_no_delete" ON "public"."audit_logs"
  FOR DELETE
  TO authenticated
  USING (false);
```

---

## Common Policy Patterns

### Read-Only for Authenticated Users

```sql
CREATE POLICY "read_only" ON "public"."reference_data"
  FOR SELECT
  TO authenticated
  USING (true);
```

### Insert with Organization Check

```sql
CREATE POLICY "insert_own_org" ON "public"."my_table"
  FOR INSERT
  TO authenticated
  WITH CHECK (can_access_organization_data("organization_id"));
```

### User-Level Isolation (within an org)

```sql
CREATE POLICY "user_own_records" ON "public"."user_settings"
  FOR ALL
  TO authenticated
  USING (
    user_id = (auth.jwt() ->> 'sub')::text
    AND can_access_organization_data("organization_id")
  );
```

---

## Service Role Usage Guidelines

| Context | Service Role OK? | Why |
|---------|-----------------|-----|
| Webhook handlers | Yes | No user context, needs cross-org access |
| Cron jobs | Yes | No user context, document why in code |
| Server actions | **No** | User context available, use authenticated client |
| React Server Components | **No** | User context available |
| Cross-user reads for shared resources | Yes | Document scope, limit to specific queries |

### When Using Service Role, Always:

1. **Document why** in a code comment
2. **Limit scope** -- only query what's needed
3. **Never expose** the service role key to the client
4. **Validate inputs** even though RLS is bypassed

---

## Verification Checklist

For every new table, verify:

- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` is present
- [ ] Organization isolation policy exists (SELECT at minimum)
- [ ] Service role policy exists (for webhook/cron access)
- [ ] INSERT policy includes `WITH CHECK` (not just `USING`)
- [ ] Audit tables have DENY on UPDATE/DELETE
- [ ] No `TO public` policies (only `authenticated` and `service_role`)
- [ ] Helper function handles all JWT formats your auth provider uses
