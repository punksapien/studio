# Database Seeding Scripts

This directory contains utility scripts for managing users and seeding data in your Supabase database.

## Scripts Overview

### 🔧 Admin User Creation

#### `create-admin-user.js` - Local Admin Creation
Creates an admin user in your local Supabase instance.

```bash
npm run create-admin
# or
node scripts/create-admin-user.js
```

**Admin Credentials:**
- Email: `admin@nobridge.com`
- Password: `100%Test`
- Role: `admin`
- Status: Auto-verified

#### `create-admin-user-remote.js` - Remote Admin Creation
Creates an admin user in a remote Supabase instance.

```bash
# Set environment variables first
export REMOTE_SUPABASE_URL=https://your-project.supabase.co
export REMOTE_SUPABASE_SERVICE_KEY=your-service-role-key

npm run create-admin-remote
# or
node scripts/create-admin-user-remote.js
```

### 🌱 Listing Data Seeding

#### `seed-listings.js` - Local Database Seeding
Creates a complete demo seller account with 5 diverse business listings.

```bash
npm run seed-listings
# or
node scripts/seed-listings.js
```

**Features:**
- ✅ Creates verified seller account (`seller@nobridge.com`)
- ✅ Downloads images from external URLs
- ✅ Uploads images to Supabase storage
- ✅ Creates 5 realistic business listings with full data
- ✅ Auto-verification and proper status setup
- ✅ Comprehensive error handling and logging

**Seller Credentials:**
- Email: `seller@nobridge.com`
- Password: `100%Seller`
- Role: `seller`
- Status: Verified seller

#### `seed-listings-remote.js` - Remote Database Seeding
Same functionality as local seeding but for remote Supabase instances.

```bash
# Set environment variables first
export REMOTE_SUPABASE_URL=https://your-project.supabase.co
export REMOTE_SUPABASE_SERVICE_KEY=your-remote-service-role-key

npm run seed-listings-remote
# or
node scripts/seed-listings-remote.js
```

## Business Listings Created

The seeding script creates 5 diverse business listings:

1. **Commercial & Industrial Painting Contractor** (Indonesia)
   - Industry: Construction & Trades
   - Revenue: $14.4M | Asking: $7M | Employees: 140

2. **Multi-Location Auto Service Center** (India)
   - Industry: Automotive Sales & Repair
   - Revenue: $14.3M | Asking: $9M | Employees: 130

3. **Commercial Landscaping & Groundskeeping** (Indonesia)
   - Industry: Commercial Landscaping
   - Revenue: $17.8M | Asking: $13M | Employees: 175

4. **Regional Coffee Roaster & Cafe Chain** (Indonesia)
   - Industry: Restaurants & Food Service
   - Revenue: $2.6M | Asking: $1M | Employees: 85

5. **Mechanical & Plumbing Contractors** (Vietnam)
   - Industry: Construction & Trades
   - Revenue: $21.1M | Asking: $10M | Employees: 100

## Prerequisites

### Required Environment Variables

**For Local Scripts:**
```bash
NEXT_PUBLIC_SUPABASE_URL=your-local-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
```

**For Remote Scripts:**
```bash
REMOTE_SUPABASE_URL=https://your-project.supabase.co
REMOTE_SUPABASE_SERVICE_KEY=your-remote-service-role-key
```

### Required Permissions

- Service role key with admin privileges
- Write access to `user_profiles` table
- Write access to `listings` table
- Write access to `listing-documents` storage bucket
- Auth admin permissions for user creation

## Technical Details

### Image Handling
- Downloads images from provided URLs with proper user agents
- Handles various image formats automatically
- Uploads to Supabase `listing-documents` bucket
- Generates unique filenames to prevent conflicts
- Graceful fallback if image download/upload fails

### Data Integrity
- Auto-verification bypasses email verification requirements
- Proper role assignment and permissions setup
- Consistent data formatting and validation
- Error recovery and detailed logging
- Cleanup of temporary files

### Security Features
- Uses Supabase service role for admin operations
- Bypasses RLS for setup operations
- Secure credential handling
- Environment variable validation

## Usage Examples

### Development Setup
```bash
# 1. Create admin user for local development
npm run create-admin

# 2. Seed demo listings for testing
npm run seed-listings

# 3. Access the application
# Admin: http://localhost:9002/admin/login
# Seller: http://localhost:9002/auth/login
```

### Production Deployment
```bash
# 1. Set remote environment variables
export REMOTE_SUPABASE_URL=https://your-prod.supabase.co
export REMOTE_SUPABASE_SERVICE_KEY=your-prod-service-key

# 2. Create admin in production
npm run create-admin-remote

# 3. Seed demo data in production
npm run seed-listings-remote
```

## Troubleshooting

### Common Issues

**Environment Variables Missing:**
```
❌ Missing environment variables:
NEXT_PUBLIC_SUPABASE_URL: false
SUPABASE_SERVICE_ROLE_KEY: false
```
→ Check your `.env.local` file or export variables

**Permission Denied:**
```
❌ Error: insufficient_privilege
```
→ Ensure you're using the service role key, not anon key

**Image Download Failures:**
```
⚠️ Image upload failed, continuing without image
```
→ Normal behavior; listings created without hero images

**User Already Exists:**
```
⚠️ Auth user already exists, using existing user...
```
→ Expected behavior; script updates existing user profile

### Getting Help

If you encounter issues:
1. Check that your Supabase instance is running
2. Verify environment variables are correctly set
3. Ensure your service role key has admin privileges
4. Check the detailed console output for specific error messages

## File Structure

```
scripts/
├── README.md                    # This documentation
├── create-admin-user.js         # Local admin creation
├── create-admin-user-remote.js  # Remote admin creation
├── seed-listings.js             # Local listing seeding
└── seed-listings-remote.js      # Remote listing seeding
```
