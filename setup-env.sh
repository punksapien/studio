#!/bin/bash

# Generate JWT secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
NEXTAUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Create .env.local file
cat > .env.local << EOF
# JWT Security Configuration (DO NOT COMMIT TO REPOSITORY)
JWT_SECRET=$JWT_SECRET
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# Supabase Configuration (Development)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:9002
EOF

echo "✅ .env.local file created successfully!"
echo "🔑 Generated secure JWT secrets:"
echo "   JWT_SECRET: $JWT_SECRET"
echo "   NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
echo ""
echo "🚀 Now restart your development server: npm run dev"
