# Nobridge Scripts

This directory contains utility scripts for the Nobridge project.

## `supabase-reset.sh` - FIXED Supabase Management

A **corrected** script that follows the key lesson: **"Don't fix normal Docker behavior"**. This script no longer forces unnecessary 8GB+ downloads.

### What Was Wrong Before

❌ **The Previous Problem**: The script was doing exactly what we identified as the root cause:
- Forcing Docker image removal (`docker system prune -af`)
- Causing 8GB+ re-downloads every time
- Creating the 10-15 minute "hanging" behavior we were trying to "fix"
- Making the problem worse instead of better

### What This Script Does Now

✅ **The Corrected Approach**:
- **Normal mode** (default): Preserves Docker images for fast startup
- **Progress feedback**: Shows you what's happening so you know it's working
- **Hard reset** (only when explicitly requested): Warns you about 8GB+ downloads
- **No false problems**: Doesn't "fix" normal Docker behavior

### Usage Examples

```bash
# ✅ DAILY USE - Fast startup preserving images
./scripts/supabase-reset.sh

# ✅ WITH PROGRESS - See what's happening
./scripts/supabase-reset.sh --verbose

# ⚠️  NUCLEAR OPTION - Only if you have real problems
./scripts/supabase-reset.sh --hard --verbose
```

### Expected Behavior

**Normal Mode** (default):
- ✅ Stops Supabase gracefully
- ✅ Preserves Docker images (no 8GB downloads)
- ✅ Starts Supabase quickly (1-2 minutes)
- ✅ Shows progress feedback so you know it's working

**Hard Mode** (--hard flag):
- ⚠️  Warns you about 8GB+ downloads
- ⚠️  Asks for confirmation
- ⚠️  Forces 10-15 minute startup time
- ⚠️  Only use for actual Docker corruption issues

### Progress Feedback Features

1. **Visual Progress**: Dots or detailed logs show activity
2. **Clear Timing**: Tells you when to expect delays
3. **Service Verification**: Confirms all services are working
4. **Helpful Links**: Shows you where to access Studio, Email testing, etc.

### When to Use Each Mode

**Use Normal Mode When**:
- ✅ Daily development workflow
- ✅ Restarting after code changes
- ✅ Switching between projects
- ✅ 99% of the time

**Use Hard Mode When**:
- ❌ Docker containers are actually corrupted
- ❌ You've manually broken something in Docker
- ❌ Volumes are corrupted (rare)
- ❌ Last resort only

### The Key Insight

> **Most "Supabase problems" are just normal Docker behavior being misinterpreted as failures.**

**What looks like "hanging"**:
- Docker downloading images (normal)
- Database migrations running (normal)
- Services starting up (normal)

**What's actually broken**:
- Actual error messages in logs
- Services failing to start after completion
- Real port conflicts

### Troubleshooting Guide

**If startup seems slow**:
1. ✅ Use `--verbose` to see what's happening
2. ✅ Look for "Pulling image" messages (normal)
3. ✅ Wait for completion (don't interrupt)

**If there are real errors**:
1. ✅ Check the error messages carefully
2. ✅ Only use `--hard` if you see actual corruption
3. ✅ Don't assume normal behavior is broken

### File Structure

```
scripts/
├── supabase-reset.sh     # The corrected management script
└── README.md            # This documentation
```

This script now follows the principle: **"Simple approach works best - just run npx supabase start and wait"** while adding helpful progress feedback.
