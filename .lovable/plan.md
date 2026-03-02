

## Problem

The `reset-password` edge function is **not listed in `supabase/config.toml`**, so it defaults to `verify_jwt = true`. Supabase's gateway rejects the JWT before the function code executes, returning a non-2xx error. The function never gets to run its own auth logic.

Additionally, the CORS `Access-Control-Allow-Headers` is missing several headers that the Supabase JS client sends, which could cause preflight failures.

## Fix

### 1. Add `reset-password` to `supabase/config.toml`

```toml
[functions.reset-password]
verify_jwt = false
```

### 2. Update CORS headers in the edge function

Update the `Access-Control-Allow-Headers` to include all headers the Supabase client sends:

```
authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version
```

These are two small, targeted changes that should resolve the issue completely.

