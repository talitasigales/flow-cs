

## Problem

The `reset-password` edge function fails with "Token inválido" because on line 49:
```typescript
await supabaseAuth.auth.getUser(token)
```
When you pass the token directly to `getUser()`, it bypasses the Authorization header and attempts to resolve a local session, which doesn't exist in edge functions — hence `AuthSessionMissingError`.

## Fix

One-line change in `supabase/functions/reset-password/index.ts`:

1. **Remove the `token` variable** (line 42) — it's no longer needed.
2. **Call `getUser()` without arguments** (line 49) — this makes the client use the `Authorization` header from the global config to validate the user.

```typescript
// Before (broken):
const token = authHeader.replace('Bearer ', '');
const supabaseAuth = createClient(supabaseUrl, anonKey, {
  global: { headers: { Authorization: authHeader } },
  auth: { autoRefreshToken: false, persistSession: false }
});
const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);

// After (fixed):
const supabaseAuth = createClient(supabaseUrl, anonKey, {
  global: { headers: { Authorization: authHeader } },
  auth: { autoRefreshToken: false, persistSession: false }
});
const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
```

3. **Deploy and test** by calling the function from the admin page.

