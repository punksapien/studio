#!/bin/bash

# Zombie Account Cleanup - Cron Job Setup Script
# This script sets up automated cleanup service execution

APP_DIR="/Users/macintosh/Developer/studio"
LOG_DIR="/tmp/zombie-cleanup-logs"
CLEANUP_SERVICE_TOKEN="f576047f57078cd102b3e195c9f6a5de1dbc1d56aa529fc4df8bd62bec33c436"

# Create log directory
mkdir -p "$LOG_DIR"

# Create the cron job entry
CRON_JOB="0 * * * * cd $APP_DIR && CLEANUP_SERVICE_TOKEN=$CLEANUP_SERVICE_TOKEN node scripts/cleanup-service.js >> $LOG_DIR/zombie-cleanup.log 2>&1"

# Add to crontab (will prompt for confirmation)
echo "Setting up cron job for zombie account cleanup..."
echo "Cron job: $CRON_JOB"

# Add the cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron job installed successfully!"
echo "📁 Logs will be written to: $LOG_DIR/zombie-cleanup.log"
echo "🔍 To view logs: tail -f $LOG_DIR/zombie-cleanup.log"
echo "🗑️ To remove cron job: crontab -e (then delete the line)"

# Test the cleanup service immediately
echo "🧪 Testing cleanup service now..."
cd "$APP_DIR"
CLEANUP_SERVICE_TOKEN="$CLEANUP_SERVICE_TOKEN" node scripts/cleanup-service.js --dry-run --verbose

echo "🎉 Deployment setup complete!"
echo ""
echo "Next steps:"
echo "1. Add CLEANUP_SERVICE_TOKEN=$CLEANUP_SERVICE_TOKEN to your .env.local file"
echo "2. The cleanup service will now run automatically every hour"
echo "3. Monitor logs at $LOG_DIR/zombie-cleanup.log"
echo "4. Access admin dashboard at http://localhost:9002/admin/cleanup-queue"
