

## Problem

The bug is on line 377 of `AdminUsers.tsx`. When clicking "Resetar Senha", the code passes `userData.full_name` as the email:

```typescript
onClick={() => openResetDialog(userData.full_name || '', userData.full_name)}
```

The edge function logs confirm this: `Looking for user with email: marcela vaz` -- it's searching for a name, not an email.

The `profiles` table doesn't store the email. Only `user_id`, `full_name`, `company`, `created_at` are fetched.

## Fix

Two changes needed:

### 1. Fetch email from auth in the edge function by user_id instead of email

Since the profiles table doesn't have an email column, the cleanest fix is to change the reset-password flow to use `user_id` instead of `email`:

- **AdminUsers.tsx** (line 377): Pass `userData.user_id` instead of `userData.full_name`
- **AdminUsers.tsx** (`handleResetPassword`): Send `{ userId: resetUserId }` instead of `{ email: resetUserEmail }`
- **reset-password edge function**: Accept `userId` and use `supabaseAdmin.auth.admin.updateUserById(userId, { password })` directly, skipping the email-based lookup entirely

This eliminates the fragile `listUsers` + find-by-email logic completely.

### 2. Alternative (simpler): Add email to the profiles query

Another option is to also store/retrieve email from profiles. But since `user_id` is already available and the edge function already uses `updateUserById`, passing `user_id` directly is simpler and more reliable.

## Technical Details

**AdminUsers.tsx changes:**
- Rename state from `resetUserEmail` to `resetUserId`
- Update `openResetDialog` to accept `userId` 
- Pass `userData.user_id` on the button click
- Send `{ userId }` in the function invoke body

**reset-password/index.ts changes:**
- Accept `userId` instead of `email`
- Remove the entire `listUsers` lookup block
- Call `updateUserById(userId, { password })` directly

