# Advisory sync API setup

## What this adds

- `POST /api/advisories/sync`: authenticated batch upsert from Google Apps Script.
- `GET /api/advisories`: authenticated read endpoint for testing and the future dashboard.
- `GET /api/advisories/health`: configuration/health check with no secrets returned.
- `public.advisories`: one canonical database row per permanent spreadsheet `_SYNC_ID`.
- Apps Script synchronizer that sends all business columns dynamically and re-sends a row only when its content hash changes.

The source workbook sheet is `Revised  Unified Quality Check`. Its current business columns run from `Entry Date` through `Outcome`; the Apps Script deliberately reads headers dynamically so future business columns are included automatically.

## 1. Database

Apply:

`supabase/migrations/20260809000000_create_advisories.sql`

The table has RLS enabled and no browser policies. Only the server-side Supabase service-role client should access it.

## 2. Vercel environment variable

Add a long random value named:

`ADVISORY_SYNC_API_KEY`

The project already needs its existing `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` variables.

Redeploy after adding/changing environment variables.

## 3. Verify API

Health:

```bash
curl https://YOUR_DOMAIN/api/advisories/health
```

Test an insert:

```bash
curl -X POST https://YOUR_DOMAIN/api/advisories/sync \
  -H 'Authorization: Bearer YOUR_SECRET' \
  -H 'Content-Type: application/json' \
  -d '{
    "records": [{
      "sourceId": "manual-test-001",
      "sheetName": "Revised  Unified Quality Check",
      "rowNumber": 2,
      "status": "pending",
      "data": {
        "Entry Date": "2026-08-09T15:00:00+05:30",
        "Advisor": "Test Advisor",
        "Token": "BTC_USDT",
        "Verdict": "Pending",
        "Ops Action": "Pending",
        "Rejection Reason": "Pending"
      }
    }]
  }'
```

Then send the same `sourceId` with a terminal verdict/action. The table should still contain one row, updated in place.

Read it back:

```bash
curl 'https://YOUR_DOMAIN/api/advisories?limit=20' \
  -H 'Authorization: Bearer YOUR_SECRET'
```

## 4. Apps Script

Add `scripts/google-apps-script/advisory-sync.gs` as a separate file in the existing Apps Script project. Do not replace the existing price-fetching code.

Set Script Properties:

- `ADVISORY_API_URL=https://YOUR_DOMAIN/api/advisories/sync`
- `ADVISORY_API_KEY=<same secret as Vercel>`

Run `TEST_ADVISORY_SYNC` manually once and authorize the script. Verify database records. Then run `INSTALL_ADVISORY_SYNC_TRIGGER` once.

The script automatically appends and hides:

- `_SYNC_ID`
- `_SYNC_HASH`
- `_SYNCED_AT`
- `_SYNC_STATUS`

A row is eligible only when both `Entry Date` and `Advisor` are populated. Formula-only empty rows are therefore ignored.

## Pending-state behavior

There is no long-lived Promise. Each spreadsheet row has a permanent `_SYNC_ID`.

1. Initial row enters with pending/blank `Verdict` and `Ops Action` -> API upserts it as `pending`.
2. Later review fields change -> row hash changes.
3. Next one-minute sync sends the same `_SYNC_ID` again.
4. API upserts the existing database record instead of inserting a duplicate.
5. A non-pending `Verdict` or `Ops Action` makes the canonical status `resolved`.
