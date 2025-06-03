#!/bin/bash

# Nobridge Supabase Management Script - ENHANCED VERSION
# This script provides robust Supabase management with automatic recovery
# Usage: ./scripts/supabase-reset.sh [--hard] [--verbose] [--recover]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags
HARD_RESET=false
VERBOSE=false
RECOVER=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --hard)
            HARD_RESET=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --recover)
            RECOVER=true
            shift
            ;;
        *)
            echo "Usage: $0 [--hard] [--verbose] [--recover]"
            echo "  --hard    Force Docker cleanup (WARNING: Will re-download 8GB+ images)"
            echo "  --verbose Show detailed progress"
            echo "  --recover Attempt to recover from failed state"
            exit 1
            ;;
    esac
done

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

verbose() {
    if [[ "$VERBOSE" == true ]]; then
        echo -e "${BLUE}🔍 $1${NC}"
    fi
}

# Function to check if ports are available
check_ports() {
    local ports=(54321 54322 54323 54324)
    local busy_ports=()

    for port in "${ports[@]}"; do
        if lsof -i :$port > /dev/null 2>&1; then
            busy_ports+=($port)
        fi
    done

    if [ ${#busy_ports[@]} -ne 0 ]; then
        error "Ports ${busy_ports[*]} are already in use"
        echo "Please free these ports or stop the services using them"
        exit 1
    fi
}

# Function to check Docker resources
check_docker_resources() {
    local memory=$(docker info --format '{{.MemTotal}}' 2>/dev/null)
    if [ "$memory" -lt 8589934592 ]; then  # 8GB in bytes
        warning "Docker has less than 8GB of memory allocated"
        echo "Consider increasing Docker's memory limit in Docker Desktop settings"
    fi
}

# Function to verify Supabase health
verify_supabase_health() {
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:54321/rest/v1/ > /dev/null; then
            success "Supabase API is responding"
            return 0
        fi

        verbose "Waiting for Supabase to be ready (attempt $attempt/$max_attempts)..."
        sleep 2
        attempt=$((attempt + 1))
    done

    error "Supabase failed to become healthy after $max_attempts attempts"
    return 1
}

# Function to recover from failed state
recover_supabase() {
    log "Attempting to recover Supabase..."

    # Stop any running containers
    npx supabase stop 2>/dev/null || true

    # Remove any stale containers
    docker ps -aq --filter "name=supabase*" | xargs -r docker rm -f 2>/dev/null || true

    # Clean up any stale volumes
    docker volume ls -q --filter "name=supabase*" | xargs -r docker volume rm 2>/dev/null || true

    # Start fresh
    npx supabase start
}

# Main execution
echo -e "${GREEN}🚀 Nobridge Supabase Management${NC}"
echo "======================================"

# Check prerequisites
check_ports
check_docker_resources

if [[ "$RECOVER" == true ]]; then
    recover_supabase
    exit 0
fi

if [[ "$HARD_RESET" == true ]]; then
    warning "HARD RESET MODE: Will clean Docker and re-download images (8GB+)"
    echo -e "${RED}This will take 10-15 minutes for downloads!${NC}"
    echo -n "Continue? (y/N): "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
else
    log "NORMAL MODE: Preserving Docker images for fast startup"
fi

# Step 1: Stop Supabase gracefully
log "Stopping Supabase gracefully..."
if npx supabase stop 2>/dev/null; then
    success "Supabase stopped successfully"
else
    verbose "Supabase was not running or stop failed (normal if not running)"
fi

# Step 2: Only do Docker cleanup if explicitly requested
if [[ "$HARD_RESET" == true ]]; then
    warning "Performing Docker cleanup (this forces image re-download)..."

    # Force stop any remaining containers
    verbose "Force stopping Supabase containers..."
    docker ps -q --filter "name=supabase*" | xargs -r docker stop 2>/dev/null || true

    # Remove containers
    verbose "Removing Supabase containers..."
    docker ps -aq --filter "name=supabase*" | xargs -r docker rm 2>/dev/null || true

    # Clean up volumes and networks
    verbose "Cleaning up Docker resources..."
    docker volume prune -f 2>/dev/null || true
    docker network prune -f 2>/dev/null || true

    # Only remove images if really needed
    warning "Removing Docker images (forces 8GB+ re-download)..."
    docker system prune -af 2>/dev/null || true

    success "Docker cleanup completed (images will be re-downloaded)"
else
    log "Skipping Docker cleanup to preserve images"
fi

# Step 3: Start Supabase with progress feedback
log "Starting Supabase..."
if [[ "$VERBOSE" == true ]]; then
    log "Using --debug mode for detailed progress"
    echo -e "${YELLOW}📥 If you see image pulling messages, this is NORMAL${NC}"
    echo -e "${YELLOW}⏱️  Docker downloads can take 10-15 minutes${NC}"
    echo -e "${YELLOW}🎯 Don't interrupt - let it complete naturally${NC}"
    echo ""

    npx supabase start --debug
else
    log "Starting Supabase (use --verbose to see detailed progress)"
    echo -e "${YELLOW}⏱️  This may take a few minutes for first-time setup${NC}"
    echo -e "${YELLOW}🔄 Progress indicators:${NC}"

    # Start in background and show our own progress
    npx supabase start > /tmp/supabase-start.log 2>&1 &
    START_PID=$!

    # Show progress dots while waiting
    echo -n "    "
    while kill -0 $START_PID 2>/dev/null; do
        echo -n "."
        sleep 2
    done
    echo ""

    # Wait for the process to complete and get exit code
    wait $START_PID
    EXIT_CODE=$?

    if [[ $EXIT_CODE -eq 0 ]]; then
        success "Supabase started successfully"
    else
        error "Supabase failed to start"
        echo "Check the logs with: ./scripts/supabase-reset.sh --verbose"
        exit 1
    fi
fi

# Step 4: Verify services are running and healthy
log "Verifying services..."

# Check if Supabase is running and healthy
if verify_supabase_health; then
    success "Supabase is running and healthy"

    # Show status
    echo ""
    log "Current status:"
    npx supabase status

    echo ""
    success "🎉 All services are ready!"
    echo -e "${GREEN}📱 Studio: http://localhost:54323${NC}"
    echo -e "${GREEN}📧 Email: http://localhost:54324${NC}"
    echo -e "${GREEN}🗄️  API: http://localhost:54321${NC}"

    # Create a health check file
    echo "$(date)" > .supabase-health

else
    error "Supabase failed to start properly"
    echo ""
    echo -e "${YELLOW}💡 Troubleshooting tips:${NC}"
    echo "1. Run with --verbose to see detailed logs"
    echo "2. Check Docker has enough memory (8GB+ recommended)"
    echo "3. Ensure ports 54321-54324 are available"
    echo "4. Try recovery mode: ./scripts/supabase-reset.sh --recover"
    echo ""
    exit 1
fi

echo ""
log "✨ Ready for development!"
