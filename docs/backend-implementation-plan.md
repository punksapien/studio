
# Nobridge - Backend Implementation Plan

## Introduction

This document outlines the intended backend logic and processing steps for the Nobridge platform. It assumes a serverless architecture, conceptually leveraging:

*   **Cloudflare Workers:** For API endpoint logic, business logic, and request handling.
*   **Cloudflare D1:** As the primary SQL database for storing user profiles, listings, inquiries, etc.
*   **Cloudflare R2:** For object storage (e.g., user-uploaded documents, listing images).

The Next.js API routes defined in `src/app/api/` will serve as the primary interface between the frontend application and these backend Cloudflare Worker functions. This plan details the expected behavior and data flow for each significant user action and system process.

---

## I. Authentication Flow (User Registration, Login, Logout, Password Management)

This section details the core authentication mechanisms. While a dedicated auth provider like Clerk or Lucia-auth might be integrated later, this plan outlines the fundamental data operations as if building key components with Cloudflare Workers and D1.

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
        *   Use the Zod schema (e.g., `SellerRegisterSchema` from the Next.js API route) to validate the received data.
        *   If validation fails, return a 400 Bad Request error with validation details.
    3.  **Check Email Uniqueness:**
        *   Query the `user_profiles` table in Cloudflare D1: `SELECT user_id FROM user_profiles WHERE email = ?`.
        *   If a record is found, return a 409 Conflict error (e.g., "Email address already in use.").
    4.  **Password Hashing (Critical for custom auth):**
        *   Generate a salt.
        *   Hash the received plain-text `password` using a strong hashing algorithm (e.g., Argon2, scrypt, or bcrypt if platform constraints allow). Store both the hash and the salt.
        *   *Note: If an auth provider like Clerk is used, this step is handled by the provider.*
    5.  **Create User Record in D1:**
        *   Generate a unique `user_id` (e.g., UUID).
        *   Insert a new record into the `user_profiles` table with:
            *   `user_id`: The generated unique ID.
            *   `clerk_user_id`: (If using Clerk, this would be the ID returned by Clerk. Null otherwise for custom auth).
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
            *   `created_at`: Current UTC timestamp.
            *   `updated_at`: Current UTC timestamp.
    6.  **Email Verification (Conceptual Next Step):**
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
        *   `fullName`
        *   `email`
        *   `password`
        *   `phoneNumber`
        *   `country`
        *   `buyerPersonaType`
        *   `buyerPersonaOther` (if `buyerPersonaType` is "Other")
        *   `investmentFocusDescription` (optional)
        *   `preferredInvestmentSize` (optional)
        *   `keyIndustriesOfInterest` (optional)
    2.  **Validate Input:** Use Zod schema (`BuyerRegisterSchema`). Return 400 if invalid.
    3.  **Check Email Uniqueness:** Query D1 `user_profiles` by email. Return 409 if exists.
    4.  **Password Hashing:** (As per Seller registration).
    5.  **Create User Record in D1:**
        *   Generate `user_id`.
        *   Insert into `user_profiles`:
            *   `user_id`, (optional `clerk_user_id`), `full_name`, `email`, `hashed_password`, `password_salt`, `phone_number`, `country`.
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
    6.  **Email Verification:** (As per Seller registration).
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
        *   *Note: Auth providers handle this step.*
    5.  **Check Email Verification Status (Optional but Recommended):**
        *   If `email_verified` is `false`, return a specific error (e.g., 403 Forbidden, "Please verify your email address before logging in.") or allow login but restrict access.
    6.  **Session Management (Conceptual - Cloudflare Workers can use various methods):**
        *   **JWT Approach:**
            *   Generate a JSON Web Token (JWT) containing `user_id`, `role`, `verification_status`, `is_paid`, and an expiry time.
            *   Sign the JWT with a secret key (stored securely as a Worker secret).
            *   Set the JWT as an HTTP-only, secure cookie in the response.
        *   **Cloudflare KV/Durable Objects for Sessions:** Store session data in KV or a Durable Object, and set a session ID cookie.
        *   *Auth providers handle session management extensively.*
    7.  **Update Last Login Timestamp:**
        *   Update the `last_login` field for the user in the `user_profiles` table in D1 to the current UTC timestamp.
    8.  **Return Success Response:**
        *   Return 200 OK with user information (e.g., `user_id`, `fullName`, `email`, `role`, `verificationStatus`, `isPaid`). Do NOT return password hashes or salts.
        *   The session cookie will be set in the response headers.

### D. User Logout

*   **Triggering UI:** Logout button (e.g., in User Dashboards, main Navbar if user is logged in).
*   **Next.js API Route Stub (Conceptual):** `/api/auth/logout/route.ts` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** No specific body needed, but should be an authenticated request.
    2.  **Clear Session Cookie:**
        *   Instruct the client to clear the session cookie by setting it with an immediate expiry date and/or empty value (e.g., `Set-Cookie: sessionToken=; HttpOnly; Secure; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`).
    3.  **Invalidate Session (if applicable):**
        *   If using server-side session storage (e.g., Cloudflare KV or Durable Objects), delete or mark the session as invalid.
        *   *Auth providers often have SDK methods for this.*
    4.  **Return Success Response:** Return 200 OK with a success message.

### E. Forgot Password - Request Reset

*   **Triggering UI:** Forgot Password Form submission (`src/app/auth/forgot-password/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/auth/forgot-password/route.ts` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives POST request with `email`.
    2.  **Validate Input:** Use Zod schema (`ForgotPasswordSchema`). Return 400 if invalid.
    3.  **Fetch User from D1:**
        *   Query `user_profiles`: `SELECT user_id, email_verified FROM user_profiles WHERE email = ?`.
    4.  **Process Request (regardless of user existence for security):**
        *   If user exists AND `email_verified` is true:
            1.  Generate a cryptographically secure, unique, and time-limited password reset token (e.g., a long random string or UUID).
            2.  Hash the token before storing it.
            3.  Store the hashed token in a `password_resets` table in D1, associated with the `user_id` and an expiry timestamp (e.g., 1 hour from now). Ensure tokens can only be used once.
            4.  Construct a password reset URL (e.g., `https://nobridge.com/reset-password?token=[plainTextToken]`).
            5.  Send an email to the user's email address containing this reset URL and instructions.
    5.  **Return Generic Success Response:**
        *   Always return a 200 OK response with a generic message like "If an account with that email address exists, a password reset link has been sent." This prevents attackers from enumerating registered email addresses.

### F. Reset Password - Handle Reset

*   **Triggering UI:** Reset Password Form submission (from the link sent via email).
*   **Next.js API Route Stub (Conceptual):** `/api/auth/reset-password/route.ts` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives POST request with `token` (from URL query parameter), `newPassword`, `confirmNewPassword`.
    2.  **Validate Input:**
        *   Use a Zod schema to validate `token` (non-empty string) and `newPassword` / `confirmNewPassword` (strength, match). Return 400 if invalid.
    3.  **Verify Reset Token:**
        *   Hash the received plain-text `token`.
        *   Query the `password_resets` table in D1: `SELECT user_id, expires_at FROM password_resets WHERE hashed_token = ? AND used = false`.
        *   If no token found, or if `expires_at` is in the past, return a 400 Bad Request error (e.g., "Invalid or expired password reset token.").
    4.  **Update Password:**
        *   Generate a new salt.
        *   Hash the `newPassword` with the new salt.
        *   Update the `user_profiles` table in D1 for the `user_id` associated with the token: set the new `hashed_password` and `password_salt`.
    5.  **Invalidate Token:**
        *   Mark the token as used in the `password_resets` table in D1 (e.g., `UPDATE password_resets SET used = true WHERE hashed_token = ?`).
    6.  **Return Success Response:** Return 200 OK with a success message (e.g., "Password has been reset successfully. You can now login with your new password.").

---

## II. Business Listing Management (Seller Actions)

This section details the backend processes for sellers creating and managing their business listings. Authentication is required for all these actions, and the `seller_id` from the authenticated session must be used.

### A. Create New Business Listing

*   **Triggering UI:** Seller Dashboard -> "Create New Listing" form submission (`/app/seller-dashboard/listings/create/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/listings/route.ts` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Seller:**
        *   Verify the request is from an authenticated user.
        *   Retrieve `user_id` from the session. This will be the `seller_id` for the listing.
        *   Query `user_profiles` table in D1 to confirm `role` is 'SELLER'. If not, return 403 Forbidden.
    2.  **Receive Request:** Worker receives a POST request with all listing data as per the enhanced `ListingSchema` (defined in the frontend page). This includes:
        *   Anonymous info: `listingTitleAnonymous`, `industry`, `locationCountry`, `locationCityRegionGeneral`, `anonymousBusinessDescription`, `keyStrengthsAnonymous` (array), `annualRevenueRange`, `netProfitMarginRange` (optional), `askingPriceRange`, `dealStructureLookingFor` (optional array), `reasonForSellingAnonymous` (optional).
        *   Detailed/Verified info (collected now, for later display): `businessModel`, `yearEstablished`, `registeredBusinessName`, `businessWebsiteUrl`, `socialMediaLinks`, `numberOfEmployees`, `technologyStack`, `specificAnnualRevenueLastYear`, `specificNetProfitLastYear`, `financialsExplanation`, `detailedReasonForSelling`, `sellerRoleAndTimeCommitment`, `postSaleTransitionSupport`, `growthPotentialNarrative`, `specificGrowthOpportunities`.
        *   *Note on Documents:* For initial creation, the frontend form has file input placeholders. The actual file upload to R2 and linking URLs will be a multi-step process (see Section VI). This API call might receive only placeholders/filenames initially, or the R2 URLs if uploads happened client-side first via pre-signed URLs.
    3.  **Validate Input:**
        *   Use the Zod schema (`ListingSchema` from the create listing page) to validate the received data.
        *   If validation fails, return a 400 Bad Request error with details.
    4.  **Create Listing Record in D1:**
        *   Generate a unique `listing_id` (e.g., UUID).
        *   Insert a new record into the `listings` table in D1 with:
            *   `listing_id`, `seller_id` (from authenticated user).
            *   All validated fields from the request.
            *   Placeholders for document URLs (`financialDocumentsUrl`, `keyMetricsReportUrl`, `ownershipDocumentsUrl`) - these will be updated later once files are in R2.
            *   `status`: Set to `'PENDING_ADMIN_REVIEW'` (if admin review is default) or `'ACTIVE_ANONYMOUS'` (if listings go live anonymously immediately).
            *   `is_seller_verified`: This should reflect the current `verification_status` of the `seller_id` from the `user_profiles` table (e.g., if seller is 'VERIFIED', set this to `true`).
            *   `created_at`, `updated_at`: Current UTC timestamps.
    5.  **Return Success Response:**
        *   Return a 201 Created status with a success message (e.g., "Listing created successfully and is pending review.") and the new `listing_id`.

### B. Edit Existing Business Listing

*   **Triggering UI:** Seller Dashboard -> "My Listings" -> "Edit Listing" button (`/app/seller-dashboard/listings/[listingId]/edit/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/listings/[listingId]/route.ts` (PUT)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Seller & Authorize:**
        *   Verify authenticated seller and get `user_id`.
        *   Query the `listings` table in D1: `SELECT seller_id FROM listings WHERE listing_id = ?` (using `listingId` from path).
        *   If listing not found, return 404 Not Found.
        *   If `listings.seller_id` does not match authenticated `user_id`, return 403 Forbidden (not owner).
    2.  **Receive Request:** Worker receives a PUT request with the `listingId` in the path and updated listing data in the body (partial `ListingSchema`).
    3.  **Validate Input:**
        *   Use a partial/update version of the Zod `ListingSchema` (all fields optional) to validate the received data.
    4.  **Process Document Updates (Conceptual for R2):**
        *   If new document placeholders/filenames are provided, this indicates an intent to update/replace files. The actual R2 upload might happen via a separate flow using pre-signed URLs before this update call, or this API might handle small direct uploads if designed for it.
        *   If existing document URLs are explicitly cleared, this might involve deleting objects from R2 (or just removing their reference from D1).
    5.  **Update Listing Record in D1:**
        *   Update the specified fields for the given `listing_id` in the `listings` table.
        *   Update `updated_at` timestamp.
        *   If significant content changes are made that require re-verification by admins (e.g., financials, core business description), potentially update `status` to `'PENDING_ADMIN_REVIEW'`.
    6.  **Return Success Response:**
        *   Return a 200 OK status with a success message (e.g., "Listing updated successfully.") and the updated listing data.

### C. Deactivate/Reactivate Listing

*   **Triggering UI:** Seller Dashboard -> "My Listings" -> "Deactivate/Reactivate" button.
*   **Next.js API Route Stub (Conceptual):** `/api/listings/[listingId]/status/route.ts` (PUT) or use the general `PUT /api/listings/[listingId]` endpoint with a specific body.
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Seller & Authorize:** (As in "Edit Existing Business Listing").
    2.  **Receive Request:** Worker receives PUT request with `listingId` and desired new status (e.g., `{ status: 'INACTIVE' }` or `{ status: 'ACTIVE_ANONYMOUS' }`).
    3.  **Validate New Status:** Ensure the new status is a valid transition allowed for a seller (e.g., can't reactivate a 'REJECTED_BY_ADMIN' listing without admin action). Only transitions like 'ACTIVE_ANONYMOUS' <-> 'INACTIVE' might be seller-controlled.
    4.  **Update Listing Status in D1:**
        *   Update the `status` field for the `listingId` in the `listings` table.
        *   Update `updated_at` timestamp.
    5.  **Return Success Response:** 200 OK with success message.

### D. Seller Requests Listing/Profile Verification

*   **Triggering UI:** Seller Dashboard -> "Verification" page, or "Request Verification Call for this Listing" button on "My Listings" page.
*   **Next.js API Route Stub (Conceptual):** `/api/verification-requests/route.ts` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Seller:** Get authenticated `user_id`.
    2.  **Receive Request:** Worker receives POST request with:
        *   `verificationType`: 'PROFILE' or 'LISTING'.
        *   `listingId` (required if `verificationType` is 'LISTING').
        *   `bestTimeToCall` (optional string).
        *   `notes` (optional string).
    3.  **Validate Input:** Use a Zod schema.
    4.  **Authorize (if `verificationType` is 'LISTING'):**
        *   If `listingId` is provided, query `listings` table in D1 to ensure the `seller_id` matches the authenticated `user_id`. If not, return 403 Forbidden.
    5.  **Update Entity Status in D1:**
        *   If `verificationType` is 'PROFILE': `UPDATE user_profiles SET verification_status = 'PENDING_VERIFICATION' WHERE user_id = ?`.
        *   If `verificationType` is 'LISTING' (and `listingId` is valid and owned): `UPDATE listings SET status = 'PENDING_VERIFICATION' WHERE listing_id = ?`.
        *   Check current status before updating; if already 'VERIFIED' or 'PENDING_VERIFICATION', return an appropriate message.
    6.  **Create Verification Request Record in D1:**
        *   Insert a new record into a `verification_requests` table with:
            *   `request_id` (UUID).
            *   `user_id` (seller's ID).
            *   `listing_id` (if applicable).
            *   `request_type`: `verificationType` (e.g., 'PROFILE_SELLER_VERIFICATION', 'LISTING_VERIFICATION').
            *   `best_time_to_call`, `notes`.
            *   `status`: 'NEW_REQUEST'.
            *   `created_at`, `updated_at`.
    7.  **Conceptual: Notify Admin Team:** This action effectively adds the request to the Admin Panel's "Seller/Listing Verification Queue" for processing by the admin team.
    8.  **Return Success Response:** 201 Created with a success message (e.g., "Verification request submitted. Our team will contact you.").

---

## III. Marketplace & Buyer Actions

This section outlines the backend processes involved when buyers interact with the marketplace and individual listings.

### A. Fetch All Listings (for `/marketplace`)

*   **Triggering UI:** `/marketplace` page load, filter changes, sorting, pagination.
*   **Next.js API Route Stub (Conceptual):** `/api/listings/route.ts` (GET)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives GET request with optional query parameters: `page?`, `limit?`, `industry?`, `country?`, `revenueRange?`, `priceRange?`, `keywords?`, `sortBy?`, `sortOrder?`.
    2.  **Validate Query Parameters:** Ensure parameters are of expected types and within reasonable limits (e.g., `page` and `limit` are numbers). Sanitize inputs for SQL queries.
    3.  **Determine Requesting Buyer's Status (Conceptual - Requires Session/Auth Info):**
        *   Check if the request is from an authenticated buyer via session token/cookie.
        *   If authenticated, retrieve the buyer's `user_id`, `verification_status`, and `is_paid` status from their session or by querying the `user_profiles` table in D1. (Default to anonymous if no session).
    4.  **Construct SQL Query for D1 (`listings` table):**
        *   **Field Selection:**
            *   Start with selecting all publicly anonymous fields (e.g., `listing_id`, `listingTitleAnonymous`, `industry`, `locationCountry`, `locationCityRegionGeneral`, `anonymousBusinessDescription` (snippet), `keyStrengthsAnonymous`, `annualRevenueRange`, `askingPriceRange`, `imageUrl`, `created_at`).
            *   Crucially, also select `seller_id` and `is_seller_verified` from the `listings` table.
            *   Conditionally, if the *requesting buyer* is `VERIFIED` AND `PAID`, and the *listing's seller* (`listings.is_seller_verified`) is `true`, then also select detailed/verified fields (`actualCompanyName`, `specificAnnualRevenueLastYear`, document URLs, etc.). This logic might be simpler to apply *after* fetching if the initial query complexity is too high, or by constructing dynamic SELECT clauses.
        *   **Filtering:**
            *   Always filter `listings.status` IN `('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC')`.
            *   Apply `WHERE` clauses based on provided query parameters for `industry`, `locationCountry`.
            *   For range fields (`annualRevenueRange`, `askingPriceRange`), map the string range to min/max values and use `>=` and `<=` operators if your D1 schema stores these as numeric bounds. If ranges are stored as strings, direct string matching might be needed, or a more complex lookup table.
            *   For `keywords`, use `WHERE (listingTitleAnonymous LIKE '%keyword%' OR anonymousBusinessDescription LIKE '%keyword%')`. Consider D1's full-text search capabilities for performance if available.
        *   **Sorting:** Apply `ORDER BY` based on `sortBy` (e.g., `listings.created_at`, potentially a sortable representation of `askingPriceRange`) and `sortOrder` (`ASC`/`DESC`).
        *   **Pagination:** Apply `LIMIT` and `OFFSET` based on `page` and `limit`.
    5.  **Execute Query & Fetch Total Count:**
        *   Execute the main query to get the current page of listings.
        *   Execute a separate `SELECT COUNT(*)` query with the same `WHERE` clauses (but without `LIMIT`/`OFFSET`/`ORDER BY`) to get the `totalListings`.
    6.  **Process Results:** For each listing, ensure only appropriate fields are returned based on the buyer's status and the seller's verification status as determined in step 4.
    7.  **Calculate Pagination Details:** `totalPages = Math.ceil(totalListings / limit)`.
    8.  **Return Success Response:**
        *   Return 200 OK with `{ listings: [...], currentPage, totalPages, totalListings }`.

### B. Fetch Single Listing Details (`/listings/[listingId]`)

*   **Triggering UI:** Navigating to a specific listing detail page.
*   **Next.js API Route Stub (Conceptual):** `/api/listings/[listingId]/route.ts` (GET)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives GET request with `listingId` from the path.
    2.  **Determine Requesting Buyer's Status (Conceptual):** As in "Fetch All Listings" (get `buyer_id`, `buyer_verification_status`, `buyer_is_paid` from session/D1 if authenticated).
    3.  **Fetch Listing and Seller Data from D1:**
        *   Query `listings` table: `SELECT * FROM listings WHERE listing_id = ?`.
        *   If listing not found, or its `status` is 'INACTIVE' or 'REJECTED' (unless an admin is viewing), return 404 Not Found.
        *   Query `user_profiles` table for the seller: `SELECT verification_status AS seller_verification_status, is_paid AS seller_is_paid FROM user_profiles WHERE user_id = listings.seller_id`.
    4.  **Construct Response Object:**
        *   Start by including all anonymous fields of the listing.
        *   **Conditional Inclusion of Verified Data:**
            *   If `listing.is_seller_verified` is `true` AND the requesting buyer is authenticated, `buyer_verification_status` is `'VERIFIED'`, AND `buyer_is_paid` is `true`:
                *   Include all detailed/verified fields from the listing (e.g., `actualCompanyName`, `specificAnnualRevenueLastYear`, `financialDocumentsUrl`, `growthPotentialNarrative`, `secureDataRoomLink`, etc.).
            *   Otherwise, do not include these verified fields.
    5.  **Return Success Response:**
        *   Return 200 OK with the constructed listing object.

### C. Buyer Inquires About Business

*   **Triggering UI:** "Inquire about business" button on listing card/detail page.
*   **Next.js API Route Stub (Conceptual):** `/api/inquiries/route.ts` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Buyer:** Verify the request is from an authenticated buyer and retrieve their `user_id`, `verification_status`, and `is_paid` status. If not authenticated, return 401/403.
    2.  **Receive Request:** Worker receives POST request with `{ listingId: string, message?: string }`.
    3.  **Validate Input:** Use Zod schema. Ensure `listingId` is a valid ID.
    4.  **Fetch Listing and Seller Details from D1:**
        *   `SELECT seller_id, status, is_seller_verified, listingTitleAnonymous FROM listings WHERE listing_id = ?`.
        *   If listing not found or not in an active/publicly viewable state (e.g., 'ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC'), return appropriate error (e.g., 404 or 400).
        *   Fetch seller's details: `SELECT verification_status AS seller_verification_status FROM user_profiles WHERE user_id = listings.seller_id`.
    5.  **Create Inquiry Record in D1:**
        *   Insert into `inquiries` table:
            *   `inquiry_id` (UUID).
            *   `listing_id`.
            *   `buyer_id` (from authenticated buyer).
            *   `seller_id` (from fetched listing).
            *   `message` (if provided and sanitized).
            *   `inquiry_timestamp` (current UTC timestamp).
            *   `status`: Initial status, e.g., `'NEW_INQUIRY'`.
            *   `created_at`, `updated_at`.
    6.  **Trigger Notifications & Engagement Flow (Conceptual):**
        *   **To Seller:** Create a notification record in a `notifications` table in D1 (and/or trigger email). Content: "New inquiry for '[Listing Title]' from [Buyer's Name/Anonymous ID if buyer is anonymous, or 'Verified Buyer' if buyer is verified]." Link to Seller Dashboard Inquiries page.
        *   **Engagement Flow (Admin Notification/Queue - See MVP Phase 1 for full logic):**
            *   This step adds complexity based on buyer/seller verification.
            *   If `buyer.verification_status` is 'ANONYMOUS' OR `listings.is_seller_verified` is `false` (and listing status is not yet fully verified): The inquiry might go into a "pending verification" state, and a task/notification is created for the Admin Panel's verification queues. The exact logic of who needs to verify next (buyer or seller/listing) depends on the full engagement flow design.
            *   If both buyer and seller/listing are already 'VERIFIED', the inquiry can proceed to a state where the seller can directly choose to "Engage".
    7.  **Return Success Response:** 201 Created with the new inquiry data (or just a success message).

### D. Buyer Requests Profile Verification

*   **Triggering UI:** Buyer Dashboard -> "Verification" page -> "Request Verification Call" button.
*   **Next.js API Route Stub (Conceptual):** `/api/verification-requests/route.ts` (POST) - Can be reused with a `type` field.
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Buyer:** Get authenticated `user_id`.
    2.  **Receive Request:** Worker receives POST request with:
        *   `verificationType`: Set to 'PROFILE_BUYER'.
        *   `bestTimeToCall` (optional string).
        *   `notes` (optional string).
    3.  **Validate Input:** Use Zod schema.
    4.  **Check Current Verification Status:**
        *   Query `user_profiles`: `SELECT verification_status FROM user_profiles WHERE user_id = ?`.
        *   If already 'VERIFIED' or 'PENDING_VERIFICATION', return an appropriate message (e.g., 409 Conflict "Verification already in progress or completed").
    5.  **Update User Profile Status in D1:**
        *   `UPDATE user_profiles SET verification_status = 'PENDING_VERIFICATION', updated_at = NOW() WHERE user_id = ?`.
    6.  **Create Verification Request Record in D1:**
        *   Insert into `verification_requests` table:
            *   `request_id` (UUID).
            *   `user_id` (buyer's ID).
            *   `request_type`: `'PROFILE_BUYER_VERIFICATION'`.
            *   `listing_id`: `NULL`.
            *   `best_time_to_call`, `notes`.
            *   `status`: `'NEW_REQUEST'`.
            *   `created_at`, `updated_at`.
    7.  **Conceptual: Notify Admin Team:** This action effectively adds the request to the Admin Panel's "Buyer Verification Queue."
    8.  **Return Success Response:** 201 Created with a success message (e.g., "Verification request submitted. Our team will contact you.").

---

## IV. Dashboard Data Fetching & Actions (Buyer & Seller)

This section details the backend processes for populating user dashboards and handling user actions within their dashboards. All endpoints here require user authentication.

### A. Buyer Dashboard

1.  **Overview Page (`/dashboard/page.tsx` or specific buyer overview route)**
    *   **Data Needed:** Buyer's full name, count of active inquiries, buyer's verification status, list of 2-3 recent inquiries (title, date, status).
    *   **API Route (GET):** Conceptual: `/api/buyer-dashboard/overview`
    *   **D1 Query Logic:**
        *   `SELECT full_name, verification_status FROM user_profiles WHERE user_id = ?` (current authenticated buyer).
        *   `SELECT COUNT(*) FROM inquiries WHERE buyer_id = ? AND status NOT IN ('ARCHIVED', 'CONNECTION_FACILITATED')`.
        *   `SELECT listing_id, listingTitleAnonymous, inquiry_timestamp, statusBuyerPerspective FROM inquiries WHERE buyer_id = ? ORDER BY inquiry_timestamp DESC LIMIT 3`. (Requires joining with `listings` or having `listingTitleAnonymous` denormalized on `inquiries`).

2.  **My Profile (`/dashboard/profile/page.tsx` or specific buyer profile route)**
    *   **Data Fetching (GET):** Conceptual: `/api/buyer-dashboard/profile`
        *   **D1 Query Logic:** `SELECT fullName, phoneNumber, country, buyerPersonaType, buyerPersonaOther, investmentFocusDescription, preferredInvestmentSize, keyIndustriesOfInterest, email FROM user_profiles WHERE user_id = ?`.
    *   **Profile Update (PUT):** Conceptual: `/api/buyer-dashboard/profile`
        *   **Backend Worker Logic:**
            1.  Authenticated `user_id` must match the profile being updated.
            2.  Validate input against `ProfileSchema` (buyer variant).
            3.  `UPDATE user_profiles SET ... WHERE user_id = ?` with new validated data.
            4.  Return updated profile data or success message.
    *   **Password Change (PUT):** Conceptual: `/api/buyer-dashboard/password` (or use general `/api/auth/change-password`)
        *   **Backend Worker Logic:** (Covered in Authentication Flow, but ensure it's callable from dashboard context). Verify current password before updating.

3.  **My Inquiries (`/dashboard/inquiries/page.tsx` or specific buyer inquiries route)**
    *   **Data Needed:** List of all inquiries made by the buyer (Inquiry Date/Time, Anonymous Listing Title (link), Seller's Platform Status, Current Inquiry Status from Buyer's Perspective).
    *   **API Route (GET):** Conceptual: `/api/buyer-dashboard/inquiries`
    *   **D1 Query Logic:**
        *   `SELECT i.inquiry_id, i.listing_id, l.listingTitleAnonymous, l.is_seller_verified AS seller_is_platform_verified, i.inquiry_timestamp, i.status AS system_status FROM inquiries i JOIN listings l ON i.listing_id = l.listing_id WHERE i.buyer_id = ? ORDER BY i.inquiry_timestamp DESC`.
        *   The worker then needs to map `system_status` to `statusBuyerPerspective` based on the rules defined in `types.ts` or the MVP plan.
    *   **Actions:**
        *   "Proceed to Verification" button (if inquiry status requires it) navigates to the buyer's verification page/section. No direct API call for this action itself, but the inquiry status drives its visibility.

4.  **Verification (`/dashboard/verification/page.tsx` or specific buyer verification route)**
    *   **Data Needed:** Buyer's current `verification_status`.
    *   **API Route (GET):** Conceptual: `/api/buyer-dashboard/profile` (can reuse profile fetch for this).
    *   **Action: Request Verification (POST):** Conceptual: `/api/verification-requests` (as detailed in Section III.D).

5.  **Notifications (`/dashboard/notifications/page.tsx` or specific buyer notifications route)**
    *   **Data Needed:** List of notifications for the buyer (message, timestamp, link, isRead).
    *   **API Route (GET):** Conceptual: `/api/buyer-dashboard/notifications`
    *   **D1 Query Logic:** `SELECT notification_id, message, timestamp, link, is_read, type FROM notifications WHERE user_id = ? ORDER BY timestamp DESC`.
    *   **Action: Mark as Read (PUT/POST):** Conceptual: `/api/buyer-dashboard/notifications/[notificationId]/read`
        *   **Backend Worker Logic:** `UPDATE notifications SET is_read = true WHERE notification_id = ? AND user_id = ?`.

### B. Seller Dashboard

1.  **Overview Page (`/seller-dashboard/page.tsx`)**
    *   **Data Needed:** Seller's full name, count of active listings, total inquiries received, inquiries awaiting engagement, seller's verification status, list of 2-3 recent active listings (title, inquiry count, status).
    *   **API Route (GET):** Conceptual: `/api/seller-dashboard/overview`
    *   **D1 Query Logic:**
        *   `SELECT full_name, verification_status FROM user_profiles WHERE user_id = ?` (current authenticated seller).
        *   `SELECT COUNT(*) FROM listings WHERE seller_id = ? AND status IN ('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC')`.
        *   `SELECT COUNT(*) FROM inquiries WHERE seller_id = ?`.
        *   `SELECT COUNT(*) FROM inquiries WHERE seller_id = ? AND status = 'NEW_INQUIRY'`.
        *   `SELECT listing_id, listingTitleAnonymous, status, (SELECT COUNT(*) FROM inquiries WHERE listing_id = l.listing_id) as inquiry_count FROM listings l WHERE seller_id = ? AND status IN ('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC') ORDER BY created_at DESC LIMIT 3`.

2.  **My Profile (`/seller-dashboard/profile/page.tsx`)**
    *   **Data Fetching (GET):** Conceptual: `/api/seller-dashboard/profile`
        *   **D1 Query Logic:** `SELECT fullName, phoneNumber, country, initialCompanyName, email FROM user_profiles WHERE user_id = ?`.
    *   **Profile Update (PUT):** Conceptual: `/api/seller-dashboard/profile`
        *   **Backend Worker Logic:**
            1.  Authenticated `user_id` must match the profile being updated.
            2.  Validate input against `ProfileSchema` (seller variant, `initialCompanyName` is required).
            3.  `UPDATE user_profiles SET ... WHERE user_id = ?` with new validated data.
            4.  Return updated profile data or success message.
    *   **Password Change (PUT):** Conceptual: `/api/seller-dashboard/password` (or general `/api/auth/change-password`).

3.  **My Listings (`/seller-dashboard/listings/page.tsx`)**
    *   **Data Needed:** List of all listings by the seller (Anonymous Title, Industry, Date Listed, Status, Inquiry Count, Seller Verified Status).
    *   **API Route (GET):** Conceptual: `/api/seller-dashboard/listings`
    *   **D1 Query Logic:** `SELECT listing_id, listingTitleAnonymous, industry, created_at, status, is_seller_verified, (SELECT COUNT(*) FROM inquiries WHERE listing_id = l.listing_id) as inquiry_count FROM listings l WHERE seller_id = ? ORDER BY created_at DESC`.
    *   **Actions:**
        *   **Deactivate/Reactivate Listing (PUT):** Conceptual: `/api/listings/[listingId]/status` (as detailed in Section II.C). Worker must verify ownership and valid status transition.
        *   **Request Listing Verification (POST):** Conceptual: `/api/verification-requests` (as detailed in Section II.D, for `verificationType: 'LISTING'`).

4.  **Edit Listing (`/seller-dashboard/listings/[listingId]/edit/page.tsx`)**
    *   **Data Fetching (GET):** Conceptual: `/api/listings/[listingId]` (can reuse public GET but ensure seller owns it for pre-fill).
        *   **Backend Worker Logic:** Authenticate seller, verify ownership of `listingId`. Fetch all listing fields from D1.
    *   **Update Listing (PUT):** Conceptual: `/api/listings/[listingId]` (as detailed in Section II.B).

5.  **My Inquiries (`/seller-dashboard/inquiries/page.tsx`)**
    *   **Data Needed:** List of inquiries received by the seller (Inquiry Date/Time, Listing Title, Buyer's Name, Buyer's Verification Status, Current Inquiry Status from Seller's Perspective).
    *   **API Route (GET):** Conceptual: `/api/seller-dashboard/inquiries`
    *   **D1 Query Logic:**
        *   `SELECT i.inquiry_id, i.listing_id, l.listingTitleAnonymous, i.buyer_id, u.full_name AS buyer_name, u.verification_status AS buyer_verification_status, i.inquiry_timestamp, i.status AS system_status FROM inquiries i JOIN listings l ON i.listing_id = l.listing_id JOIN user_profiles u ON i.buyer_id = u.user_id WHERE i.seller_id = ? ORDER BY i.inquiry_timestamp DESC`.
        *   Worker maps `system_status` to `statusSellerPerspective`.
    *   **Action: Seller Engages with Inquiry (POST):** Conceptual: `/api/inquiries/[inquiryId]/engage`
        *   **Backend Worker Logic:**
            1.  Authenticate seller, verify they own the listing associated with `inquiryId`.
            2.  Fetch inquiry details from D1 (`inquiries` table).
            3.  Fetch buyer's `verification_status` and `is_paid` status from `user_profiles`.
            4.  Fetch seller's listing's `status` and `is_seller_verified` from `listings`.
            5.  **Implement Engagement Flow Logic (Critical - based on original MVP plan):**
                *   Determine the next `system_status` for the inquiry based on buyer/seller verification.
                *   Possible next states: `'SELLER_ENGAGED_BUYER_PENDING_VERIFICATION'`, `'SELLER_ENGAGED_SELLER_PENDING_VERIFICATION'`, `'READY_FOR_ADMIN_CONNECTION'`.
                *   `UPDATE inquiries SET status = [new_status], engagement_timestamp = NOW() WHERE inquiry_id = ?`.
            6.  **Trigger Notifications:**
                *   To Buyer: (e.g., "Seller engaged, your verification required" or "Seller engaged, ready for connection"). Create record in `notifications` table.
                *   To Admin: If status becomes 'READY_FOR_ADMIN_CONNECTION', create task in Admin "Ready to Engage" queue. If verification is needed, add to appropriate verification queue.
            7.  Return updated inquiry data or success message.

6.  **Verification (`/seller-dashboard/verification/page.tsx`)**
    *   **Data Needed:** Seller's current `verification_status`, list of their anonymous/unverified listings.
    *   **API Route (GET):** Conceptual: `/api/seller-dashboard/verification-data`
        *   **D1 Query Logic:**
            *   `SELECT verification_status FROM user_profiles WHERE user_id = ?`.
            *   `SELECT listing_id, listingTitleAnonymous FROM listings WHERE seller_id = ? AND status IN ('ACTIVE_ANONYMOUS', 'PENDING_VERIFICATION') AND is_seller_verified = false`.
    *   **Action: Request Verification (POST):** Conceptual: `/api/verification-requests` (as detailed in Section II.D).

7.  **Notifications (`/seller-dashboard/notifications/page.tsx`)**
    *   **Data Needed:** List of notifications for the seller.
    *   **API Route (GET):** Conceptual: `/api/seller-dashboard/notifications`
    *   **D1 Query Logic:** `SELECT notification_id, message, timestamp, link, is_read, type FROM notifications WHERE user_id = ? ORDER BY timestamp DESC`.
    *   **Action: Mark as Read (PUT/POST):** Conceptual: `/api/seller-dashboard/notifications/[notificationId]/read`
        *   **Backend Worker Logic:** `UPDATE notifications SET is_read = true WHERE notification_id = ? AND user_id = ?`.

---
