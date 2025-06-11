#!/bin/bash

# Script to move unnecessary scripts to temp_scripts directory
# Keeps only: scripts/create-admin-user.js and scripts/supabase-reset.sh

echo "Moving scripts to temp_scripts directory..."

# Move all SQL files from root
for file in *.sql; do
    if [ -f "$file" ]; then
        echo "Moving $file"
        mv "$file" temp_scripts/
    fi
done

# Move all JS files from root (debug, test, check, etc)
for file in *.js; do
    if [ -f "$file" ]; then
        echo "Moving $file"
        mv "$file" temp_scripts/
    fi
done

# Move shell scripts from root (except this one)
for file in *.sh; do
    if [ -f "$file" ] && [ "$file" != "move_scripts.sh" ] && [ "$file" != "setup-env.sh" ]; then
        echo "Moving $file"
        mv "$file" temp_scripts/
    fi
done

# Move HTML templates
for file in *.html; do
    if [ -f "$file" ]; then
        echo "Moving $file"
        mv "$file" temp_scripts/
    fi
done

# Move log files
for file in *.log; do
    if [ -f "$file" ]; then
        echo "Moving $file"
        mv "$file" temp_scripts/
    fi
done

# From scripts directory, move everything except the two we want to keep
cd scripts/

# Move all files except create-admin-user.js and supabase-reset.sh
for file in *; do
    if [ -f "$file" ] && [ "$file" != "create-admin-user.js" ] && [ "$file" != "supabase-reset.sh" ] && [ "$file" != "README.md" ]; then
        echo "Moving scripts/$file"
        mv "$file" ../temp_scripts/
    fi
done

cd ..

echo "Script cleanup complete!"
echo ""
echo "Files kept:"
echo "- scripts/create-admin-user.js"
echo "- scripts/supabase-reset.sh"
echo "- scripts/README.md"
echo "- setup-env.sh (root - might be needed for environment setup)"
echo ""
echo "All other scripts moved to temp_scripts/ for manual review"
echo ""
echo "To permanently delete them later, run: rm -rf temp_scripts/"
