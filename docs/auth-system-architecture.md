# Nobridge Auth System Architecture

## Overview

The Nobridge application uses a two-step user creation process that separates authentication (Supabase Auth) from user profiles (application data).

## User Creation Flow

### Regular Users (Buyers/Sellers)

1. **Frontend Registration**
   - User fills out registration form
   - App calls `supabase.auth.signUp()` to create auth user
   - Auth user is created with metadata (role, name, etc.)

2. **Profile Creation**
   - After successful auth signup, app calls `/api/auth/create-profile`
   - This API creates the corresponding `user_profiles` entry
   - Profile includes all business-specific fields (persona, company, etc.)

### Admin Users

1. **Script-based Creation**
   - `scripts/create-admin-user.js` uses `supabase.auth.admin.createUser()`
   - Trigger `handle_new_admin_user()` automatically creates profile
   - This is a convenience for admin setup only

## Key Database Relationships

- `user_profiles.id` has a foreign key to `auth.users.id`
- One-to-one relationship enforced by primary key constraint
- Email sync handled by `sync_email_verification_status()` function

## Email Verification Sync

When a user verifies their email:
1. Supabase Auth updates `auth.users.email_confirmed_at`
2. Trigger fires `sync_email_verification_status()` function
3. Function updates `user_profiles.is_email_verified` and `email_verified_at`

## Permissions

The following roles have access to `user_profiles`:
- `postgres` - Full access (owns the schema)
- `service_role` - Full access (for admin operations)
- `supabase_auth_admin` - SELECT, INSERT, UPDATE (for auth triggers)
- `authenticated` - Row-level security policies apply

## Security Design

- RLS policies ensure users can only see/edit their own profiles
- Admin users can see all profiles via RLS policies
- Service role bypasses RLS for admin operations
- Auth triggers run with SECURITY DEFINER for proper access

## Migration History

1. Initial schema created `user_profiles` with password storage
2. Migration to Supabase Auth removed password_hash
3. Added foreign key constraint to `auth.users`
4. Email sync function added for real-time verification status
5. Permissions granted to auth service roles
6. Admin user auto-creation trigger added
