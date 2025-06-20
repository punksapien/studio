# Image Management for Business Listings

## Overview

The marketplace uses Supabase Storage for hosting listing images to avoid Vercel's static asset limits (388MB of images vs 100-500MB limits).

## Quick Setup

After any database reset, simply run:

```bash
# The simple way
npm run migrate-images

# Or directly
node scripts/smart-image-migration.cjs
```

This single script handles everything automatically!

## When to Run the Migration

### ✅ Always run after:
- `supabase db reset --linked` (remote database reset)
- `supabase db reset` (local database reset)
- Fresh deployment setup
- If images aren't loading in production

### ✅ Safe to run multiple times:
- Skips existing images (won't duplicate)
- Only updates database records that need it
- Idempotent operation

## What the Migration Does

1. **🪣 Setup Storage**: Makes `listing-images` bucket public
2. **📸 Upload Images**: Uploads all images from `public/assets/` to Supabase storage
3. **📋 Update Database**: Converts static URLs to Supabase storage URLs
4. **🔍 Verify**: Tests image accessibility

## Image Locations

- **Original images**: `public/assets/listing-1.jpg` → `supabase-storage/original/listing-1.jpg`
- **CSV images**: `public/assets/listing-assets/listing-*.jpg` → `supabase-storage/listing-assets/listing-*.jpg`

## Production URLs

All images use Supabase storage URLs like:
```
https://kktmizfxgtkodtujursv.supabase.co/storage/v1/object/public/listing-images/original/listing-1.jpg
```

## Workflow Example

```bash
# 1. Reset remote database (this breaks images)
supabase db reset --linked

# 2. Migrate images (this fixes everything)
npm run migrate-images

# 3. Done! Images now work in production ✅
```

## Troubleshooting

If images still don't load:
1. **Check bucket**: `npx supabase storage ls --linked --experimental`
2. **Re-run migration**: `npm run migrate-images`
3. **Check URLs**: Verify they start with `https://...supabase.co/storage/...`

## Technical Details

### Why Not SQL-Only?
- `seed.sql` can only insert database records
- Cannot upload files to storage buckets
- Storage uploads require API calls (JavaScript/Node.js)

### Development vs Production
- **Development**: Uses static files from `public/assets/` (works fine)
- **Production**: Uses Supabase storage (avoids 388MB deployment limit)

### File Structure
```
public/assets/                    # Local files (388MB total)
├── listing-1.jpg                 # Original 5 listings
├── listing-2.jpg
├── ...
└── listing-assets/               # CSV generated images
    ├── listing-001-hash.jpg
    └── ...

supabase-storage/listing-images/  # Production storage
├── original/                     # Original 5 listings
│   ├── listing-1.jpg
│   └── ...
└── listing-assets/               # CSV generated images
    ├── listing-001-hash.jpg
    └── ...
```

## Scripts Overview

- `scripts/smart-image-migration.cjs` - Main migration script (recommended)
- `scripts/complete-migration-to-storage.cjs` - Alternative comprehensive script
- `scripts/setup-public-storage.cjs` - Initial setup script
- `scripts/verify-final-status.cjs` - Verification script
