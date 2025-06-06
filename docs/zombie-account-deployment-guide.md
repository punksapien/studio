# Zombie Account Management System - Deployment Guide

## 🎯 Overview

The Zombie Account Management System eliminates the "zombie email" UX deadlock by implementing professional account lifecycle management with automated cleanup and admin oversight.

## 🏗️ System Architecture

```
Registration → Unverified (24hr deadline) → Pending Deletion (7 days) → Deleted
                    ↓                              ↓
            Email Verification              Admin Grace Period
                    ↓                              ↓
               Active Account             Admin Actions Available
```

## 📋 Pre-deployment Checklist

### Database Requirements
- [ ] ✅ Migration `20250106000002_zombie_account_management.sql` applied
- [ ] ✅ Account status enum created (`active`, `unverified`, `pending_deletion`, `suspended`)
- [ ] ✅ Account cleanup audit table created
- [ ] ✅ Proper indexes on cleanup-related columns
- [ ] ✅ RLS policies configured for audit table

### API Endpoints
- [ ] ✅ `/api/cleanup/process` - Automated cleanup endpoint
- [ ] ✅ `/api/admin/cleanup-queue` - Admin queue management
- [ ] ✅ `/api/admin/cleanup-queue/[id]` - Individual account actions
- [ ] ✅ All endpoints properly secured with authentication

### Admin Dashboard
- [ ] ✅ Cleanup queue metrics on main admin dashboard
- [ ] ✅ Dedicated cleanup queue management page
- [ ] ✅ Real-time account status monitoring
- [ ] ✅ Manual intervention capabilities (extend, verify, suspend, delete)

### Background Service
- [ ] ✅ `scripts/cleanup-service.js` tested and ready
- [ ] ✅ Dry-run mode working correctly
- [ ] ✅ Comprehensive logging and error handling

## 🚀 Production Deployment

### 1. Environment Configuration

**Required Environment Variables:**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cleanup Service Security
CLEANUP_SERVICE_TOKEN=your_secure_random_token_here
```

**Generate secure cleanup token:**
```bash
# Generate a secure random token
openssl rand -hex 32
```

### 2. Database Migration

```bash
# Apply the zombie account management migration
supabase db reset
# OR if already in production:
supabase db push
```

### 3. Automated Cleanup Service Setup

**Option A: Cron Job (Recommended)**

Create `/etc/cron.d/zombie-cleanup`:
```bash
# Run cleanup service every hour
0 * * * * app cd /path/to/your/app && node scripts/cleanup-service.js >> /var/log/zombie-cleanup.log 2>&1

# Run with dry-run for testing (remove after confirming)
# 0 * * * * app cd /path/to/your/app && node scripts/cleanup-service.js --dry-run >> /var/log/zombie-cleanup-dry.log 2>&1
```

**Option B: Serverless Function (Vercel/Netlify)**

Create API endpoint that calls the cleanup service:
```javascript
// pages/api/cron/cleanup.js (for Vercel Cron Jobs)
import CleanupService from '../../../scripts/cleanup-service.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron job token
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const service = new CleanupService();
    const result = await service.run();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

Configure in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Option C: GitHub Actions (CI/CD Integration)**

```yaml
# .github/workflows/cleanup-service.yml
name: Zombie Account Cleanup
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run cleanup service
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: node scripts/cleanup-service.js
```

## 📊 Monitoring & Alerts

### 1. Log Monitoring

**Key Log Patterns to Monitor:**
```bash
# Successful cleanup operations
grep "\[ZOMBIE-CLEANUP-SERVICE\].*✅" /var/log/zombie-cleanup.log

# Error conditions
grep "\[ZOMBIE-CLEANUP-SERVICE\].*❌" /var/log/zombie-cleanup.log

# Accounts marked for deletion
grep "Marked.*for deletion" /var/log/zombie-cleanup.log

# Accounts permanently deleted
grep "Permanently deleted" /var/log/zombie-cleanup.log
```

### 2. Database Monitoring

**Key Metrics to Track:**
```sql
-- Current cleanup queue size
SELECT
  account_status,
  COUNT(*) as count
FROM user_profiles
WHERE account_status IN ('unverified', 'pending_deletion')
GROUP BY account_status;

-- Accounts approaching deadline (urgent)
SELECT COUNT(*) as urgent_count
FROM user_profiles
WHERE account_status = 'unverified'
  AND verification_deadline < NOW() + INTERVAL '2 hours';

-- Daily cleanup statistics
SELECT
  DATE(created_at) as date,
  action,
  COUNT(*) as count
FROM account_cleanup_audit
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), action
ORDER BY date DESC;
```

### 3. Admin Dashboard Monitoring

**Automated Alerts:**
- When unverified account count > 10
- When pending deletion count > 5
- When cleanup service hasn't run for > 2 hours
- When error rate in cleanup operations > 5%

## 🔧 Operational Procedures

### Daily Operations

**Morning Health Check:**
1. Check admin dashboard cleanup queue metrics
2. Review cleanup service logs for errors
3. Verify automated cleanup is running on schedule
4. Check for any manual intervention requests

**Weekly Review:**
1. Analyze cleanup statistics and trends
2. Review audit trail for compliance
3. Adjust cleanup timing if needed
4. Update documentation based on operational learnings

### Emergency Procedures

**If Cleanup Service Fails:**
1. Check service logs for error details
2. Verify environment variables and database connectivity
3. Run manual cleanup with dry-run first: `node scripts/cleanup-service.js --dry-run`
4. If safe, run actual cleanup: `node scripts/cleanup-service.js`
5. Monitor admin dashboard for restored normal operations

**If Zombie Email Issue Returns:**
1. Check if cleanup service is running
2. Verify database migration was applied correctly
3. Test registration flow with new account
4. Check for any new edge cases in user authentication flow

### Manual Account Management

**Extend Grace Period:**
```bash
# Via API
curl -X PATCH http://localhost:3000/api/admin/cleanup-queue/{user-id} \
  -H "Content-Type: application/json" \
  -d '{
    "action": "extend",
    "hours_extension": 48,
    "reason": "User contacted support",
    "admin_user_id": "admin-user-id"
  }'
```

**Manually Verify Account:**
```bash
# Via API
curl -X PATCH http://localhost:3000/api/admin/cleanup-queue/{user-id} \
  -H "Content-Type: application/json" \
  -d '{
    "action": "verify",
    "reason": "Manual verification completed",
    "admin_user_id": "admin-user-id"
  }'
```

## 🔒 Security Considerations

### Authentication
- [ ] Cleanup service API protected with secure token
- [ ] Admin endpoints require proper authentication
- [ ] Service role key securely stored and rotated regularly

### Data Privacy
- [ ] Audit trail maintains email for compliance even after deletion
- [ ] GDPR compliance through proper data retention policies
- [ ] Clear user communication about data deletion timelines

### Access Control
- [ ] Only admin users can access cleanup queue management
- [ ] Audit trail logs all manual admin actions
- [ ] Service tokens rotated regularly

## 📈 Performance Optimization

### Database Performance
- [ ] Indexes on verification_deadline and deletion_scheduled_at
- [ ] Periodic cleanup of old audit records (after legal retention period)
- [ ] Monitor query performance on large user_profiles table

### Service Performance
- [ ] Cleanup service processes accounts in batches
- [ ] Rate limiting between operations to avoid database overload
- [ ] Monitoring of cleanup service execution time

## 🧪 Testing in Production

### Gradual Rollout
1. **Phase 1**: Deploy with dry-run mode enabled (1 week)
2. **Phase 2**: Enable automated cleanup with extended deadlines (1 week)
3. **Phase 3**: Full deployment with standard 24-hour deadlines

### Validation Tests
```bash
# Test cleanup service manually
node scripts/cleanup-service.js --dry-run --verbose

# Test API endpoints
curl -X POST http://localhost:3000/api/cleanup/process \
  -H "Authorization: Bearer ${CLEANUP_SERVICE_TOKEN}"

# Test admin dashboard access
open http://localhost:3000/admin/cleanup-queue
```

## 📚 Documentation for Team

### For Developers
- [ ] Code documentation in relevant source files
- [ ] API endpoint documentation
- [ ] Database schema documentation
- [ ] Testing procedures for new features

### For Support Team
- [ ] User communication templates for account cleanup
- [ ] Escalation procedures for manual verification requests
- [ ] Admin dashboard training materials

### For Operations Team
- [ ] Monitoring setup and alert configuration
- [ ] Log analysis procedures
- [ ] Emergency response procedures
- [ ] Performance tuning guidelines

## ✅ Post-Deployment Verification

### Week 1 Checklist
- [ ] Cleanup service running on schedule
- [ ] No errors in service logs
- [ ] Admin dashboard showing accurate metrics
- [ ] User registration flow working correctly
- [ ] Email verification leading to account activation

### Week 2-4 Monitoring
- [ ] Account cleanup statistics trending normally
- [ ] No increase in user support tickets about email issues
- [ ] Database performance remains stable
- [ ] Admin team comfortable with new tools

## 🎉 Success Metrics

**Technical Success:**
- Zero "zombie email" UX deadlock reports
- Cleanup service 99%+ uptime
- Database cleanup queue size < 20 accounts consistently
- Admin response time for manual interventions < 1 hour

**Business Success:**
- Reduced user support tickets about authentication issues
- Improved user onboarding completion rates
- Faster account verification process
- Better data hygiene and compliance posture

---

**Deployment Status**: ✅ Ready for Production
**Last Updated**: 2025-06-06
**Version**: 1.0.0
