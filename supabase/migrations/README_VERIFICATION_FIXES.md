# Verification System Migration Documentation

## Overview

This document explains the verification system fixes applied in January 2025 to resolve critical issues with user verification status and admin dashboard consistency.

## Problems Addressed

1. **Auto-Pending Verification**: New users were automatically set to 'pending_verification' status
2. **Admin Dashboard Disconnect**: Users showed as "pending" but didn't appear in verification queue
3. **Data Type Mismatch**: admin_notes column was TEXT but code expected JSONB
4. **Non-Atomic Updates**: Status changes could leave tables in inconsistent states

## Migration Order

Apply these migrations in the following order:

### 1. `20250130_fix_verification_status_trigger.sql`
- **Purpose**: Fix database trigger to set new users as 'anonymous' instead of 'pending_verification'
- **Changes**:
  - Updates `handle_new_user()` trigger function
  - Migrates existing orphaned users from 'pending_verification' to 'anonymous'
- **Side Effects**: None - only affects new user registrations

### 2. `20250130_atomic_verification_request.sql`
- **Purpose**: Create atomic functions for verification operations
- **Changes**:
  - Adds `create_verification_request()` function for atomic request creation
  - Adds `update_verification_status()` function for atomic status updates
- **Side Effects**: None - adds new functions without changing existing data

### 3. `20250131_fix_admin_notes_complete.sql`
- **Purpose**: Convert admin_notes from TEXT to JSONB and fix related functions
- **Changes**:
  - Drops and recreates `admin_verification_queue` view
  - Converts `admin_notes` column from TEXT to JSONB
  - Updates `update_verification_status()` function to handle JSONB
- **Side Effects**: Any code expecting TEXT format for admin_notes must be updated

### 4. Other migrations (DO NOT DELETE)
- `20250131_fix_admin_notes_format.sql` - Intermediate fix, superseded by complete fix
- `20250131_fix_admin_notes_coalesce.sql` - Intermediate fix, superseded by complete fix
- `20250131_fix_admin_notes_column_type.sql` - Intermediate fix, superseded by complete fix

These intermediate migrations should be kept for audit trail but are not needed if applying fresh.

## Verification Flow After Fixes

```mermaid
graph LR
    A[User Registers] --> B[Status: anonymous]
    B --> C{User Requests Verification}
    C -->|Yes| D[create_verification_request()]
    D --> E[Status: pending_verification]
    D --> F[Record in verification_requests]
    E --> G[Appears in Admin Queue]
    G --> H{Admin Review}
    H -->|Approve| I[Status: verified]
    H -->|Reject| J[Status: rejected]
    H -->|Contact| K[Status: pending + Note]
```

## Data Model

### Tables Involved

1. **user_profiles**
   - `verification_status`: enum ('anonymous', 'pending_verification', 'verified', 'rejected')
   - `sync_version`: integer for optimistic locking

2. **verification_requests**
   - `status`: operational status (New Request, Contacted, etc.)
   - `admin_notes`: JSONB array of admin interactions
   - Links to user_profiles via user_id

### Atomic Functions

1. **create_verification_request()**
   - Creates verification request record
   - Updates user profile status
   - Creates notification
   - All in single transaction

2. **update_verification_status()**
   - Updates operational status in verification_requests
   - Updates profile status in user_profiles
   - Appends admin notes
   - Creates notifications
   - All in single transaction

## Testing

Run the comprehensive test to verify all fixes:

```bash
node scripts/test-verification-system-complete.js
```

Expected output:
- New users start with 'anonymous' status ✅
- Verification requests create both records atomically ✅
- Admin updates are atomic with proper note format ✅
- Final states are properly synchronized ✅

## Production Deployment

1. **Backup database** before applying migrations
2. Apply migrations in order listed above
3. Run verification test script
4. Monitor for any errors in verification flow

## Monitoring

Key metrics to track:
- Verification request success rate
- Admin queue processing time
- State consistency between tables
- Error rates in verification APIs

## Known Limitations

1. **Dual Source of Truth**: verification_status exists in both tables
   - Future improvement: Make user_profiles.verification_status computed

2. **Manual Sync Required**: Some edge cases might need manual sync
   - Use `recalculate_all_counts()` function if counts drift

3. **No Automatic Retry**: Failed verification requests need manual intervention
   - Future improvement: Add retry mechanism with exponential backoff

## Rollback Plan

If issues arise:
1. Restore database from backup
2. Apply only the trigger fix migration (first one)
3. Investigate issues before reapplying other migrations

## Future Improvements

1. **Single Source of Truth**: Make verification_status computed from verification_requests
2. **Event Sourcing**: Log all state transitions for complete audit trail
3. **Real-time Updates**: WebSocket notifications for status changes
4. **Automated Testing**: CI/CD pipeline with verification flow tests
