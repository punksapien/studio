
# Nobridge - Backend Implementation Plan

## Introduction

This document outlines the intended backend logic and processing steps for the Nobridge platform. It assumes a serverless architecture, conceptually leveraging:

*   **Cloudflare Workers:** For API endpoint logic, business logic, and request handling.
*   **Cloudflare D1:** As the primary SQL database for storing user profiles, listings, inquiries, etc.
*   **Cloudflare R2:** For object storage (e.g., user-uploaded documents, listing images).

The Next.js API routes defined in `src/app/api/` will serve as the primary interface between the frontend application and these backend Cloudflare Worker functions. This plan details the expected behavior and data flow for each significant user action and system process.

---

## I. Authentication Flow (User Registration, Login, Logout, Password Management)

This section details the core authentication mechanisms. While a dedicated auth provider like Clerk or Lucia-auth might be integrated later for robust authentication, this plan outlines the fundamental data operations for user profiles and basic credential management as if building key components with Cloudflare Workers and D1.

### A. User Registration (Seller)

*   **Triggering UI:** Seller Registration Form submission (`src/app/auth/register/seller/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/auth/register/seller/route.ts` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives a POST request containing seller data:
        *   `fullName`
        *   `email`
        *   `password` (plain text from form)
        *   `phoneNumber`
        *   `country`
        *   `initialCompanyName` (optional)
    2.  **Validate Input:**
        *   Use the Zod schema (e.g., `SellerRegisterSchema` from the Next.js API route or a shared schema definition) to validate the received data.
        *   If validation fails, return a 400 Bad Request error with validation details.
    3.  **Check Email Uniqueness:**
        *   Query the `user_profiles` table in Cloudflare D1: `SELECT user_id FROM user_profiles WHERE email = ?`.
        *   If a record is found, return a 409 Conflict error (e.g., "Email address already in use.").
    4.  **Password Hashing (Critical for custom auth):**
        *   Generate a salt.
        *   Hash the received plain-text `password` using a strong hashing algorithm (e.g., Argon2id, scrypt, or bcrypt if platform constraints allow; Cloudflare Workers support Web Crypto API for hashing like SHA-256, but for passwords, a dedicated password hashing library/method is preferred if available or implemented carefully).
        *   *Note: If an auth provider like Clerk or Lucia is used, this step is handled by the provider.*
    5.  **Create User Record in D1:**
        *   Generate a unique `user_id` (e.g., UUID).
        *   Insert a new record into the `user_profiles` table with:
            *   `user_id`: The generated unique ID.
            *   `clerk_user_id` or `auth_provider_id`: (If using an external auth provider, this would be the ID returned by that provider. Null otherwise for custom auth).
            *   `full_name`: `fullName` from request.
            *   `email`: `email` from request (ensure it's stored in a consistent case, e.g., lowercase).
            *   `hashed_password`: The generated password hash (if custom auth).
            *   `password_salt`: The generated salt (if custom auth).
            *   `phone_number`: `phoneNumber` from request.
            *   `country`: `country` from request.
            *   `role`: Set to `'SELLER'`.
            *   `verification_status`: Set to `'ANONYMOUS'` (or `'PENDING_EMAIL_VERIFICATION'` if email verification is the immediate next step).
            *   `is_paid`: Set to `false`.
            *   `initial_company_name`: `initialCompanyName` from request (if provided).
            *   `email_verified`: `false` (until email verification step is complete).
            *   `created_at`: Current UTC timestamp (`DATETIME('now')` in D1 SQL).
            *   `updated_at`: Current UTC timestamp.
    6.  **Email Verification (Conceptual Next Step for custom auth):**
        *   Generate a unique, time-limited email verification token.
        *   Store this token (ideally hashed) in a separate `email_verifications` table in D1, associated with the `user_id` and an expiry timestamp.
        *   Send an email to the user containing a verification link (e.g., `https://nobridge.com/verify-email?token=...`).
        *   *This step is often handled by auth providers like Clerk.*
    7.  **Return Success Response:**
        *   Return a 201 Created status with a success message (e.g., "Seller registered successfully. Please check your email to verify your account.") and potentially the new `user_id`.

### B. User Registration (Buyer)

*   **Triggering UI:** Buyer Registration Form submission (`src/app/auth/register/buyer/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/auth/register/buyer/route.ts` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives a POST request containing buyer data:
        *   `fullName`, `email`, `password`, `phoneNumber`, `country`
        *   `buyerPersonaType`
        *   `buyerPersonaOther` (if `buyerPersonaType` is "Other")
        *   `investmentFocusDescription` (optional)
        *   `preferredInvestmentSize` (optional)
        *   `keyIndustriesOfInterest` (optional)
    2.  **Validate Input:** Use Zod schema (`BuyerRegisterSchema`). Return 400 if invalid.
    3.  **Check Email Uniqueness:** Query D1 `user_profiles` by email. Return 409 if exists.
    4.  **Password Hashing:** (As per Seller registration if custom auth).
    5.  **Create User Record in D1:**
        *   Generate `user_id`.
        *   Insert into `user_profiles`:
            *   `user_id`, (optional `auth_provider_id`), `full_name`, `email`, `hashed_password`, `password_salt`, `phone_number`, `country`.
            *   `role`: Set to `'BUYER'`.
            *   `verification_status`: Set to `'ANONYMOUS'`.
            *   `is_paid`: Set to `false`.
            *   `buyer_persona_type`: `buyerPersonaType` from request.
            *   `buyer_persona_other`: `buyerPersonaOther` from request (if provided).
            *   `investment_focus_description`: `investmentFocusDescription` from request.
            *   `preferred_investment_size`: `preferredInvestmentSize` from request.
            *   `key_industries_of_interest`: `keyIndustriesOfInterest` from request.
            *   `email_verified`: `false`.
            *   `created_at`, `updated_at`.
    6.  **Email Verification:** (As per Seller registration if custom auth).
    7.  **Return Success Response:** 201 Created with success message and `user_id`.

### C. User Login

*   **Triggering UI:** Login Form submission (`src/app/auth/login/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/auth/login/route.ts` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives POST request with `email` and `password`.
    2.  **Validate Input:** Use Zod schema (`LoginSchema`). Return 400 if invalid.
    3.  **Fetch User from D1:**
        *   Query `user_profiles` table: `SELECT user_id, hashed_password, password_salt, role, verification_status, is_paid, full_name, email_verified, last_login FROM user_profiles WHERE email = ?`.
        *   If no user found, return 401 Unauthorized error (e.g., "Invalid credentials.").
    4.  **Verify Password (if custom auth):**
        *   Re-hash the provided plain-text `password` using the fetched `password_salt` and the same hashing algorithm.
        *   Compare the newly generated hash with the stored `hashed_password`.
        *   If they do not match, return 401 Unauthorized error.
        *   *Note: Auth providers handle this verification step.*
    5.  **Check Email Verification Status (Optional but Recommended):**
        *   If `email_verified` is `false`, potentially return a specific error (e.g., 403 Forbidden, "Please verify your email address before logging in.") or allow login but restrict access based on platform rules.
    6.  **Session Management (Conceptual - Cloudflare Workers can use various methods):**
        *   **JWT Approach:**
            *   Generate a JSON Web Token (JWT) containing `user_id`, `role`, `verification_status`, `is_paid`, and an expiry time.
            *   Sign the JWT with a secret key (stored securely as a Worker secret).
            *   Set the JWT as an HTTP-only, secure cookie in the response. The cookie attributes should include `SameSite=Lax` or `SameSite=None; Secure` depending on cross-domain needs, and `Path=/`.
        *   **Cloudflare KV/Durable Objects for Sessions:** Store session data in KV (for simpler state) or a Durable Object (for more complex session logic), and set a session ID cookie. This approach is more stateful.
        *   *Auth providers (Clerk, Lucia) handle session management extensively.*
    7.  **Update Last Login Timestamp:**
        *   Update the `last_login` field for the user in the `user_profiles` table in D1 to the current UTC timestamp (`DATETIME('now')`).
    8.  **Return Success Response:**
        *   Return 200 OK with user information (e.g., `user_id`, `fullName`, `email`, `role`, `verificationStatus`, `isPaid`). Do NOT return password hashes or salts.
        *   The session cookie will be set in the response headers. The frontend might redirect based on the response or the presence of the session.

### D. User Logout

*   **Triggering UI:** Logout button (e.g., in User Dashboards, main Navbar if user is logged in).
*   **Next.js API Route Stub (Conceptual):** `/api/auth/logout/route.ts` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** No specific body needed, but should be an authenticated request (valid session cookie/token).
    2.  **Clear Session Cookie:**
        *   Instruct the client to clear the session cookie by setting it with an immediate expiry date and/or empty value (e.g., `Set-Cookie: sessionToken=; HttpOnly; Secure; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`).
    3.  **Invalidate Session (if applicable on backend):**
        *   If using server-side session storage (e.g., Cloudflare KV or Durable Objects linked to a session ID), delete or mark the session as invalid.
        *   *Auth providers often have SDK methods for invalidating sessions.*
    4.  **Return Success Response:** Return 200 OK with a success message. Frontend will handle redirecting to a public page (e.g., homepage or login page).

### E. Forgot Password - Request Reset

*   **Triggering UI:** Forgot Password Form submission (`src/app/auth/forgot-password/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/auth/forgot-password/route.ts` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives POST request with `email`.
    2.  **Validate Input:** Use Zod schema (`ForgotPasswordSchema`). Return 400 if invalid.
    3.  **Fetch User from D1 (Optional, but good for checking email verification):**
        *   Query `user_profiles`: `SELECT user_id, email_verified FROM user_profiles WHERE email = ?`.
    4.  **Process Request (regardless of user existence for security against enumeration):**
        *   If user exists AND their `email_verified` is true:
            1.  Generate a cryptographically secure, unique, and time-limited password reset token (e.g., a long random string or UUID).
            2.  Hash the token before storing it.
            3.  Store the hashed token in a `password_resets` table in D1, associated with the `user_id` and an expiry timestamp (e.g., 1 hour from now). Ensure tokens can only be used once (e.g., a `used` boolean flag, default `false`).
            4.  Construct a password reset URL (e.g., `https://nobridge.com/reset-password?token=[plainTextToken]`).
            5.  Send an email to the user's email address containing this reset URL and instructions. (This requires an email sending service integration, e.g., Mailgun, SendGrid, or Cloudflare Email Workers).
    5.  **Return Generic Success Response:**
        *   Always return a 200 OK response with a generic message like "If an account with that email address exists and is verified, a password reset link has been sent." This prevents attackers from enumerating registered email addresses.

### F. Reset Password - Handle Reset

*   **Triggering UI:** Reset Password Form submission (from the link sent via email).
*   **Next.js API Route Stub (Conceptual):** `/api/auth/reset-password/route.ts` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives POST request with `token` (from URL query parameter), `newPassword`, `confirmNewPassword`.
    2.  **Validate Input:**
        *   Use a Zod schema to validate `token` (non-empty string) and `newPassword` / `confirmNewPassword` (strength, match). Return 400 if invalid.
    3.  **Verify Reset Token:**
        *   Hash the received plain-text `token` using the same method as when it was stored.
        *   Query the `password_resets` table in D1: `SELECT user_id, expires_at, used FROM password_resets WHERE hashed_token = ?`.
        *   If no token found, or if `expires_at` is in the past, or if `used` is true, return a 400 Bad Request error (e.g., "Invalid or expired password reset token.").
    4.  **Update Password:**
        *   Generate a new salt.
        *   Hash the `newPassword` with the new salt (as per registration process).
        *   Update the `user_profiles` table in D1 for the `user_id` associated with the token: set the new `hashed_password` and `password_salt`. Also update `updated_at`.
    5.  **Invalidate Token:**
        *   Mark the token as used in the `password_resets` table in D1 (e.g., `UPDATE password_resets SET used = true, used_at = DATETIME('now') WHERE hashed_token = ?`).
    6.  **Return Success Response:** Return 200 OK with a success message (e.g., "Password has been reset successfully. You can now login with your new password.").

---

## II. Business Listing Management (Seller Actions)

This section details the backend processes for sellers creating and managing their business listings. Authentication is required for all these actions, and the `seller_id` from the authenticated session must be used to authorize actions and associate data.

### A. Create New Business Listing

*   **Triggering UI:** Seller Dashboard -> "Create New Listing" form submission (`/app/seller-dashboard/listings/create/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/listings/route.ts` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Seller:**
        *   Verify the request is from an authenticated user (e.g., via session token/JWT).
        *   Retrieve `user_id` from the session. This will be the `seller_id` for the listing.
        *   Query `user_profiles` table in D1 to confirm `role` is 'SELLER'. If not, return 403 Forbidden.
    2.  **Receive Request:** Worker receives a POST request with all listing data as per the enhanced `ListingSchema` (defined in the frontend page or a shared schema location). This includes:
        *   Anonymous info: `listingTitleAnonymous`, `industry`, `locationCountry`, `locationCityRegionGeneral`, `anonymousBusinessDescription`, `keyStrengthsAnonymous` (array).
        *   Anonymous financial ranges: `annualRevenueRange`, `netProfitMarginRange` (optional), `askingPriceRange`.
        *   Anonymous deal info: `dealStructureLookingFor` (optional array), `reasonForSellingAnonymous` (optional).
        *   Detailed/Verified info (collected now for later verified view): `businessModel`, `yearEstablished`, `registeredBusinessName`, `businessWebsiteUrl`, `socialMediaLinks`, `numberOfEmployees`, `technologyStack`.
        *   Specific financials (for verified view): `specificAnnualRevenueLastYear`, `specificNetProfitLastYear`, `financialsExplanation`.
        *   Detailed deal/seller info (for verified view): `detailedReasonForSelling`, `sellerRoleAndTimeCommitment`, `postSaleTransitionSupport`.
        *   Growth info: `growthPotentialNarrative`, `specificGrowthOpportunities`.
        *   *Note on Document Placeholders:* The form UI has placeholders for file inputs (`financialStatements`, `keyMetricsReport`, `ownershipDocs`). For this initial creation via API, these might come as filenames or not at all if the actual upload is a separate step (see Section VI). The D1 schema for `listings` should have nullable fields for these document URLs/keys.
    3.  **Validate Input:**
        *   Use the Zod `ListingSchema` to validate the received data.
        *   If validation fails, return a 400 Bad Request error with details.
    4.  **Create Listing Record in D1:**
        *   Generate a unique `listing_id` (e.g., UUID).
        *   Insert a new record into the `listings` table in D1 with:
            *   `listing_id`, `seller_id` (from authenticated user).
            *   All validated fields from the request. Nullable fields should store NULL if not provided.
            *   Placeholders for document URLs/keys (e.g., `financial_documents_url`, `key_metrics_report_url`, `ownership_documents_url`) should be `NULL` initially.
            *   `status`: Set to `'ACTIVE_ANONYMOUS'` (if listings go live anonymously immediately and await optional verification) or `'PENDING_ADMIN_REVIEW'` (if all listings require admin approval before even anonymous display). The plan leans towards `'ACTIVE_ANONYMOUS'`.
            *   `is_seller_verified`: This should reflect the current `verification_status` of the `seller_id` from the `user_profiles` table (e.g., if seller is 'VERIFIED', set this to `true`).
            *   `created_at`, `updated_at`: Current UTC timestamps.
    5.  **Return Success Response:**
        *   Return a 201 Created status with a success message (e.g., "Listing created successfully.") and the new `listing_id` and created listing data.

### B. Edit Existing Business Listing

*   **Triggering UI:** Seller Dashboard -> "My Listings" -> "Edit Listing" button (`/app/seller-dashboard/listings/[listingId]/edit/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/listings/[listingId]/route.ts` (PUT)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Seller & Authorize:**
        *   Verify authenticated seller and get `user_id`.
        *   Retrieve `listingId` from the URL path.
        *   Query the `listings` table in D1: `SELECT seller_id, status FROM listings WHERE listing_id = ?`.
        *   If listing not found, return 404 Not Found.
        *   If `listings.seller_id` does not match authenticated `user_id`, return 403 Forbidden (not owner).
        *   Consider listing `status`: some statuses might prevent editing (e.g., 'PENDING_ADMIN_REVIEW' if admin is currently reviewing).
    2.  **Receive Request:** Worker receives a PUT request with the `listingId` in the path and updated listing data in the body (partial `ListingSchema`).
    3.  **Validate Input:**
        *   Use a partial/update version of the Zod `ListingSchema` (all fields optional) to validate the received data. Ensure any provided data meets format/type requirements.
    4.  **Process Document Updates (Conceptual for R2 - See Section VI):**
        *   If new document placeholders/filenames are provided or existing ones are cleared, this API call itself might not handle the R2 upload/delete. It would primarily update the D1 record's URL/key fields based on information provided by the client *after* the client has interacted with R2 via pre-signed URLs.
    5.  **Update Listing Record in D1:**
        *   Update the specified fields for the given `listing_id` in the `listings` table. Only update fields that are actually present in the request body.
        *   Update `updated_at` timestamp.
        *   If significant content changes are made (e.g., financials, core business description) that might require re-verification by admins (if the listing was previously verified), potentially update `status` to `'PENDING_ADMIN_REVIEW'` or add a flag for admin attention. This depends on business rules.
    6.  **Return Success Response:**
        *   Return a 200 OK status with a success message (e.g., "Listing updated successfully.") and the updated listing data.

### C. Deactivate/Reactivate Listing

*   **Triggering UI:** Seller Dashboard -> "My Listings" -> "Deactivate/Reactivate" button.
*   **Next.js API Route Stub (Conceptual):** `/api/listings/[listingId]/status/route.ts` (PUT) or could be part of the general `PUT /api/listings/[listingId]` endpoint with a specific body like `{ status: 'INACTIVE' }`.
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Seller & Authorize:** (As in "Edit Existing Business Listing").
    2.  **Receive Request:** Worker receives PUT request with `listingId` and desired new status (e.g., `{ new_status: 'INACTIVE' }` or `{ new_status: 'ACTIVE_ANONYMOUS' }`).
    3.  **Validate New Status Transition:**
        *   Fetch the current `status` of the listing from D1.
        *   Ensure the requested `new_status` is a valid transition allowed for a seller from the current status (e.g., seller can likely only toggle between 'ACTIVE_ANONYMOUS' <-> 'INACTIVE'. They cannot self-approve a 'PENDING_ADMIN_REVIEW' or reactivate a 'REJECTED_BY_ADMIN' listing without admin action).
        *   If transition is invalid, return 400 Bad Request.
    4.  **Update Listing Status in D1:**
        *   Update the `status` field for the `listingId` in the `listings` table to `new_status`.
        *   Update `updated_at` timestamp.
    5.  **Return Success Response:** 200 OK with success message and the updated listing (or just the new status).

### D. Seller Requests Listing/Profile Verification

*   **Triggering UI:** Seller Dashboard -> "Verification" page, or "Request Verification Call for this Listing" button on "My Listings" page.
*   **Next.js API Route Stub (Conceptual):** `/api/verification-requests/route.ts` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Seller:** Get authenticated `user_id`.
    2.  **Receive Request:** Worker receives POST request with:
        *   `verificationType`: 'PROFILE' or 'LISTING'.
        *   `listingId` (conditionally required if `verificationType` is 'LISTING').
        *   `bestTimeToCall` (optional string).
        *   `notes` (optional string).
    3.  **Validate Input:** Use a Zod schema. Check that `listingId` is provided if `verificationType` is 'LISTING'.
    4.  **Authorize (if `verificationType` is 'LISTING'):**
        *   If `listingId` is provided, query `listings` table in D1 to ensure the `seller_id` matches the authenticated `user_id`. If not, return 403 Forbidden.
        *   Also, check if the listing is already 'PENDING_VERIFICATION' or verified.
    5.  **Check Current Status & Prevent Redundant Requests:**
        *   If `verificationType` is 'PROFILE': Query `user_profiles` for `user_id`. If `verification_status` is already 'PENDING_VERIFICATION' or 'VERIFIED', return an appropriate message (e.g., 409 Conflict "Profile verification already in progress or completed").
        *   If `verificationType` is 'LISTING': Query `listings` for `listing_id`. If `status` is already 'PENDING_VERIFICATION', 'VERIFIED_ANONYMOUS', or 'VERIFIED_PUBLIC', return 409 Conflict.
    6.  **Update Entity Status in D1 (Tentative - marks intent):**
        *   If `verificationType` is 'PROFILE': `UPDATE user_profiles SET verification_status = 'PENDING_VERIFICATION', updated_at = DATETIME('now') WHERE user_id = ?`.
        *   If `verificationType` is 'LISTING' (and `listingId` is valid and owned): `UPDATE listings SET status = 'PENDING_VERIFICATION', updated_at = DATETIME('now') WHERE listing_id = ?`.
    7.  **Create Verification Request Record in D1:**
        *   Insert a new record into a `verification_requests` table (or similar queue table) with:
            *   `request_id` (UUID).
            *   `user_id` (seller's ID).
            *   `listing_id` (if `verificationType` is 'LISTING', otherwise `NULL`).
            *   `request_type`: `verificationType` (e.g., 'PROFILE_SELLER', 'LISTING').
            *   `best_time_to_call`, `notes` (sanitized).
            *   `status`: 'NEW_REQUEST'.
            *   `created_at`, `updated_at`.
    8.  **Conceptual: Notify Admin Team:** This action effectively adds the request to the Admin Panel's "Seller/Listing Verification Queue" for processing by the admin team. (This could be an email to an admin alias or a flag for the admin panel UI to pick up).
    9.  **Return Success Response:** 201 Created with a success message (e.g., "Verification request submitted. Our team will contact you.").

---

## III. Marketplace & Buyer Actions

This section outlines the backend processes involved when buyers interact with the marketplace and individual listings.

### A. Fetch All Listings (for `/marketplace`)

*   **Triggering UI:** `/marketplace` page load, filter changes, sorting, pagination.
*   **Next.js API Route Stub (Conceptual):** `/api/listings/route.ts` (GET)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives GET request with optional query parameters: `page?`, `limit?`, `industry?`, `country?`, `revenueRange?`, `priceRange?`, `keywords?`, `sortBy?`, `sortOrder?`.
    2.  **Validate Query Parameters:**
        *   Ensure parameters are of expected types and within reasonable limits (e.g., `page` and `limit` are numbers, `sortOrder` is 'ASC' or 'DESC').
        *   Sanitize inputs for SQL queries (though D1 prepared statements handle this).
    3.  **Determine Requesting Buyer's Status (Conceptual - Requires Session/Auth Info):**
        *   Check if the request is from an authenticated buyer (e.g., via session token/JWT).
        *   If authenticated, retrieve the buyer's `user_id`, `verification_status`, and `is_paid` status from their session or by querying the `user_profiles` table in D1. (Default to anonymous if no session).
    4.  **Construct SQL Query for D1 (`listings` table):**
        *   **Field Selection (Conditional):**
            *   Start with selecting all publicly anonymous fields (e.g., `listing_id`, `listingTitleAnonymous`, `industry`, `locationCountry`, `locationCityRegionGeneral`, `SUBSTR(anonymousBusinessDescription, 1, 150) AS description_snippet`, `keyStrengthsAnonymous`, `annualRevenueRange`, `askingPriceRange`, `imageUrl`, `created_at`).
            *   Crucially, also select `seller_id` and `is_seller_verified` from the `listings` table (the `listings.is_seller_verified` flag is set when the listing itself is approved/verified by an admin, possibly based on seller's profile verification).
            *   The logic for showing detailed/verified fields (`actualCompanyName`, specific financials, document URLs etc.) will be handled on the *single listing detail page API* (Section III.B) rather than in this bulk fetch, to simplify this query and response. The marketplace cards only show anonymous data + a "Verified Seller" badge.
        *   **Filtering (`WHERE` clauses):**
            *   Always filter `listings.status` IN `('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC')`. (These are statuses visible on the public marketplace).
            *   Apply `WHERE` clauses based on provided query parameters for `industry`, `locationCountry`. (e.g., `industry = ?`, `locationCountry = ?`).
            *   For range fields (`annualRevenueRange`, `askingPriceRange`), this is tricky if they are stored as strings. A robust solution would be to store numeric representations or use a separate lookup table for ranges. If stored as strings, direct string matching might be needed.
            *   For `keywords`, use `WHERE (listingTitleAnonymous LIKE ? OR anonymousBusinessDescription LIKE ?)` with `'%keyword%'` patterns. Cloudflare D1 supports basic `LIKE`. For more advanced search, consider integrating a dedicated search service or using Cloudflare Workers to perform more complex filtering on fetched results if the dataset is small.
        *   **Sorting (`ORDER BY`):** Apply `ORDER BY` based on `sortBy` (e.g., `listings.created_at`, a numeric representation of `askingPriceRange_min`) and `sortOrder` (`ASC`/`DESC`).
        *   **Pagination:** Apply `LIMIT ? OFFSET ?` based on `page` and `limit`.
    5.  **Execute Query & Fetch Total Count:**
        *   Execute the main query to get the current page of listings.
        *   Execute a separate `SELECT COUNT(*) as total_count FROM listings WHERE ... (same filters as above) ...` to get the `totalListings` count.
    6.  **Process Results:** For each listing, ensure only the selected anonymous fields and `is_seller_verified` are returned.
    7.  **Calculate Pagination Details:** `totalPages = Math.ceil(totalListings / limit)`.
    8.  **Return Success Response:**
        *   Return 200 OK with `{ listings: [...], currentPage, totalPages, totalListings }`.

### B. Fetch Single Listing Details (`/listings/[listingId]`)

*   **Triggering UI:** Navigating to a specific listing detail page.
*   **Next.js API Route Stub (Conceptual):** `/api/listings/[listingId]/route.ts` (GET)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives GET request with `listingId` from the path.
    2.  **Determine Requesting Buyer's Status (Conceptual):** As in "Fetch All Listings" (get `buyer_id`, `buyer_verification_status`, `buyer_is_paid` from session/D1 if authenticated; otherwise, treat as anonymous).
    3.  **Fetch Listing and Seller Data from D1:**
        *   Query `listings` table: `SELECT * FROM listings WHERE listing_id = ?`.
        *   If listing not found, or its `status` is 'INACTIVE' or 'REJECTED_BY_ADMIN' (unless an admin is viewing), return 404 Not Found.
        *   Query `user_profiles` table for the seller: `SELECT user_id AS seller_user_id, verification_status AS seller_verification_status, is_paid AS seller_is_paid, full_name AS seller_full_name FROM user_profiles WHERE user_id = listings.seller_id`.
    4.  **Construct Response Object (Conditional Data Exposure):**
        *   Start by including all anonymous fields of the listing (e.g., `listingTitleAnonymous`, `industry`, `locationCountry`, `anonymousBusinessDescription`, `keyStrengthsAnonymous`, range financials, `imageUrl`, `created_at`, `potentialForGrowthNarrative`, `specificGrowthOpportunities`).
        *   Also include `is_seller_verified` from the listing.
        *   **Conditional Inclusion of Verified Data:**
            *   If `listing.is_seller_verified` is `true` (meaning admin approved the listing's details for verified view)
                *   AND the requesting buyer is authenticated
                *   AND `buyer_verification_status` is `'VERIFIED'`
                *   AND `buyer_is_paid` is `true`:
                *   Then include all detailed/verified fields from the listing in the response (e.g., `actualCompanyName`, `fullBusinessAddress`, `specificAnnualRevenueLastYear`, `specificNetProfitLastYear`, `financialsExplanation`, document URLs like `financialSnapshotUrl`, `ownershipDetailsUrl`, `locationRealEstateInfoUrl`, `webPresenceInfoUrl`, `secureDataRoomLink`, `detailedReasonForSelling`, `sellerRoleAndTimeCommitment`, `postSaleTransitionSupport`).
            *   Otherwise, these verified fields should be omitted or explicitly marked as restricted in the response.
    5.  **Return Success Response:**
        *   Return 200 OK with the constructed listing object.

### C. Buyer Inquires About Business

*   **Triggering UI:** "Inquire about business" button on listing card/detail page.
*   **Next.js API Route Stub (Conceptual):** `/api/inquiries/route.ts` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Buyer:**
        *   Verify the request is from an authenticated buyer (session token/JWT).
        *   Retrieve `user_id` (this is `buyer_id`), `verification_status` (`buyer_verification_status`), and `is_paid` (`buyer_is_paid`) from their session or D1 `user_profiles`.
        *   If not authenticated, return 401/403 Unauthorized.
    2.  **Receive Request:** Worker receives POST request with `{ listingId: string, message?: string }`.
    3.  **Validate Input:** Use Zod schema. Ensure `listingId` is a valid ID format.
    4.  **Fetch Listing and Seller Details from D1:**
        *   `SELECT seller_id, status AS listing_status, is_seller_verified, listingTitleAnonymous FROM listings WHERE listing_id = ?`.
        *   If listing not found or not in an active/publicly viewable state (e.g., 'ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC'), return appropriate error (e.g., 404 Not Found or 400 Bad Request "Listing not available for inquiry").
        *   Fetch seller's details: `SELECT verification_status AS seller_verification_status FROM user_profiles WHERE user_id = listings.seller_id`.
    5.  **Create Inquiry Record in D1:**
        *   Insert into `inquiries` table:
            *   `inquiry_id` (UUID).
            *   `listing_id`.
            *   `buyer_id` (from authenticated buyer).
            *   `seller_id` (from fetched listing).
            *   `message` (if provided and sanitized to prevent XSS).
            *   `inquiry_timestamp` (current UTC timestamp).
            *   `status`: Initial system status, e.g., `'NEW_INQUIRY'`.
            *   Store `buyer_verification_status_at_inquiry`: `buyer_verification_status`.
            *   Store `seller_verification_status_at_inquiry`: `seller_verification_status`.
            *   Store `listing_is_seller_verified_at_inquiry`: `listings.is_seller_verified`.
            *   `created_at`, `updated_at`.
    6.  **Trigger Notifications & Engagement Flow (Conceptual - based on MVP Plan Phase 1 logic):**
        *   **To Seller:** Create a notification record in a `notifications` table in D1 (and/or trigger email via an email service). Content: "New inquiry for '[Listing Title]' from [Buyer's Name (if buyer is verified) or 'an Anonymous Buyer' (if buyer is anonymous)]. View in Dashboard." Link to Seller Dashboard Inquiries page.
        *   The system status is 'NEW_INQUIRY'. The seller will need to click "Engage" to move the flow forward. No admin notification at this stage unless other business rules apply. The next steps (verification prompts) happen after the seller engages (see Section IV.B.5).
    7.  **Return Success Response:** 201 Created with the new inquiry data (or just a success message like "Inquiry submitted successfully.").

### D. Buyer Requests Profile Verification

*   **Triggering UI:** Buyer Dashboard -> "Verification" page -> "Request Verification Call" button.
*   **Next.js API Route Stub (Conceptual):** `/api/verification-requests/route.ts` (POST) - This can be a shared route if the request body includes a `type` field.
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Buyer:** Get authenticated `user_id`.
    2.  **Receive Request:** Worker receives POST request with:
        *   `verificationType`: Should be `'PROFILE_BUYER'`.
        *   `bestTimeToCall` (optional string).
        *   `notes` (optional string).
    3.  **Validate Input:** Use Zod schema. Ensure `verificationType` is correct.
    4.  **Check Current Verification Status:**
        *   Query `user_profiles`: `SELECT verification_status FROM user_profiles WHERE user_id = ?`.
        *   If `verification_status` is already 'VERIFIED' or 'PENDING_VERIFICATION', return an appropriate message (e.g., 409 Conflict "Verification already in progress or completed for your profile.").
    5.  **Update User Profile Status in D1:**
        *   `UPDATE user_profiles SET verification_status = 'PENDING_VERIFICATION', updated_at = DATETIME('now') WHERE user_id = ?`.
    6.  **Create Verification Request Record in D1:**
        *   Insert into `verification_requests` table:
            *   `request_id` (UUID).
            *   `user_id` (buyer's ID).
            *   `request_type`: `'PROFILE_BUYER'`.
            *   `listing_id`: `NULL`.
            *   `best_time_to_call` (sanitized), `notes` (sanitized).
            *   `status`: `'NEW_REQUEST'`.
            *   `created_at`, `updated_at`.
    7.  **Conceptual: Notify Admin Team:** This action effectively adds the request to the Admin Panel's "Buyer Verification Queue."
    8.  **Return Success Response:** 201 Created with a success message (e.g., "Verification request submitted. Our team will contact you.").

---

## IV. Dashboard Data Fetching & Actions (Buyer & Seller)

This section details the backend processes for populating user dashboards and handling user actions within their dashboards. All endpoints here require user authentication. The `user_id` from the authenticated session is paramount for fetching and authorizing data access.

### A. Buyer Dashboard

1.  **Overview Page (`/dashboard/page.tsx` or a buyer-specific route like `/dashboard/buyer/overview`)**
    *   **Data Needed by UI:** Buyer's full name, count of active inquiries, buyer's verification status, list of 2-3 recent inquiries (title, date, status).
    *   **Conceptual API Route (GET):** `/api/dashboard/buyer/overview`
    *   **Backend Worker Logic (D1 Queries):**
        1.  **Authenticate Buyer:** Get `user_id`.
        2.  **Fetch User Profile:** `SELECT full_name, verification_status FROM user_profiles WHERE user_id = ?`.
        3.  **Fetch Active Inquiries Count:** `SELECT COUNT(*) AS active_inquiry_count FROM inquiries WHERE buyer_id = ? AND status NOT IN ('ARCHIVED', 'CONNECTION_FACILITATED')`.
        4.  **Fetch Recent Inquiries:** `SELECT i.inquiry_id, i.listing_id, l.listingTitleAnonymous, i.inquiry_timestamp, i.status AS system_status FROM inquiries i JOIN listings l ON i.listing_id = l.listing_id WHERE i.buyer_id = ? ORDER BY i.inquiry_timestamp DESC LIMIT 3`.
            *   The worker then maps `system_status` to `statusBuyerPerspective` based on the defined rules (this logic could reside in the worker or a shared utility).
        5.  **Return aggregated data:** `{ userProfile, activeInquiryCount, recentInquiriesList }`.

2.  **My Profile (`/dashboard/profile/page.tsx` or buyer-specific profile route)**
    *   **Data Fetching (GET):** Conceptual: `/api/dashboard/buyer/profile` (or reuse general `/api/profile`)
        *   **Backend Worker Logic (D1 Query):**
            1.  Authenticate Buyer: Get `user_id`.
            2.  `SELECT full_name, phone_number, country, email, buyer_persona_type, buyer_persona_other, investment_focus_description, preferred_investment_size, key_industries_of_interest FROM user_profiles WHERE user_id = ?`.
            3.  Return user profile data.
    *   **Profile Update (PUT):** Conceptual: `/api/dashboard/buyer/profile` (or general `/api/profile`)
        *   **Backend Worker Logic:**
            1.  Authenticate Buyer: Get `user_id`.
            2.  Receive request body with fields to update (e.g., `fullName`, `phoneNumber`, `country`, buyer persona fields).
            3.  Validate input against `ProfileSchema` (buyer variant).
            4.  `UPDATE user_profiles SET full_name = ?, phone_number = ?, ..., updated_at = DATETIME('now') WHERE user_id = ?` with new validated data. Only update fields present in the request.
            5.  Return updated profile data or success message.
    *   **Password Change (PUT):** Conceptual: `/api/dashboard/buyer/password` (or use general `/api/auth/change-password`)
        *   **Backend Worker Logic:** (Covered in Authentication Flow - Section I.F, but ensure it's callable from dashboard context). Requires current password verification against the stored hash before updating to new hashed password.

3.  **My Inquiries (`/dashboard/inquiries/page.tsx` or buyer-specific inquiries route)**
    *   **Data Needed by UI:** List of all inquiries made by the buyer (Inquiry Date/Time, Anonymous Listing Title (link), Seller's Platform Status (Verified/Anonymous), Current Inquiry Status from Buyer's Perspective).
    *   **Conceptual API Route (GET):** `/api/dashboard/buyer/inquiries` (or `/api/inquiries?role=buyer`)
    *   **Backend Worker Logic (D1 Queries):**
        1.  Authenticate Buyer: Get `user_id`.
        2.  `SELECT i.inquiry_id, i.listing_id, l.listingTitleAnonymous, l.is_seller_verified AS listing_is_seller_platform_verified, s_profile.verification_status AS seller_platform_verification_status, i.inquiry_timestamp, i.status AS system_status FROM inquiries i JOIN listings l ON i.listing_id = l.listing_id JOIN user_profiles s_profile ON l.seller_id = s_profile.user_id WHERE i.buyer_id = ? ORDER BY i.inquiry_timestamp DESC`.
            *   The `sellerStatus` for UI (e.g., "Platform Verified Seller") can be derived from `listing_is_seller_platform_verified` or `seller_platform_verification_status`.
        3.  The worker maps `system_status` to `statusBuyerPerspective`.
        4.  Return list of inquiries.
    *   **Actions from UI:**
        *   "Proceed to Verification" button (if inquiry status requires it): This button on the frontend navigates to the buyer's verification page/section (`/dashboard/verification`). No direct API call for this button itself, but the inquiry status drives its visibility.

4.  **Verification (`/dashboard/verification/page.tsx` or buyer-specific verification route)**
    *   **Data Needed by UI:** Buyer's current `verification_status`.
    *   **Conceptual API Route (GET):** `/api/dashboard/buyer/profile` (can reuse profile fetch for this).
    *   **Action: Request Verification (POST):** Conceptual: `/api/verification-requests` (as detailed in Section III.D, with `verificationType: 'PROFILE_BUYER'`).

5.  **Notifications (`/dashboard/notifications/page.tsx` or buyer-specific notifications route)**
    *   **Data Needed by UI:** List of notifications for the buyer (message, timestamp, link, isRead, type).
    *   **Conceptual API Route (GET):** `/api/dashboard/buyer/notifications` (or `/api/notifications`)
    *   **Backend Worker Logic (D1 Query):**
        1.  Authenticate Buyer: Get `user_id`.
        2.  `SELECT notification_id, message, timestamp, link, is_read, type FROM notifications WHERE user_id = ? ORDER BY timestamp DESC`.
        3.  Return notifications.
    *   **Action: Mark as Read (PUT/POST):** Conceptual: `/api/dashboard/buyer/notifications/[notificationId]/read` (or `/api/notifications/[notificationId]/read`)
        *   **Backend Worker Logic:**
            1.  Authenticate Buyer: Get `user_id`.
            2.  Receive `notificationId`.
            3.  `UPDATE notifications SET is_read = true, updated_at = DATETIME('now') WHERE notification_id = ? AND user_id = ?`.
            4.  Return success.

### B. Seller Dashboard

1.  **Overview Page (`/seller-dashboard/page.tsx`)**
    *   **Data Needed by UI:** Seller's full name, count of active listings, total inquiries received, inquiries awaiting engagement, seller's verification status, list of 2-3 recent active listings (title, inquiry count, status).
    *   **Conceptual API Route (GET):** `/api/seller-dashboard/overview`
    *   **Backend Worker Logic (D1 Queries):**
        1.  **Authenticate Seller:** Get `user_id`.
        2.  **Fetch User Profile:** `SELECT full_name, verification_status FROM user_profiles WHERE user_id = ?`.
        3.  **Fetch Active Listings Count:** `SELECT COUNT(*) AS active_listing_count FROM listings WHERE seller_id = ? AND status IN ('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC')`.
        4.  **Fetch Total Inquiries Count:** `SELECT COUNT(*) AS total_inquiry_count FROM inquiries WHERE seller_id = ?`.
        5.  **Fetch Inquiries Awaiting Engagement:** `SELECT COUNT(*) AS pending_engagement_count FROM inquiries WHERE seller_id = ? AND status = 'NEW_INQUIRY'`.
        6.  **Fetch Recent Active Listings:** `SELECT listing_id, listingTitleAnonymous, status, (SELECT COUNT(*) FROM inquiries WHERE listing_id = l.listing_id) as inquiry_count FROM listings l WHERE seller_id = ? AND status IN ('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC') ORDER BY created_at DESC LIMIT 3`.
        7.  **Return aggregated data.**

2.  **My Profile (`/seller-dashboard/profile/page.tsx`)**
    *   **Data Fetching (GET):** Conceptual: `/api/seller-dashboard/profile` (or general `/api/profile`)
        *   **Backend Worker Logic (D1 Query):**
            1.  Authenticate Seller: Get `user_id`.
            2.  `SELECT full_name, phone_number, country, initial_company_name, email FROM user_profiles WHERE user_id = ?`.
            3.  Return profile data.
    *   **Profile Update (PUT):** Conceptual: `/api/seller-dashboard/profile` (or general `/api/profile`)
        *   **Backend Worker Logic:**
            1.  Authenticate Seller: Get `user_id`.
            2.  Receive request body.
            3.  Validate input against `ProfileSchema` (seller variant, `initialCompanyName` is required).
            4.  `UPDATE user_profiles SET full_name = ?, ..., initial_company_name = ?, updated_at = DATETIME('now') WHERE user_id = ?`.
            5.  Return updated profile data.
    *   **Password Change (PUT):** Conceptual: `/api/seller-dashboard/password` (or general `/api/auth/change-password`).

3.  **My Listings (`/seller-dashboard/listings/page.tsx`)**
    *   **Data Needed by UI:** List of all listings by the seller (Anonymous Title, Industry, Date Listed, Current Status, Inquiry Count, `is_seller_verified` status of listing).
    *   **Conceptual API Route (GET):** `/api/seller-dashboard/listings` (or `/api/listings?seller_id=CURRENT_USER`)
    *   **Backend Worker Logic (D1 Query):**
        1.  Authenticate Seller: Get `user_id`.
        2.  `SELECT listing_id, listingTitleAnonymous, industry, created_at, status, is_seller_verified, (SELECT COUNT(*) FROM inquiries WHERE listing_id = l.listing_id) as inquiry_count FROM listings l WHERE seller_id = ? ORDER BY created_at DESC`.
        3.  Return list of seller's listings.
    *   **Actions from UI:**
        *   **Deactivate/Reactivate Listing (PUT):** Conceptual: `/api/listings/[listingId]/status` (as detailed in Section II.C). Worker must verify ownership and valid status transition.
        *   **Request Listing Verification (POST):** Conceptual: `/api/verification-requests` (as detailed in Section II.D, with `verificationType: 'LISTING'`).

4.  **Edit Listing (`/seller-dashboard/listings/[listingId]/edit/page.tsx`)**
    *   **Data Fetching (GET):** Conceptual: `/api/listings/[listingId]` (can reuse public GET but requires ownership check for editing context).
        *   **Backend Worker Logic:**
            1.  Authenticate Seller: Get `user_id`.
            2.  Fetch listing from D1 using `listingId`.
            3.  Verify `listing.seller_id === user_id`. If not, return 403 Forbidden.
            4.  Return all listing fields to pre-fill the form.
    *   **Update Listing (PUT):** Conceptual: `/api/listings/[listingId]` (as detailed in Section II.B).

5.  **My Inquiries (`/seller-dashboard/inquiries/page.tsx`)**
    *   **Data Needed by UI:** List of inquiries received by the seller (Inquiry Date/Time, Listing Title, Buyer's Name, Buyer's Verification Status, Current Inquiry Status from Seller's Perspective).
    *   **Conceptual API Route (GET):** `/api/seller-dashboard/inquiries` (or `/api/inquiries?role=seller`)
    *   **Backend Worker Logic (D1 Queries):**
        1.  Authenticate Seller: Get `user_id`.
        2.  `SELECT i.inquiry_id, i.listing_id, l.listingTitleAnonymous, i.buyer_id, u.full_name AS buyer_name, u.verification_status AS buyer_verification_status, i.inquiry_timestamp, i.status AS system_status FROM inquiries i JOIN listings l ON i.listing_id = l.listing_id JOIN user_profiles u ON i.buyer_id = u.user_id WHERE i.seller_id = ? ORDER BY i.inquiry_timestamp DESC`.
        3.  Worker maps `system_status` to `statusSellerPerspective`.
        4.  Return list of inquiries.
    *   **Action: Seller Engages with Inquiry (POST):** Conceptual: `/api/inquiries/[inquiryId]/engage`
        *   **Backend Worker Logic:**
            1.  Authenticate Seller: Get `user_id`.
            2.  Receive `inquiryId`.
            3.  Fetch inquiry from D1: `SELECT * FROM inquiries WHERE inquiry_id = ?`. Verify `inquiry.seller_id === user_id`.
            4.  Fetch associated buyer's profile: `SELECT verification_status AS buyer_verification_status, is_paid AS buyer_is_paid FROM user_profiles WHERE user_id = inquiry.buyer_id`.
            5.  Fetch seller's listing details: `SELECT status AS listing_status, is_seller_verified FROM listings WHERE listing_id = inquiry.listing_id`.
            6.  **Implement Engagement Flow Logic (Critical - based on original MVP plan):**
                *   Determine the next `system_status` for the inquiry based on `buyer_verification_status`, `listing_status` (if listing needs verification), and `is_seller_verified`.
                *   If Buyer is Anonymous: Update `inquiries.status` to `'SELLER_ENGAGED_BUYER_PENDING_VERIFICATION'`. Trigger notification to Buyer ("Your verification required"). Add to Admin "Buyer Verification Queue" (via `verification_requests` table or flag).
                *   Else if Listing is Anonymous/Not Verified (and Seller's Profile might also be Anonymous): Update `inquiries.status` to `'SELLER_ENGAGED_SELLER_PENDING_VERIFICATION'`. Trigger notification to Seller ("Your listing/profile verification required"). Add to Admin "Seller/Listing Verification Queue".
                *   Else (Both Buyer and Seller/Listing are Verified): Update `inquiries.status` to `'READY_FOR_ADMIN_CONNECTION'`. Trigger notification to Admin ("Engagement ready for connection"). Notify Buyer and Seller.
            7.  Update `inquiries` table in D1: set new `status`, set `engagement_timestamp = DATETIME('now')`.
            8.  Return updated inquiry data or success message.

6.  **Verification (`/seller-dashboard/verification/page.tsx`)**
    *   **Data Needed by UI:** Seller's current `verification_status`, list of their anonymous/unverified listings.
    *   **Conceptual API Route (GET):** `/api/seller-dashboard/verification-data`
        *   **Backend Worker Logic (D1 Queries):**
            1.  Authenticate Seller: Get `user_id`.
            2.  `SELECT verification_status FROM user_profiles WHERE user_id = ?`.
            3.  `SELECT listing_id, listingTitleAnonymous, status, is_seller_verified FROM listings WHERE seller_id = ? AND status IN ('ACTIVE_ANONYMOUS', 'PENDING_VERIFICATION')`. Filter for listings that are not yet fully verified.
            4.  Return profile status and list of unverified/pending listings.
    *   **Action: Request Verification (POST):** Conceptual: `/api/verification-requests` (as detailed in Section II.D, `verificationType: 'PROFILE_SELLER'` or `'LISTING'`).

7.  **Notifications (`/seller-dashboard/notifications/page.tsx`)**
    *   **Data Needed by UI:** List of notifications for the seller.
    *   **Conceptual API Route (GET):** `/api/seller-dashboard/notifications` (or `/api/notifications`)
    *   **Backend Worker Logic (D1 Query):** (Same as Buyer notifications, but for `seller_id`).
    *   **Action: Mark as Read (PUT/POST):** (Same as Buyer).

---

## V. Admin Panel Backend Logic

This section details the backend processes for the Admin Panel, which requires a specific 'ADMIN' role for access. All D1 queries assume the admin has appropriate permissions.

### General for all Admin APIs:

*   **Authentication/Authorization:** Every API route intended for admin use MUST:
    1.  Verify the request is from an authenticated user.
    2.  Fetch the user's role from D1 `user_profiles` table using the authenticated `user_id`.
    3.  If `role` is not 'ADMIN', return 403 Forbidden.
*   **Audit Logging (Conceptual):** For all significant write operations (updates, deletes, status changes), a record should be inserted into an `audit_logs` table in D1. Log should include: `log_id` (UUID), `admin_user_id`, `action_type` (e.g., 'USER_VERIFY', 'LISTING_REJECT'), `target_entity_type` (e.g., 'USER', 'LISTING', 'INQUIRY'), `target_entity_id`, `timestamp`, `details_before` (JSON snapshot, optional), `details_after` (JSON snapshot, optional).

### A. User Management

1.  **List Users (`/api/admin/users` - GET)**
    *   **Data Needed:** Paginated list of all users with filtering options.
    *   **Backend Worker Logic (D1 Query):**
        *   Receive query params: `page?`, `limit?`, `role?`, `verification_status?`, `is_paid?`, `search_query?`.
        *   `SELECT user_id, full_name, email, role, verification_status, is_paid, created_at, last_login, (SELECT COUNT(*) FROM listings WHERE seller_id = user_profiles.user_id) AS listing_count, (SELECT COUNT(*) FROM inquiries WHERE buyer_id = user_profiles.user_id) AS inquiry_count FROM user_profiles`.
        *   Apply `WHERE` clauses based on filters (e.g., `role = ?`, `verification_status = ?`, `is_paid = ?`, `(full_name LIKE ? OR email LIKE ?)` for search).
        *   Apply `ORDER BY` and `LIMIT`/`OFFSET`.
        *   Fetch total count with same filters for pagination.
        *   Return paginated user list and pagination info.

2.  **View User Details (`/api/admin/users/[userId]` - GET)**
    *   **Data Needed:** All profile information for a specific user, including buyer persona fields if applicable.
    *   **Backend Worker Logic (D1 Query):**
        *   `SELECT * FROM user_profiles WHERE user_id = ?`.
        *   Return all user profile data.

3.  **Update User Verification/Paid Status (`/api/admin/users/[userId]/status` - PUT)**
    *   **Backend Worker Logic:**
        1.  Receive `userId` from path, and `new_verification_status?`, `new_is_paid?` in request body.
        2.  Validate new status values.
        3.  `UPDATE user_profiles SET verification_status = COALESCE(?, verification_status), is_paid = COALESCE(?, is_paid), updated_at = DATETIME('now') WHERE user_id = ?`.
        4.  Log admin action.
        5.  (Conceptual) Trigger notification to user about status change if significant.
        6.  Return success with updated user status.

4.  **Admin Edit User Profile Details (`/api/admin/users/[userId]/profile` - PUT)**
    *   **Backend Worker Logic:**
        1.  Receive `userId`, and fields like `fullName`, `phoneNumber`, `country`, `initialCompanyName` (if seller), buyer persona fields (if buyer).
        2.  Validate input.
        3.  `UPDATE user_profiles SET ... WHERE user_id = ?`.
        4.  Log admin action.
        5.  Return success.

5.  **Admin Send Password Reset Link (`/api/admin/users/[userId]/send-reset-link` - POST)**
    *   **Backend Worker Logic:**
        1.  Receive `userId`.
        2.  Fetch user's email from `user_profiles`.
        3.  Generate password reset token, store in `password_resets` (as per Section I.E).
        4.  Send reset email.
        5.  Log admin action.
        6.  Return success.

6.  **Delete User (`/api/admin/users/[userId]` - DELETE)**
    *   **Backend Worker Logic:**
        1.  Receive `userId`.
        2.  **Consider implications:**
            *   Soft delete: `UPDATE user_profiles SET is_deleted = true, deleted_at = DATETIME('now') WHERE user_id = ?`. This is generally safer.
            *   Hard delete: `DELETE FROM user_profiles WHERE user_id = ?`. Requires careful consideration of foreign key constraints and cascading deletes or anonymizing related data (listings, inquiries).
            *   What happens to their listings? Deactivate them? Reassign? Delete?
            *   What happens to their inquiries? Mark as void?
        3.  Log admin action.
        4.  Return success.

### B. Listing Management

1.  **List All Listings (`/api/admin/listings` - GET)**
    *   **Data Needed:** Paginated list of all listings with filtering.
    *   **Backend Worker Logic (D1 Query):**
        *   Receive query params: `page?`, `limit?`, `industry?`, `seller_id?`, `status?`, `search_query?`.
        *   `SELECT l.*, u.full_name as seller_name, u.is_paid as seller_is_paid, u.verification_status as seller_verification_status FROM listings l JOIN user_profiles u ON l.seller_id = u.user_id`.
        *   Apply `WHERE` clauses for filters.
        *   Apply `ORDER BY` and `LIMIT`/`OFFSET`.
        *   Fetch total count.
        *   Return paginated listings.

2.  **View Full Listing Details (Admin) (`/api/admin/listings/[listingId]` - GET)**
    *   **Data Needed:** ALL data for a listing, including anonymous, verified fields, and document placeholders.
    *   **Backend Worker Logic (D1 Query):**
        *   `SELECT * FROM listings WHERE listing_id = ?`.
        *   Optionally join with `user_profiles` to also fetch seller details if needed in the same response.
        *   Return full listing data.

3.  **Update Listing Status (Admin) (`/api/admin/listings/[listingId]/status` - PUT)**
    *   **Backend Worker Logic:**
        1.  Receive `listingId`, and `new_status` (e.g., 'VERIFIED_PUBLIC', 'VERIFIED_ANONYMOUS', 'REJECTED_BY_ADMIN', 'INACTIVE'), optionally a `rejection_reason`.
        2.  Validate `new_status`.
        3.  Fetch current listing data.
        4.  `UPDATE listings SET status = ?, updated_at = DATETIME('now') WHERE listing_id = ?`.
        5.  If `new_status` indicates verification (e.g., 'VERIFIED_PUBLIC'), also set `listings.is_seller_verified = true` (assuming admin verification of listing implies seller/listing entity is verified for display purposes).
        6.  If status is 'REJECTED_BY_ADMIN', store `rejection_reason` (requires schema change or separate log).
        7.  Log admin action.
        8.  (Conceptual) Notify seller of listing status change.
        9.  Return success.

### C. Verification Queues

1.  **Fetch Buyer Verification Queue (`/api/admin/verification-requests?type=PROFILE_BUYER` - GET)**
    *   **Backend Worker Logic (D1 Query):**
        *   `SELECT vr.*, u.full_name AS user_name, u.email AS user_email, u.buyer_persona_type FROM verification_requests vr JOIN user_profiles u ON vr.user_id = u.user_id WHERE vr.request_type = 'PROFILE_BUYER' AND vr.status NOT IN ('Approved', 'Rejected') ORDER BY vr.created_at ASC`.
        *   Fetch total count for pagination.
        *   Return paginated requests.

2.  **Fetch Seller/Listing Verification Queue (`/api/admin/verification-requests?type=LISTING` or `type=PROFILE_SELLER` - GET)**
    *   **Backend Worker Logic (D1 Query):**
        *   `SELECT vr.*, u.full_name AS user_name, u.email AS user_email, l.listingTitleAnonymous FROM verification_requests vr JOIN user_profiles u ON vr.user_id = u.user_id LEFT JOIN listings l ON vr.listing_id = l.listing_id WHERE vr.request_type IN ('LISTING', 'PROFILE_SELLER') AND vr.status NOT IN ('Approved', 'Rejected') ORDER BY vr.created_at ASC`.
        *   Fetch total count for pagination.
        *   Return paginated requests.

3.  **Update Verification Request Status (`/api/admin/verification-requests/[requestId]/status` - PUT)**
    *   **Backend Worker Logic:**
        1.  Receive `requestId`, and `new_queue_status` (e.g., 'Contacted', 'Docs Under Review', 'Approved', 'Rejected'), optionally `admin_notes`.
        2.  Validate `new_queue_status`.
        3.  Fetch the `verification_requests` record using `requestId` to get `user_id`, `listing_id`, `request_type`.
        4.  `UPDATE verification_requests SET status = ?, admin_notes = ?, updated_at = DATETIME('now') WHERE request_id = ?`.
        5.  **If `new_queue_status` is 'Approved':**
            *   If `request_type` is 'PROFILE_BUYER' or 'PROFILE_SELLER': `UPDATE user_profiles SET verification_status = 'VERIFIED', updated_at = DATETIME('now') WHERE user_id = ?`.
            *   If `request_type` is 'LISTING': `UPDATE listings SET status = 'VERIFIED_ANONYMOUS' (or 'VERIFIED_PUBLIC' based on rules), is_seller_verified = true, updated_at = DATETIME('now') WHERE listing_id = ?`. (This assumes listing verification also makes the listing appear as from a verified source).
        6.  Log admin action.
        7.  (Conceptual) Notify user of their verification outcome.
        8.  Return success.

### D. Engagement Queue

1.  **Fetch Engagements Ready for Connection (`/api/admin/engagements` or `/api/admin/inquiries?status=ready_for_admin_connection` - GET)**
    *   **Backend Worker Logic (D1 Query):**
        *   `SELECT i.*, buyer.full_name AS buyer_name, buyer.verification_status AS buyer_verification, seller.full_name AS seller_name, seller.verification_status AS seller_verification, l.listingTitleAnonymous, l.status AS listing__status, l.is_seller_verified FROM inquiries i JOIN user_profiles buyer ON i.buyer_id = buyer.user_id JOIN user_profiles seller ON i.seller_id = seller.user_id JOIN listings l ON i.listing_id = l.listing_id WHERE i.status = 'READY_FOR_ADMIN_CONNECTION' ORDER BY i.engagement_timestamp ASC`.
        *   Fetch total count for pagination.
        *   Return paginated engagements.

2.  **Update Engagement Status (Mark as Connection Facilitated) (`/api/admin/engagements/[inquiryId]/status` - PUT)**
    *   **Backend Worker Logic:**
        1.  Receive `inquiryId`, `new_status` (should be 'CONNECTION_FACILITATED').
        2.  Validate.
        3.  `UPDATE inquiries SET status = 'CONNECTION_FACILITATED', updated_at = DATETIME('now') WHERE inquiry_id = ?`.
        4.  Log admin action.
        5.  (Conceptual) Notify buyer and seller that the connection has been made by admin.
        6.  Return success.

### E. Analytics Data Aggregation (Conceptual for D1)

*   **User Metrics (`/api/admin/analytics/users` - GET, or similar):**
    *   Total Users: `SELECT COUNT(*) FROM user_profiles`. Seller vs Buyer: `SELECT role, COUNT(*) FROM user_profiles GROUP BY role`.
    *   Paid/Free Breakdown: `SELECT role, is_paid, COUNT(*) FROM user_profiles GROUP BY role, is_paid`.
    *   Verification Status: `SELECT role, verification_status, COUNT(*) FROM user_profiles GROUP BY role, verification_status`.
*   **Listing Metrics (`/api/admin/analytics/listings` - GET):**
    *   Total Listings: `SELECT status, COUNT(*) FROM listings GROUP BY status`. (Anonymous vs. Verified derived from this).
    *   Listings by Industry: `SELECT industry, COUNT(*) FROM listings WHERE status IN ('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC') GROUP BY industry`.
*   **Engagement/Deal Flow (`/api/admin/analytics/engagements` - GET):**
    *   Total Inquiries: `SELECT COUNT(*) FROM inquiries`. By Status: `SELECT status, COUNT(*) FROM inquiries GROUP BY status`.
    *   Successful Connections MTD: `SELECT COUNT(*) FROM inquiries WHERE status = 'CONNECTION_FACILITATED' AND engagement_timestamp >= date('now', '-1 month')`. (Adapt date logic for D1).
*   **Revenue Metrics (Conceptual - requires payment tracking in D1)**
    *   If subscription payments were stored in a `subscriptions` table linked to `user_id` with amounts and dates:
        *   Total Revenue MTD: `SELECT SUM(amount) FROM subscriptions WHERE transaction_date >= date('now', '-1 month')`.
        *   Revenue by Type: Join `subscriptions` with `user_profiles` to `SUM(amount) GROUP BY user_profiles.role`.

---

## VI. File Upload Handling (Conceptual for R2)

This section details the intended multi-step process for handling file uploads from the frontend (e.g., Seller's "Create Listing Form") to Cloudflare R2, and then linking these files to records in Cloudflare D1.

1.  **Step 1: Frontend Requests Pre-signed URL for Upload**
    *   **Triggering UI:** User selects a file in an `<input type="file">` field (e.g., for financial statements on the "Create Listing" form).
    *   **Frontend Action:**
        *   On file selection, the client-side JavaScript makes an API request (e.g., `POST /api/upload/generate-signed-url`).
        *   Request Body:
            *   `filename: string` (e.g., "profit_and_loss_2023.pdf")
            *   `contentType: string` (e.g., "application/pdf")
            *   `context: 'listing_document' | 'profile_verification'` (to help backend determine path/permissions)
            *   `listingId?: string` (if `context` is 'listing_document')
            *   `documentType?: string` (e.g., 'financial_statement', 'ownership_proof', 'id_proof')
    *   **Next.js API Route Stub (Conceptual):** `/api/upload/generate-signed-url/route.ts` (POST)

2.  **Step 2: Backend Worker Generates Pre-signed R2 URL**
    *   **Detailed Backend Worker Logic (Cloudflare Worker):**
        1.  **Authenticate User:** Verify the request is from an authenticated user (e.g., seller for listing documents, buyer for profile verification docs). Get `user_id`.
        2.  **Authorize:** Ensure user is allowed to upload for the given `context` and `listingId` (if applicable, check ownership).
        3.  **Validate Request Body:** Use a Zod schema.
        4.  **Construct R2 Object Key:** Generate a unique and secure key/path for the object in R2.
            *   Example for listing document: `users/${user_id}/listings/${listingId}/documents/${documentType}/${uuidv4()}-${sanitized_filename}`.
            *   Example for profile document: `users/${user_id}/verification_documents/${documentType}/${uuidv4()}-${sanitized_filename}`.
            *   Ensure filename sanitization to prevent path traversal or invalid characters.
        5.  **Use Cloudflare R2 SDK (`@cloudflare/workers-sdk`'s R2 binding):**
            *   Call the R2 binding's method to generate a pre-signed URL for a `PUT` operation (upload).
            *   Specify: Bucket name, the generated object key, expiry time for the URL (e.g., 5-15 minutes), allowed content type.
            *   The Worker needs appropriate R2 binding configured in `wrangler.toml` and IAM permissions for the Worker to perform `r2.put()` equivalent operations (or rather, to sign URLs for them).
        6.  **Return Success Response:**
            *   Return 200 OK with `{ signedUrl: string, objectKey: string }`. The `objectKey` is the path used in R2, which might be needed by the frontend later.

3.  **Step 3: Frontend Uploads File Directly to R2**
    *   **Frontend Action:**
        1.  Receives the `signedUrl` and `objectKey` from the backend.
        2.  Uses the `fetch` API (or a library like Axios) to make a `PUT` request directly to the `signedUrl`.
        3.  The request body is the actual file (`File` object from the input field).
        4.  Request headers must include `Content-Type` matching what was specified when generating the pre-signed URL.
        5.  Monitor upload progress (optional, for UI feedback).
        6.  On successful upload to R2 (e.g., HTTP 200 OK response from R2).

4.  **Step 4: Frontend Notifies Backend of Successful Upload to Link File**
    *   **Frontend Action (after R2 upload success):**
        *   Makes another API request to the Nobridge backend to associate the uploaded file with the D1 database record.
        *   Example API Route: `POST /api/listings/[listingId]/documents` or `POST /api/profile/documents`.
        *   Request Body:
            *   `documentType: string` (e.g., 'financial_statement', 'ownership_proof', 'id_proof' - matching the earlier request)
            *   `fileKey: string` (the `objectKey` returned in Step 2, or the full R2 URL if preferred for storage in D1)
            *   `originalFilename: string`
            *   `fileSize: number` (optional, for metadata)
            *   `contentType: string` (optional, for metadata)
    *   **Next.js API Route Stub (Conceptual):** `/api/listings/[listingId]/documents/route.ts` (POST) or `/api/profile/documents/route.ts` (POST)

5.  **Step 5: Backend Worker Updates D1 Database with File Reference**
    *   **Detailed Backend Worker Logic (Cloudflare Worker):**
        1.  **Authenticate User & Authorize:** Ensure the user is authorized to attach documents to this listing/profile.
        2.  **Validate Request Body:** Use a Zod schema.
        3.  **Update D1 Database:**
            *   For listing documents: `UPDATE listings SET financial_documents_url = ?, updated_at = DATETIME('now') WHERE listing_id = ? AND seller_id = ?` (or add to a JSON array field if storing multiple documents of one type, or use a separate `listing_documents` table). The field name (`financial_documents_url`, `ownership_documents_url`, etc.) would depend on the `documentType`.
            *   For profile verification documents: Potentially update a field on `user_profiles` or insert into a `user_verification_documents` table linked to `user_id`.
        4.  **Return Success Response:** 200 OK.

This multi-step process is standard for secure direct-to-cloud-storage uploads, offloading the bandwidth and processing of the file transfer from your application server/worker.
