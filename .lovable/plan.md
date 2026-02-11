

## Problem Identified

The `reset-password` Edge Function is updating the **wrong user's** password. The Supabase Admin API's `listUsers({ filter })` performs a fuzzy/partial match across user fields, and with `perPage: 1`, it returns the first alphabetically matching user -- not necessarily the one with the exact email.

**Evidence from auth logs:** When resetting password for `talita.sigales@grougp.com.br`, the function actually updated `marcela.vaz@grougp.com.br` (user ID `e73c90fa-d12a-4bdc-bb55-1f587bb73dd7`).

## Fix

Update `supabase/functions/reset-password/index.ts` to:

1. Increase `perPage` to a reasonable number (e.g., 50) to get enough candidates from the filter
2. After getting results, find the user with an **exact email match** (`user.email === email`)
3. Only proceed with the password update if an exact match is found

### Technical Changes

**File: `supabase/functions/reset-password/index.ts`**

- Change `perPage: 1` to `perPage: 50` to get more candidates from the fuzzy filter
- Replace `const user = users.users?.[0]` with `const user = users.users?.find(u => u.email === email)` to ensure exact email matching
- This prevents the function from accidentally modifying another user's password

After deploying the fix, re-run the password reset for `talita.sigales@grougp.com.br` and test login again.

