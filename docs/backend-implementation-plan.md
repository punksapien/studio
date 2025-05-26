
# Nobridge - Backend Implementation Plan

## Introduction

This document outlines the intended backend logic and processing steps for the Nobridge platform. It assumes a serverless architecture, conceptually leveraging:

*   **Cloudflare Workers:** For API endpoint logic, business logic, and request handling.
*   **Cloudflare D1:** As the primary SQL database for storing user profiles, listings, inquiries, etc.
*   **Cloudflare R2:** For object storage (e.g., user-uploaded documents, listing images).

The Next.js API routes defined in `src/app/api/` will serve as the primary interface between the frontend application and these backend Cloudflare Worker functions. This plan details the expected behavior and data flow for each significant user action and system process.

---

## I. Authentication Flow (User Registration, Login, OTP)

This section details the core authentication mechanisms, focusing on an OTP (One-Time Password) system for both email verification during registration and as a conceptual second factor for login.

### A. User Registration (Seller)

*   **Triggering UI:** Seller Registration Form submission (`src/app/auth/register/seller/page.tsx`).
*   **Conceptual Next.js API Route:** `POST /api/auth/register/seller/initiate` (This route initiates registration and OTP sending).
*   **Detailed Backend Worker Logic (for `POST /api/auth/register/seller/initiate`):**
    1.  **Receive Request:** Worker receives a POST request containing seller data: `fullName`, `email`, `password` (plain text from form), `phoneNumber`, `country`, `initialCompanyName` (optional).
    2.  **Validate Input:** Use the Zod schema (`SellerRegisterSchema` from the frontend or a shared API schema) to validate all received data. If validation fails, return a 400 Bad Request error with validation details.
    3.  **Check Email Uniqueness (D1 Query):** Query the `user_profiles` table in D1: `SELECT user_id FROM user_profiles WHERE email = ?`. If a record is found (even if email is not yet verified), return a 409 Conflict error (e.g., "Email address already in use or pending verification.").
    4.  **Password Hashing:** Generate a salt. Hash the received plain-text `password` using a strong hashing algorithm (e.g., Argon2id, scrypt, or bcrypt; Cloudflare Workers support Web Crypto API for hashing like SHA-256, but a dedicated password hashing library/method is preferred for password storage).
    5.  **Store Provisional User Record (D1 Insert):** Insert a new record in `user_profiles` table with:
        *   `user_id`: Generate a new unique ID (e.g., UUID).
        *   `full_name`, `email` (consistent case, e.g., lowercase).
        *   `hashed_password`, `password_salt`.
        *   `phone_number`, `country`.
        *   `role`: Set to `'SELLER'`.
        *   `verification_status`: Set to `'ANONYMOUS'`.
        *   `is_paid`: Set to `false`.
        *   `initial_company_name` (if provided).
        *   `email_verified_at`: `NULL` (until OTP verification).
        *   Timestamps: `created_at`, `updated_at`.
    6.  **Generate and Send OTP (for Email Verification):**
        *   Call a shared OTP generation/sending function (see "I.G. OTP Logic").
        *   This function will generate an OTP, hash it, store it in an `otp_verifications` table in D1 (linked to `email` or `user_id`, with `type='REGISTRATION'`, and expiry), and send the plain OTP to the user's email.
    7.  **Return Success Response:** Return a 200 OK status with a success message (e.g., "Registration initiated. Please check your email for an OTP.") and the `email` (to be passed to the `/auth/verify-otp` page).

### B. User Registration (Buyer)

*   **Triggering UI:** Buyer Registration Form submission (`src/app/auth/register/buyer/page.tsx`).
*   **Conceptual Next.js API Route:** `POST /api/auth/register/buyer/initiate`.
*   **Detailed Backend Worker Logic (for `POST /api/auth/register/buyer/initiate`):**
    1.  **Receive Request:** Worker receives buyer data: `fullName`, `email`, `password`, `phoneNumber`, `country`, `buyerPersonaType`, `buyerPersonaOther` (if applicable), `investmentFocusDescription`, `preferredInvestmentSize`, `keyIndustriesOfInterest`.
    2.  **Validate Input:** Use Zod schema (`BuyerRegisterSchema`).
    3.  **Check Email Uniqueness (D1 Query):** (As per Seller registration).
    4.  **Password Hashing:** (As per Seller registration).
    5.  **Store Provisional User Record (D1 Insert):** Insert into `user_profiles` with all buyer-specific fields (e.g., `buyer_persona_type`, `investment_focus_description`), `role` set to `'BUYER'`, and `email_verified_at` set to `NULL`.
    6.  **Generate and Send OTP (for Email Verification):** (As per Seller registration, type 'REGISTRATION').
    7.  **Return Success Response:** With `email`.

### C. User Login - Step 1: Credential Validation & OTP Trigger

*   **Triggering UI:** Login Form submission (`src/app/auth/login/page.tsx`).
*   **Conceptual Next.js API Route:** `POST /api/auth/login/initiate`.
*   **Detailed Backend Worker Logic:**
    1.  **Receive Request:** Worker receives POST request with `email` and `password`.
    2.  **Validate Input:** Use Zod schema (`LoginSchema`).
    3.  **Fetch User (D1 Query):** Query `user_profiles` table: `SELECT user_id, hashed_password, password_salt, role, verification_status, is_paid, full_name, email_verified_at FROM user_profiles WHERE email = ?`.
    4.  **User Existence & Password Verification:** If no user found, or if re-hashing the provided `password` with the fetched `password_salt` does not match `hashed_password`, return 401 Unauthorized (e.g., "Invalid credentials.").
    5.  **Check Email Verification Status:** If `email_verified_at` is `NULL`, the user hasn't completed their initial registration OTP. Return an error like "Email not verified. Please complete registration via OTP."
    6.  **Generate and Send OTP (for Login 2FA):**
        *   Call shared OTP generation/sending function (see "I.G. OTP Logic") with `type='LOGIN'`.
    7.  **Return Success Response:** Return 200 OK with message "Credentials verified. Please check your email for an OTP to complete login." and `email`.

### D. User Logout

*   **Triggering UI:** Logout button (e.g., in user dashboards or main navbar if logged in).
*   **Conceptual Next.js API Route:** `POST /api/auth/logout`.
*   **Detailed Backend Worker Logic:**
    1.  **Receive Request:** Authenticated request (valid session).
    2.  **Clear Session Cookie:** Instruct client to clear the session cookie (e.g., by setting an expired cookie).
    3.  **Invalidate Session (Backend):** If using server-side session storage (e.g., Cloudflare KV or D1 linked to a session ID), delete or mark the session as invalid.
    4.  **Return Success Response:** 200 OK.

### E. Forgot Password - Step 1: Request Reset OTP

*   **Triggering UI:** Forgot Password Form submission (`src/app/auth/forgot-password/page.tsx`).
*   **Conceptual Next.js API Route:** `POST /api/auth/forgot-password/initiate`.
*   **Detailed Backend Worker Logic:**
    1.  **Receive Request:** Worker receives POST request with `email`.
    2.  **Validate Input:** Use Zod schema.
    3.  **Fetch User (D1 Query):** Query `user_profiles`: `SELECT user_id, email_verified_at FROM user_profiles WHERE email = ?`.
    4.  **Process Request:** If user exists AND `email_verified_at` IS NOT NULL, generate and send OTP (type 'PASSWORD_RESET', see "I.G. OTP Logic").
    5.  **Return Generic Success Response:** Always return 200 OK with "If an account with that email exists and is verified, an OTP for password reset has been sent." (Prevents email enumeration).

### F. Reset Password - Step 2: Verify OTP and Update Password

*   **Triggering UI:** New Password Form (after user clicks link from reset email, conceptually landing on a page like `/auth/reset-password?token=...` which submits to this endpoint).
*   **Conceptual Next.js API Route:** `POST /api/auth/reset-password/complete`.
*   **Detailed Backend Worker Logic:**
    1.  **Receive Request:** Worker receives POST with `token` (the OTP itself or a unique ID mapping to it), `newPassword`, `confirmNewPassword`.
    2.  **Validate Input:** Zod schema for token format and new password rules (strength, match).
    3.  **Verify Reset Token & Fetch User ID (D1 Query):**
        *   Query `otp_verifications` table: `SELECT user_id, expires_at, used_at FROM otp_verifications WHERE (otp = HASH(?) OR unique_token_id = ?) AND type = 'PASSWORD_RESET'`. (Adjust based on whether token is the OTP or a mapper).
        *   If no token found, or `expires_at` is past, or `used_at` IS NOT NULL, return 400 error ("Invalid or expired password reset token.").
        *   Fetch the `user_id` associated with the valid token.
    4.  **Mark Token as Used (D1 Update):** `UPDATE otp_verifications SET used_at = DATETIME('now') WHERE otp_id = ?` (or by token value).
    5.  **Update Password (D1 Update):** Generate new salt, hash `newPassword`. Update `hashed_password` and `password_salt` in `user_profiles` for the fetched `user_id`.
    6.  **Return Success Response:** 200 OK: "Password has been reset successfully. You can now login."

### G. OTP Logic (Shared Functionality - Conceptual Module/Worker)

This outlines common logic for OTP generation, storage, and sending.
*   **1. Generate OTP:** Create a cryptographically secure random numeric string (e.g., 6 digits).
*   **2. Hash OTP:** Generate a salt for the OTP. Hash the plain OTP (e.g., SHA-256) before storing.
*   **3. Store OTP in D1:**
    *   Table: `otp_verifications`
        *   `otp_id` (PK, UUID)
        *   `email` (TEXT, Indexed) - Used to look up OTPs.
        *   `user_id` (TEXT, FK to `user_profiles.user_id`, Nullable) - Link to user if known.
        *   `hashed_otp` (TEXT)
        *   `otp_salt` (TEXT)
        *   `type` (TEXT - e.g., 'REGISTRATION', 'LOGIN', 'PASSWORD_RESET')
        *   `expires_at` (DATETIME) - e.g., 5-10 minutes from creation.
        *   `created_at` (DATETIME)
        *   `used_at` (DATETIME, Nullable) - Timestamp when OTP was successfully used.
    *   Store the hashed OTP, its salt, type, associated email/user_id, and expiry.
*   **4. Send OTP via Email:** Integrate an email sending service (e.g., Mailgun, SendGrid, Cloudflare Email Workers). Compose an email template with the plain OTP and instructions based on OTP `type`.

### H. OTP Verification (Generic Endpoint for Registration & Login OTPs)

*   **Triggering UI:** OTP Entry Form submission (`src/app/(auth)/verify-otp/page.tsx`).
*   **Conceptual Next.js API Route:** `POST /api/auth/verify-otp`.
*   **Detailed Backend Worker Logic:**
    1.  **Receive Request:** Worker receives POST with `email`, `otp` (plain text OTP from form), `type` ('register' or 'login').
    2.  **Validate Input:** Zod schema for email and OTP format.
    3.  **Fetch Stored OTP (D1 Query):** `SELECT otp_id, user_id, hashed_otp, otp_salt, expires_at, used_at FROM otp_verifications WHERE email = ? AND type = ? AND used_at IS NULL AND expires_at > DATETIME('now') ORDER BY created_at DESC LIMIT 1`.
    4.  **OTP Record Check:** If no valid OTP record found, return 400 error ("Invalid or expired OTP.").
    5.  **Verify OTP:** Re-hash received plain-text `otp` using fetched `otp_salt`. Compare with stored `hashed_otp`. If no match, return 400 error ("Invalid OTP."). (Optional: implement try counter for rate limiting).
    6.  **Mark OTP as Used (D1 Update):** `UPDATE otp_verifications SET used_at = DATETIME('now') WHERE otp_id = ?`.
    7.  **Perform Action Based on Type:**
        *   **If `type` is 'register':**
            *   Update `user_profiles` table: `SET email_verified_at = DATETIME('now') WHERE email = ?` (or `user_id = ?`). (User is now fully registered).
            *   Return 200 OK: "Email verified successfully. Please login."
        *   **If `type` is 'login':**
            *   Fetch user details from `user_profiles` by `email` (or `user_id`).
            *   Generate session token/JWT (e.g., using Cloudflare Worker secrets for signing).
            *   Set an HTTP-only, secure session cookie with appropriate expiry.
            *   Update `last_login` timestamp in `user_profiles`.
            *   Return 200 OK with user data (role, name, etc.).
    8.  **Error Handling:** Appropriate error messages for various failure scenarios.

### I. Resend OTP (Conceptual)

*   **Triggering UI:** "Resend OTP" button on `/auth/verify-otp/page.tsx`.
*   **Conceptual Next.js API Route:** `POST /api/auth/resend-otp`.
*   **Detailed Backend Worker Logic:**
    1.  **Receive Request:** Worker receives POST with `email` and `type` ('register', 'login').
    2.  **Validate Input.**
    3.  **(Rate Limiting Check - D1 Query):** Query `otp_verifications` to check recent OTP sends for this email/type. If too many, return rate limit error.
    4.  **Invalidate Old OTPs (Optional but Recommended - D1 Update):** `UPDATE otp_verifications SET expires_at = DATETIME('now') WHERE email = ? AND type = ? AND used_at IS NULL`.
    5.  **Generate and Send New OTP:** Call shared OTP logic (see "I.G. OTP Logic") for the given `email` and `type`.
    6.  **Return Success Response:** 200 OK ("A new OTP has been sent to your email address.").

---

## II. Business Listing Management (Seller Actions)

All actions require an authenticated 'SELLER' role. The `seller_id` (which is the `user_id` of the authenticated seller) from the authenticated session must be used to authorize actions and associate data.

### A. Create New Business Listing

*   **Triggering UI:** Seller Dashboard -> "Create New Listing" form submission (`/app/seller-dashboard/listings/create/page.tsx`).
*   **Conceptual Next.js API Route:** `POST /api/listings`.
*   **Detailed Backend Worker Logic:**
    1.  **Authenticate Seller & Authorize:**
        *   Verify authenticated user (via session). Retrieve `user_id` (this is `seller_id`).
        *   Query `user_profiles` (D1) to confirm `role` is 'SELLER'. If not, return 403 Forbidden.
    2.  **Receive Request:** Worker receives POST with all listing data as per `ListingSchema`. This includes anonymous fields, detailed/verified fields, financial ranges and specifics (including new `askingPrice` (number) and `adjustedCashFlow`), deal info, growth opportunities, and `imageUrls` array.
    3.  **Validate Input:** Use Zod `ListingSchema` (or an equivalent API schema) for comprehensive validation. If fails, return 400.
    4.  **Conceptual File Handling (R2 - see Section VI for full flow):** For fields like `financialDocumentsUrl`, `keyMetricsReportUrl`, etc., and image URLs if direct upload is supported beyond just string URLs. For `imageUrls` provided as strings from the form (e.g. `imageUrl1`, `imageUrl2`), simply store them as an array in the D1 record. The actual file upload process would be separate (see Section VI).
    5.  **Create Listing Record (D1 Insert):**
        *   Generate a unique `listing_id` (e.g., UUID).
        *   Fetch seller's current `verification_status` from their `user_profiles` (D1).
        *   Insert into `listings` table (D1) with:
            *   `listing_id`, `seller_id`.
            *   All validated fields from the request (e.g., `listingTitleAnonymous`, `industry`, `askingPrice` (number), `adjustedCashFlow` (number), `adjustedCashFlowExplanation`, `specificGrowthOpportunities` (as newline string for bullets), etc.). Store `imageUrls` as a JSON string array.
            *   Placeholders for document URLs (e.g., `financial_documents_url`) set to `NULL` initially if not provided/handled yet via the R2 flow.
            *   `status`: Default to `'ACTIVE_ANONYMOUS'`.
            *   `is_seller_verified`: Set to `true` if seller profile `verification_status = 'VERIFIED'`, else `false`.
            *   Timestamps: `created_at`, `updated_at`.
    6.  **Return Success Response:** 201 Created with new `listing_id` and created listing data.

### B. Edit Existing Business Listing

*   **Triggering UI:** Seller Dashboard -> "My Listings" -> "Edit Listing" (`/app/seller-dashboard/listings/[listingId]/edit/page.tsx`).
*   **Conceptual Next.js API Route:** `PUT /api/listings/[listingId]`.
*   **Detailed Backend Worker Logic:**
    1.  **Authenticate Seller & Authorize:**
        *   Verify authenticated seller and get `user_id`.
        *   Retrieve `listingId` from path.
        *   Query `listings` (D1): `SELECT seller_id, status FROM listings WHERE listing_id = ?`.
        *   If not found, return 404. If `listings.seller_id !== user_id`, return 403.
    2.  **Receive Request:** PUT request with `listingId` and updated listing data (partial `ListingSchema`). This includes all fields from the create form.
    3.  **Validate Input:** Use a partial/update version of Zod `ListingSchema`.
    4.  **Conceptual File Updates (R2 - see Section VI):** If new `imageUrls` are provided, update. If document placeholders are updated with new file references, handle.
    5.  **Update Listing Record (D1 Update):** Update specified fields for the `listingId` in `listings`. Update `updated_at`.
    6.  **Return Success Response:** 200 OK with updated listing data from D1.

### C. Deactivate/Reactivate Listing

*   **Triggering UI:** Seller Dashboard -> "My Listings" -> "Deactivate/Reactivate" button.
*   **Conceptual Next.js API Route:** `PUT /api/listings/[listingId]/status`.
*   **Detailed Backend Worker Logic:**
    1.  **Authenticate Seller & Authorize:** (As in "Edit Listing").
    2.  **Receive Request:** PUT request with `listingId` and desired `new_status` (e.g., `{ "new_status": "INACTIVE" }` or `{ "new_status": "ACTIVE_ANONYMOUS" }`).
    3.  **Validate New Status Transition:** Fetch current `status` from D1. Ensure transition is valid based on business rules (e.g., seller can toggle active/inactive, but not bypass admin approval states like `PENDING_VERIFICATION`). If invalid, return 400.
    4.  **Update Listing Status (D1 Update):** Update `status` field for the `listingId` in `listings`. Update `updated_at`.
    5.  **Return Success Response:** 200 OK with updated listing data.

### D. Seller Requests Listing/Profile Verification

*   **Triggering UI:** Seller Dashboard -> "Verification" page or "Request Verification Call for this Listing" button.
*   **Conceptual Next.js API Route:** `POST /api/verification-requests`.
*   **Detailed Backend Worker Logic:**
    1.  **Authenticate Seller:** Get authenticated `user_id`.
    2.  **Receive Request:** POST with `verificationType`: 'PROFILE_SELLER' or 'LISTING', `listingId` (if 'LISTING'), `bestTimeToCall`, `notes`.
    3.  **Validate Input:** Zod schema. If `verificationType` is 'LISTING', ensure `listingId` is valid and owned by seller.
    4.  **Check Current Status & Prevent Redundant Requests (D1 Query):**
        *   If 'PROFILE_SELLER': Check `user_profiles.verification_status`. If already 'PENDING_VERIFICATION' or 'VERIFIED', return 409.
        *   If 'LISTING': Check `listings.status`. If already 'PENDING_VERIFICATION', 'VERIFIED_ANONYMOUS', or 'VERIFIED_PUBLIC', return 409.
    5.  **Update Entity Status (D1 Update):**
        *   If 'PROFILE_SELLER': `UPDATE user_profiles SET verification_status = 'PENDING_VERIFICATION', updated_at = DATETIME('now') WHERE user_id = ?`.
        *   If 'LISTING': `UPDATE listings SET status = 'PENDING_VERIFICATION', updated_at = DATETIME('now') WHERE listing_id = ?`.
    6.  **Create Verification Request Record (D1 Insert):**
        *   Insert into `verification_requests` table: `request_id`, `user_id`, `listing_id` (if applicable), `request_type`, `best_time_to_call`, `notes`, `status = 'NEW_REQUEST'`, timestamps.
    7.  **Conceptual: Notify Admin Team:** Effectively adds to Admin Panel's verification queue.
    8.  **Return Success Response:** 201 Created ("Verification request submitted.").

---

## III. Marketplace & Buyer Actions

### A. Fetch All Listings (for `/marketplace`)

*   **Triggering UI:** `/marketplace` page load, filter changes, sorting, pagination.
*   **Conceptual Next.js API Route:** `GET /api/listings`.
*   **Detailed Backend Worker Logic:**
    1.  **Receive Request:** GET with optional query parameters: `page`, `limit`, `industry`, `country`, `revenueRange`, `maxAskingPrice` (for fixed price filtering), `keywords` (array of strings from checkboxes), `sortBy`, `sortOrder`.
    2.  **Validate Query Parameters.**
    3.  **Determine Requesting Buyer's Status (Conceptual):** Check auth. If authenticated, get `user_id`, query D1 `user_profiles` for `verification_status` and `is_paid`.
    4.  **Construct SQL Query for D1 (`listings` table):**
        *   **Base `SELECT`:** Public anonymous fields: `listing_id`, `listingTitleAnonymous`, `industry`, `locationCountry`, `SUBSTR(anonymousBusinessDescription, 1, 150) AS description_snippet`, `annualRevenueRange`, `askingPrice` (fixed number), `imageUrls` (first URL or primary), `is_seller_verified`, `created_at`.
        *   **Filtering (`WHERE` clauses):**
            *   Always: `listings.status IN ('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC')`.
            *   Apply filters for `industry`, `country`, `revenueRange`.
            *   For `maxAskingPrice`: `AND askingPrice <= ?`.
            *   For `keywords` (array): Build dynamic `OR` conditions for each keyword against `listingTitleAnonymous` and `anonymousBusinessDescription` (e.g., `(listingTitleAnonymous LIKE '%key1%' OR anonymousBusinessDescription LIKE '%key1%') OR (listingTitleAnonymous LIKE '%key2%' OR anonymousBusinessDescription LIKE '%key2%')`). Consider D1's full-text search capabilities if available for better performance.
        *   **Sorting (`ORDER BY`):** Based on `sortBy` and `sortOrder` (e.g., `listings.created_at DESC`, `listings.askingPrice ASC`).
        *   **Pagination:** `LIMIT ? OFFSET ?`.
    5.  **Execute Query & Fetch Total Count:** Main query and a `SELECT COUNT(*)` with same filters.
    6.  **Return Success Response:** 200 OK with `{ listings: [...], currentPage, totalPages, totalListings }`.

### B. Fetch Single Listing Details (`/app/listings/[listingId]`)

*   **Triggering UI:** Navigating to a specific listing detail page.
*   **Conceptual Next.js API Route:** `GET /api/listings/[listingId]`.
*   **Detailed Backend Worker Logic:**
    1.  **Receive Request:** Get `listingId`.
    2.  **Determine Requesting Buyer's Status:** (As in "Fetch All Listings").
    3.  **Fetch Listing and Seller Data (D1 Queries):**
        *   `SELECT * FROM listings WHERE listing_id = ?`. If not found or not publicly visible (e.g., status is INACTIVE or REJECTED_BY_ADMIN), return 404.
        *   If listing found, `SELECT user_id AS seller_user_id, verification_status AS seller_platform_verification_status, is_paid as seller_is_paid FROM user_profiles WHERE user_id = fetched_listing.seller_id`.
    4.  **Construct Response Object (Conditional Data Exposure):**
        *   **Always include:** All public/anonymous fields (`listingTitleAnonymous`, `industry`, `locationCountry`, `locationCityRegionGeneral`, `anonymousBusinessDescription`, `keyStrengthsAnonymous`, `annualRevenueRange`, `netProfitMarginRange`, `askingPrice` (number), `dealStructureLookingFor`, `reasonForSellingAnonymous`, `imageUrls` (first URL or primary for anonymous view), `is_seller_verified`, `created_at`, `specificGrowthOpportunities` (newline separated bullet points for all to see).
        *   **Conditionally Include Verified/Detailed Information:**
            *   Condition: `listing.is_seller_verified === true` AND authenticated buyer has `verification_status === 'VERIFIED'` AND `is_paid === true`.
            *   If met, additionally include: `actualCompanyName`, `registeredBusinessName`, `yearEstablished`, `fullBusinessAddress`, `businessWebsiteUrl`, `socialMediaLinks`, `numberOfEmployees`, `technologyStack`, `specificAnnualRevenueLastYear`, `specificNetProfitLastYear`, `adjustedCashFlow`, `adjustedCashFlowExplanation`, `detailedReasonForSelling`, `sellerRoleAndTimeCommitment`, `postSaleTransitionSupport`, all `imageUrls`, and URLs/keys for uploaded documents (`financialDocumentsUrl`, `keyMetricsReportUrl`, `ownershipDocumentsUrl`, `financialSnapshotUrl`, `ownershipDetailsUrl`, `locationRealEstateInfoUrl`, `webPresenceInfoUrl`, `secureDataRoomLink`).
            *   If not met, these fields are omitted or set to placeholder like "Access Restricted".
    5.  **Return Success Response:** 200 OK with the constructed listing object.

### C. Buyer Inquires About Business

*   **Triggering UI:** "Inquire about business" button.
*   **Conceptual Next.js API Route:** `POST /api/inquiries`.
*   **Detailed Backend Worker Logic:**
    1.  **Authenticate Buyer:** Verify session, get `user_id`. Query D1 `user_profiles` for `verification_status` and `is_paid`. If not 'BUYER', return 403.
    2.  **Receive Request:** POST with `{ "listingId": "string", "message"?: "string" }`.
    3.  **Validate Input:** Zod schema.
    4.  **Fetch Listing & Seller Details (D1 Query):** `SELECT seller_id, status AS listing_status, is_seller_verified, listingTitleAnonymous FROM listings WHERE listing_id = ?`. If not found/visible, return error.
    5.  **Create Inquiry Record (D1 Insert):**
        *   Insert into `inquiries` table: `inquiry_id`, `listing_id`, `buyer_id`, `seller_id`, `message` (optional), `inquiry_timestamp`, `status = 'NEW_INQUIRY'`, snapshots of `buyer_verification_at_inquiry`, `seller_verification_at_inquiry`, `listing_is_seller_verified_at_inquiry`. Timestamps.
    6.  **Trigger Notifications & Engagement Flow (Conceptual - see Section IV for Seller Dashboard handling):** Notify Seller (in-app/email). Admin queue/notification logic is primarily triggered when *seller engages*.
    7.  **Return Success Response:** 201 Created.

### D. Buyer Requests Profile Verification

*   **Triggering UI:** Buyer Dashboard -> "Verification" page -> "Request Verification Call".
*   **Conceptual Next.js API Route:** `POST /api/verification-requests` (Shared endpoint).
*   **Detailed Backend Worker Logic:**
    1.  **Authenticate Buyer:** Get `user_id`.
    2.  **Receive Request:** POST with `verificationType = 'PROFILE_BUYER'`, `bestTimeToCall`, `notes`.
    3.  **Validate Input.**
    4.  **Check Current User Status (D1 Query):** Check `user_profiles.verification_status`. If 'VERIFIED' or 'PENDING_VERIFICATION', return 409.
    5.  **Update User Profile Status (D1 Update):** `UPDATE user_profiles SET verification_status = 'PENDING_VERIFICATION', updated_at = DATETIME('now') WHERE user_id = ?`.
    6.  **Create Verification Request Record (D1 Insert):** Into `verification_requests`: `request_id`, `user_id`, `request_type = 'PROFILE_BUYER'`, `best_time_to_call`, `notes`, `status = 'NEW_REQUEST'`, timestamps.
    7.  **Conceptual: Notify Admin Team.**
    8.  **Return Success Response:** 201 Created.

---

## IV. Dashboard Data Fetching & Actions (Buyer & Seller)

All API endpoints require user authentication. `user_id` from session is key.

### A. Buyer Dashboard

1.  **Overview Page (`/dashboard/page.tsx`)**
    *   **Data Needed:** Buyer's full name, active inquiry count, `verification_status`, list of 2-3 recent inquiries (title, date, buyer-perspective status).
    *   **Conceptual API Route:** `GET /api/dashboard/buyer/overview`
    *   **Backend Logic (D1 Queries):**
        1.  Authenticate buyer, get `user_id`.
        2.  Fetch `user_profiles`: `SELECT full_name, verification_status FROM user_profiles WHERE user_id = ?`.
        3.  Fetch active inquiry count: `SELECT COUNT(*) FROM inquiries WHERE buyer_id = ? AND status NOT IN ('archived', 'connection_facilitated')`.
        4.  Fetch recent inquiries: `SELECT i.id, i.listing_id, i.inquiry_timestamp, i.status AS system_status, l.listingTitleAnonymous FROM inquiries i JOIN listings l ON i.listing_id = l.listing_id WHERE i.buyer_id = ? ORDER BY i.inquiry_timestamp DESC LIMIT 3`.
        5.  Map `system_status` to `statusBuyerPerspective`.
        6.  Return aggregated data.

2.  **My Profile (`/dashboard/profile/page.tsx`)**
    *   **Data Fetching API (GET):** `/api/profile` (Shared, returns based on authenticated user's role).
        *   **Backend Logic (D1 Query for Buyer):** `SELECT full_name, email, phone_number, country, buyer_persona_type, buyer_persona_other, investment_focus_description, preferred_investment_size, key_industries_of_interest FROM user_profiles WHERE user_id = ? AND role = 'BUYER'`.
    *   **Profile Update API (PUT):** `/api/profile`
        *   **Backend Logic:**
            1.  Authenticate buyer, get `user_id`.
            2.  Receive updated profile data (all editable buyer fields including new persona fields).
            3.  Validate against buyer-specific `ProfileSchema`.
            4.  `UPDATE user_profiles SET ... WHERE user_id = ?`.
            5.  Return 200 OK with updated profile.

3.  **My Inquiries (`/dashboard/inquiries/page.tsx`)**
    *   **Data Needed:** List of buyer's inquiries (listing title, seller's verification status, inquiry date, buyer-perspective status).
    *   **Conceptual API (GET):** `/api/inquiries?role=buyer` (or derive role from session).
    *   **Backend Logic (D1 Query):** `SELECT i.id, i.listing_id, i.inquiry_timestamp, i.status AS system_status, l.listingTitleAnonymous, l.is_seller_verified AS listing_seller_is_verified, seller_profile.verification_status AS seller_platform_verification_status FROM inquiries i JOIN listings l ON i.listing_id = l.listing_id JOIN user_profiles seller_profile ON l.seller_id = seller_profile.user_id WHERE i.buyer_id = ? ORDER BY i.inquiry_timestamp DESC`.
    *   Map to `statusBuyerPerspective`. Return list.
    *   **Action: "Proceed to Verification" Button:** UI navigation to `/dashboard/verification`. Backend interaction handled by verification request API.

4.  **Verification (`/dashboard/verification/page.tsx`)**
    *   **Data Needed:** Buyer's `verification_status` (via profile API).
    *   **Action: Request Verification Call (POST):** Uses shared `/api/verification-requests` (see Section III.D).

5.  **Notifications (`/dashboard/notifications/page.tsx`)**
    *   **Data Fetching API (GET):** `/api/notifications` (filters by `user_id`).
        *   **Backend Logic (D1 Query):** `SELECT notification_id, message, timestamp, link, is_read, type FROM notifications WHERE user_id = ? ORDER BY timestamp DESC`.
    *   **Mark Notification as Read API (PUT):** `/api/notifications/[notificationId]/read`
        *   **Backend Logic:** Authenticate. `UPDATE notifications SET is_read = true WHERE notification_id = ? AND user_id = ?`. Return 200 OK.

6.  **Settings (`/dashboard/settings/page.tsx`)**
    *   **Password Change API (PUT):** `/api/auth/change-password` (shared endpoint, UI trigger moved here).
        *   **Backend Logic:**
            1.  Authenticate user, get `user_id`.
            2.  Receive `currentPassword`, `newPassword`. Validate.
            3.  Fetch `hashed_password`, `password_salt` from `user_profiles` (D1).
            4.  Verify `currentPassword`.
            5.  If valid, hash `newPassword` with new salt, `UPDATE user_profiles SET hashed_password = ?, password_salt = ? WHERE user_id = ?`.
            6.  Return 200 OK or error.
    *   **Notification Preferences (Conceptual API):** `PUT /api/profile/notification-preferences`
        *   **Backend Logic:** Authenticate user. Receive preference flags (e.g., `email_new_inquiry: boolean`, `email_listing_updates: boolean`). Update corresponding fields in `user_profiles` table. Return success.

### B. Seller Dashboard

1.  **Overview Page (`/seller-dashboard/page.tsx`)**
    *   **Data Needed:** Seller's name, active listing count, total inquiries, inquiries awaiting engagement, `verification_status`, list of recent active listings with inquiry counts.
    *   **Conceptual API:** `GET /api/seller-dashboard/overview`
    *   **Backend Logic (D1 Queries):**
        1.  Authenticate seller, get `user_id`.
        2.  Fetch `user_profiles`: `SELECT full_name, verification_status FROM user_profiles WHERE user_id = ?`.
        3.  Active listing count: `SELECT COUNT(*) FROM listings WHERE seller_id = ? AND status IN ('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC')`.
        4.  Total inquiries: `SELECT COUNT(*) FROM inquiries WHERE seller_id = ?`.
        5.  Inquiries awaiting engagement: `SELECT COUNT(*) FROM inquiries WHERE seller_id = ? AND status = 'NEW_INQUIRY'`.
        6.  Recent active listings: `SELECT l.listing_id, l.listingTitleAnonymous, l.status, l.is_seller_verified, (SELECT COUNT(*) FROM inquiries WHERE listing_id = l.listing_id) as inquiry_count FROM listings l WHERE l.seller_id = ? AND l.status IN ('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC') ORDER BY l.created_at DESC LIMIT 3`.
        7.  Return aggregated data.

2.  **My Profile (`/seller-dashboard/profile/page.tsx`)**
    *   **Data Fetching API (GET):** `/api/profile` (Shared).
        *   **Backend Logic (D1 Query for Seller):** `SELECT full_name, email, phone_number, country, initial_company_name FROM user_profiles WHERE user_id = ? AND role = 'SELLER'`.
    *   **Profile Update API (PUT):** `/api/profile`
        *   **Backend Logic:** Authenticate seller. Receive data. Validate against seller `ProfileSchema`. `UPDATE user_profiles SET ... WHERE user_id = ?`. Return 200 OK.

3.  **My Listings (`/seller-dashboard/listings/page.tsx`)**
    *   **Data Fetching API (GET):** `/api/listings?seller_view=true` (or derive from session).
        *   **Backend Logic (D1 Query):** `SELECT l.*, (SELECT COUNT(*) FROM inquiries WHERE listing_id = l.listing_id) as inquiry_count FROM listings l WHERE l.seller_id = ? ORDER BY l.created_at DESC`. Fetches all listing fields for seller.
    *   **Actions:**
        *   Deactivate/Reactivate: Uses `/api/listings/[listingId]/status` (Section II.C).
        *   Request Listing Verification: Uses `/api/verification-requests` (Section II.D, with `type: 'LISTING'`).

4.  **Edit Listing (`/seller-dashboard/listings/[listingId]/edit/page.tsx`)**
    *   **Data Fetching API (GET):** `/api/listings/[listingId]?view=seller_edit`.
        *   **Backend Logic:** Authenticate seller. `SELECT * FROM listings WHERE listing_id = ? AND seller_id = ?`. If not found/owned, 404/403. Return all fields.
    *   **Update Listing API (PUT):** Uses `/api/listings/[listingId]` (Section II.B).

5.  **My Inquiries (Seller Perspective) (`/seller-dashboard/inquiries/page.tsx`)**
    *   **Data Fetching API (GET):** `/api/inquiries?role=seller`.
    *   **Backend Logic (D1 Query):** `SELECT i.id, i.listing_id, i.inquiry_timestamp, i.status AS system_status, i.message, l.listingTitleAnonymous, buyer_profile.full_name AS buyer_name, buyer_profile.verification_status AS buyer_verification_status FROM inquiries i JOIN listings l ON i.listing_id = l.listing_id JOIN user_profiles buyer_profile ON i.buyer_id = buyer_profile.user_id WHERE i.seller_id = ? ORDER BY i.inquiry_timestamp DESC`.
    *   Map to `statusSellerPerspective`. Return list.
    *   **Action: Seller Engages with Inquiry (POST):** `/api/inquiries/[inquiryId]/engage`
        *   **Detailed Backend Worker Logic:**
            1.  Authenticate Seller, get `user_id`. Receive `inquiryId`.
            2.  Fetch inquiry from D1. Verify ownership (`inquiry.seller_id === user_id`).
            3.  If `inquiry.status` not 'NEW_INQUIRY', return error.
            4.  Fetch buyer's profile (D1): `SELECT verification_status AS buyer_verification_status, is_paid AS buyer_is_paid FROM user_profiles WHERE user_id = inquiry.buyer_id`.
            5.  Fetch seller's listing (D1): `SELECT is_seller_verified, status as listing_status FROM listings WHERE listing_id = inquiry.listing_id`. (Need listing_status for seller verification path).
            6.  Fetch seller's profile (D1): `SELECT verification_status AS seller_verification_status FROM user_profiles WHERE user_id = inquiry.seller_id`.
            7.  **Implement Engagement Flow Logic (from MVP document):**
                *   Determine `next_inquiry_status`.
                *   If buyer `verification_status` is 'ANONYMOUS' or 'PENDING_VERIFICATION': `next_inquiry_status = 'SELLER_ENGAGED_BUYER_PENDING_VERIFICATION'`. Notify Buyer to verify. Add to Admin Verification Queue (conceptual - or Buyer triggers it themselves).
                *   Else if seller's profile `verification_status` is NOT 'VERIFIED' OR listing `is_seller_verified` is false (and listing `status` isn't already `VERIFIED_ANONYMOUS` or `VERIFIED_PUBLIC`): `next_inquiry_status = 'SELLER_ENGAGED_SELLER_PENDING_VERIFICATION'`. Notify Seller to verify profile/listing. Add to Admin Verification Queue (conceptual - or Seller triggers it themselves).
                *   Else (Both Buyer and Seller/Listing are effectively verified for this interaction): `next_inquiry_status = 'READY_FOR_ADMIN_CONNECTION'`. Notify Admin. Notify Buyer & Seller.
            8.  Update `inquiries` table (D1): `SET status = ?, engagement_timestamp = DATETIME('now') WHERE inquiry_id = ?`.
            9.  Trigger appropriate notifications.
            10. Return 200 OK.

6.  **Verification (`/seller-dashboard/verification/page.tsx`)**
    *   **Data Fetching API (GET):** `/api/seller-dashboard/verification-data`.
        *   **Backend Logic (D1 Queries):** Auth seller. Fetch `user_profiles.verification_status`. Fetch `listings WHERE seller_id = ? AND (status IN ('ACTIVE_ANONYMOUS', 'PENDING_VERIFICATION') OR is_seller_verified = false)`. Return data.
    *   **Action: Request Verification (POST):** Uses `/api/verification-requests` (Section II.D, with `type: 'PROFILE_SELLER'` or `type: 'LISTING'`).

7.  **Notifications (`/seller-dashboard/notifications/page.tsx`)**
    *   **Data Fetching API (GET):** `/api/notifications` (Shared).
    *   **Mark Notification as Read API (PUT):** `/api/notifications/[notificationId]/read` (Shared).

8.  **Settings (`/seller-dashboard/settings/page.tsx`)**
    *   **Password Change API (PUT):** `/api/auth/change-password` (shared endpoint).
        *   (Same logic as Buyer's password change in Section IV.A.6).
    *   **Notification Preferences (Conceptual API):** `PUT /api/profile/notification-preferences`
        *   (Same logic as Buyer's notification preferences in Section IV.A.6).

---

## V. Admin Panel Backend Logic

All Admin APIs require ADMIN role authentication (e.g., check role in `user_profiles` or custom claim). Audit logging for significant actions is crucial.

### General for all Admin APIs:
*   **Authentication/Authorization:** Verify authenticated admin.
*   **Conceptual Audit Logging (D1 Insert):** For write operations, log to `audit_logs` table: `log_id, admin_user_id, action_type, target_entity_type, target_entity_id, timestamp, details_before (JSON), details_after (JSON)`.

### A. User Management

1.  **List Users (`GET /api/admin/users`)**
    *   **Backend Logic (D1 Query):** `SELECT user_id, full_name, email, role, verification_status, is_paid, created_at, last_login, (SELECT COUNT(*) FROM listings WHERE seller_id = up.user_id) AS listing_count, (SELECT COUNT(*) FROM inquiries WHERE buyer_id = up.user_id) AS inquiry_count FROM user_profiles up`. Apply filters (role, verification, paid, search) and pagination. Return list.

2.  **View User Details (`GET /api/admin/users/[userId]`)**
    *   **Backend Logic (D1 Query):** `SELECT * FROM user_profiles WHERE user_id = ?`. Returns all profile fields including buyer persona details.

3.  **Update User Verification/Paid Status (`PUT /api/admin/users/[userId]/status`)**
    *   **Request Body:** `{ new_verification_status?: VerificationStatus, new_is_paid?: boolean }`
    *   **Backend Logic:** Receive `userId`, `new_verification_status`, `new_is_paid`. Validate. `UPDATE user_profiles SET verification_status = COALESCE(?, verification_status), is_paid = COALESCE(?, is_paid), updated_at = DATETIME('now') WHERE user_id = ?`. Log action. Notify user. Return updated profile.

4.  **Admin Edit User Profile Details (`PUT /api/admin/users/[userId]/profile`)**
    *   **Request Body:** Partial `UserProfileSchema`.
    *   **Backend Logic:** Receive `userId` and fields. Validate. `UPDATE user_profiles SET ... WHERE user_id = ?`. Log. Return updated profile.

5.  **Admin Send Password Reset OTP (`POST /api/admin/users/[userId]/send-reset-otp`)**
    *   **Backend Logic:** Receive `userId`. Fetch user's email from D1. Call shared OTP logic (type 'PASSWORD_RESET'). Log. Return 200 OK.

6.  **Delete User (`DELETE /api/admin/users/[userId]`)**
    *   **Request Body:** `{ confirmation_phrase: string }` (e.g., "DELETE USER PERMANENTLY")
    *   **Backend Logic:**
        1.  Receive `userId` and `confirmation_phrase`. Validate confirmation.
        2.  (Soft Delete Recommended) Update `user_profiles`: `SET is_deleted = true, deleted_at = DATETIME('now'), email = original_email || '_deleted_' || uuid() WHERE user_id = ?`.
        3.  (Consider implications): Deactivate/anonymize associated listings. Mark associated inquiries as archived/system_closed.
        4.  Log action. Return 200 OK/204.

### B. Listing Management

1.  **List All Listings (`GET /api/admin/listings`)**
    *   **Backend Logic (D1 Query):** `SELECT l.*, u.full_name as seller_name, u.is_paid as seller_is_paid, u.verification_status as seller_verification_status FROM listings l JOIN user_profiles u ON l.seller_id = u.user_id`. Apply filters (status, seller verification, industry, search) and pagination. Return list.

2.  **View Full Listing Details (Admin) (`GET /api/admin/listings/[listingId]`)**
    *   **Backend Logic (D1 Query):** `SELECT * FROM listings WHERE listing_id = ?`. Join with `user_profiles` for seller details. Return ALL fields including document placeholders.

3.  **Update Listing Status (Admin) (`PUT /api/admin/listings/[listingId]/status`)**
    *   **Request Body:** `{ new_status: ListingStatus, admin_notes?: string }`.
    *   **Backend Logic:** Receive `listingId`, `new_status`, `admin_notes`. Validate. Fetch listing.
        *   D1 Transaction: `UPDATE listings SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = DATETIME('now') WHERE listing_id = ?`.
        *   Conditional: If `new_status` is 'VERIFIED_PUBLIC' or 'VERIFIED_ANONYMOUS', also `SET is_seller_verified = true`. If approving from `PENDING_VERIFICATION`, potentially update associated `verification_requests` status.
        *   Log action. Notify seller. Commit. Return 200 OK.

4.  **Admin Edit Listing Details (`PUT /api/admin/listings/[listingId]/details`)**
    *   **Request Body:** Partial `ListingSchema` (subset of fields admin can edit, e.g., correct typos).
    *   **Backend Logic:** Receive `listingId`, fields to update. Authenticate admin. Validate. Update `listings` table in D1. Log. Return updated listing.

### C. Verification Queues

1.  **Fetch Buyer Verification Queue (`GET /api/admin/verification-requests?type=PROFILE_BUYER`)**
    *   **Backend Logic (D1 Query):** `SELECT vr.*, u.full_name AS user_name, u.email AS user_email, u.buyer_persona_type FROM verification_requests vr JOIN user_profiles u ON vr.user_id = u.user_id WHERE vr.request_type = 'PROFILE_BUYER' AND vr.status NOT IN ('Approved', 'Rejected') ORDER BY vr.created_at ASC`. Paginate. Return list.

2.  **Fetch Seller/Listing Verification Queue (`GET /api/admin/verification-requests?type=PROFILE_SELLER` or `type=LISTING`)**
    *   **Backend Logic (D1 Query):** Similar to buyer queue, joining `listings` if `type=LISTING`. Paginate. Return list.

3.  **Update Verification Request Status (`PUT /api/admin/verification-requests/[requestId]/status`)**
    *   **Request Body:** `{ new_queue_status: VerificationQueueStatus, admin_notes?: string }`.
    *   **Backend Logic:** Receive `requestId`, `new_queue_status`, `admin_notes`. Validate. Fetch request.
        *   D1 Transaction: Update `verification_requests.status = new_queue_status`, `verification_requests.admin_notes = admin_notes`.
        *   If `new_queue_status` is 'Approved':
            *   Fetch associated `user_id` and `listing_id` (if any) from the `verification_requests` record.
            *   If request was for 'PROFILE_BUYER' or 'PROFILE_SELLER', update `user_profiles.verification_status = 'VERIFIED'`.
            *   If request was for 'LISTING', update `listings.status = 'VERIFIED_ANONYMOUS'` (or 'VERIFIED_PUBLIC' based on admin choice/listing content) and `listings.is_seller_verified = true`. Also, ensure associated seller's `user_profiles.verification_status` is 'VERIFIED'.
        *   If `new_queue_status` is 'Rejected': Update `user_profiles.verification_status = 'REJECTED'` or `listings.status = 'REJECTED_BY_ADMIN'`.
        *   Log. Notify user. Commit. Return 200 OK.

### D. Engagement Queue

1.  **Fetch Engagements Ready for Connection (`GET /api/admin/engagements` or `/api/admin/inquiries?status=READY_FOR_ADMIN_CONNECTION`)**
    *   **Backend Logic (D1 Query):** `SELECT i.id AS inquiry_id, i.listing_id, i.buyer_id, i.seller_id, i.engagement_timestamp, buyer.full_name AS buyer_name, buyer.email AS buyer_email, buyer.phone_number AS buyer_phone, seller.full_name AS seller_name, seller.email AS seller_email, seller.phone_number AS seller_phone, l.listingTitleAnonymous FROM inquiries i JOIN user_profiles buyer ON i.buyer_id = buyer.user_id JOIN user_profiles seller ON i.seller_id = seller.user_id JOIN listings l ON i.listing_id = l.listing_id WHERE i.status = 'READY_FOR_ADMIN_CONNECTION' ORDER BY i.engagement_timestamp ASC`. Paginate. Return list.

2.  **Update Engagement Status (`PUT /api/admin/engagements/[inquiryId]/status`)**
    *   **Request Body:** `{ new_status: 'CONNECTION_FACILITATED', admin_notes?: string }`.
    *   **Backend Logic:** Receive `inquiryId`, `new_status`. Validate. `UPDATE inquiries SET status = 'CONNECTION_FACILITATED', admin_notes = COALESCE(?, admin_notes) WHERE inquiry_id = ?`. Log. Notify parties. Return 200 OK.

### E. Analytics Data Aggregation (Conceptual for D1 Queries)

*   **User Metrics:**
    *   Total Users (Sellers vs Buyers): `SELECT role, COUNT(*) FROM user_profiles GROUP BY role`.
    *   Paid/Free Breakdown: `SELECT role, is_paid, COUNT(*) FROM user_profiles GROUP BY role, is_paid`.
    *   Verification Status Breakdown: `SELECT role, verification_status, COUNT(*) FROM user_profiles GROUP BY role, verification_status`.
    *   New User Registrations (24h/7d): `SELECT COUNT(*) FROM user_profiles WHERE created_at >= DATETIME('now', '-X days')`. Split by role if needed.
*   **Listing Metrics:**
    *   Total Listings (All Statuses): `SELECT COUNT(*) FROM listings`.
    *   Active Listings (Verified vs Anonymous): `SELECT status, COUNT(*) FROM listings WHERE status IN ('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC') GROUP BY status`.
    *   Closed/Deactivated Listings: `SELECT COUNT(*) FROM listings WHERE status IN ('INACTIVE', 'CLOSED_DEAL')`.
    *   New Listings Created (24h/7d): `SELECT COUNT(*) FROM listings WHERE created_at >= DATETIME('now', '-X days')`.
    *   Listings by Industry: `SELECT industry, COUNT(*) FROM listings WHERE status IN ('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC') GROUP BY industry`.
    *   Listings by Asking Price (Ranges): Requires bucketing `listings.askingPrice` (numeric) using CASE statements (if D1 supports this well, or multiple queries).
*   **Engagement/Deal Flow Metrics:**
    *   Total Inquiries by Status: `SELECT status, COUNT(*) FROM inquiries GROUP BY status`.
    *   Successful Connections Facilitated MTD: `SELECT COUNT(*) FROM inquiries WHERE status = 'CONNECTION_FACILITATED' AND engagement_timestamp >= [start_of_month]`.
    *   Active Successful Connections: `SELECT COUNT(*) FROM inquiries WHERE status = 'CONNECTION_FACILITATED' AND (deal_closed_timestamp IS NULL OR deal_status != 'CLOSED')` (assuming future deal tracking fields).
    *   Closed Successful Connections/Deals Closed MTD: `SELECT COUNT(*) FROM inquiries WHERE status = 'CONNECTION_FACILITATED' AND deal_closed_timestamp >= [start_of_month] AND deal_status = 'CLOSED'` (assuming future deal tracking fields).
*   **Revenue Metrics (Conceptual - assuming a `subscriptions` table):**
    *   Total Revenue MTD: `SELECT SUM(amount) FROM subscriptions WHERE status = 'ACTIVE' AND transaction_date >= [start_of_month]`.
    *   Revenue from Buyers/Sellers: Filter `subscriptions` by joining with `user_profiles.role`.

---

## VI. File Upload Handling (Conceptual for R2)

This outlines the intended multi-step process for handling file uploads (e.g., listing images, verification documents) from the frontend to Cloudflare R2, and linking them to Cloudflare D1 records.

1.  **Step 1: Frontend Requests Pre-signed URL for Upload**
    *   **Triggering UI:** User selects a file in an `<Input type="file">` (e.g., Create/Edit Listing form, Profile Verification form).
    *   **Frontend Action:** Makes API request to (e.g., `POST /api/upload/generate-signed-url`).
    *   **Request Body:** `{ filename: string, contentType: string, context: 'listing_image' | 'verification_document_buyer' | 'verification_document_seller_profile' | 'verification_document_listing', entityId?: string (e.g., listingId, userId), documentType?: string (e.g., 'financial_statement', 'id_proof') }`.
2.  **Step 2: Backend Worker Generates Pre-signed R2 URL**
    *   **Conceptual Next.js API Route:** `POST /api/upload/generate-signed-url`.
    *   **Cloudflare Worker Logic:**
        1.  **Authenticate User & Authorize:** Based on `context` and `entityId` (e.g., ensure seller owns listing if `context='listing_image'`).
        2.  **Validate Request Body.**
        3.  **Construct R2 Object Key:** Generate unique, secure key (e.g., `listings/${listingId}/images/${uuidv4()}-${sanitized_filename}` or `verification_docs/${userId}/${documentType}/${uuidv4()}-${sanitized_filename}`).
        4.  **Use Cloudflare R2 SDK/API:** Call R2 method to generate a pre-signed URL for a `PUT` operation (specify bucket, key, expiry, contentType).
        5.  **Return Success Response:** 200 OK with `{ signedUrl: string, objectKey: string }`.
3.  **Step 3: Frontend Uploads File Directly to R2**
    *   **Frontend Action:** Uses `fetch` API (`PUT`) to `signedUrl` with the file as body. `Content-Type` header must match.
4.  **Step 4: Frontend Notifies Backend of Successful Upload & Links File to Entity**
    *   **Triggering UI:** After successful R2 upload.
    *   **Frontend Action:** Makes API request (e.g., `POST /api/upload/confirm-and-link`).
    *   **Request Body:** `{ objectKey: string (R2 objectKey), originalFilename: string, context: 'listing_image' | ..., entityId: string (listingId or userId), documentType?: string, imageUrlIndex?: number (if for listing images array) }`.
    *   **(Alternative for listing images from text inputs):** If image URLs are just text inputs in the form, the main "Create/Edit Listing" API (Section II.A/B) handles saving these string URLs. The pre-signed URL flow would be for direct file uploads for *documents*.
5.  **Step 5: Backend Worker Updates D1 Database with File Reference**
    *   **Conceptual Next.js API Route:** e.g., `POST /api/upload/confirm-and-link`.
    *   **Cloudflare Worker Logic:**
        1.  **Authenticate User & Authorize.**
        2.  **Validate Request Body.**
        3.  **Update D1 Database:**
            *   **For listings (if `context='listing_document'`):** Update specific document URL field in `listings` table (e.g., `financial_documents_url = objectKey`).
            *   **For profile verification (if `context='verification_document_...'`):** Update `user_profiles` (e.g., `id_proof_document_key = objectKey`) or insert into a separate `user_verification_documents` table linked to `user_id` and `verification_request_id`.
            *   **Note on `imageUrls` for Listings:** If using direct file uploads for listing images, the array of `objectKey`s would be stored in `listings.imageUrls`. If sellers provide external URLs via text inputs, those strings are stored directly.
        4.  **Return Success Response:** 200 OK.

---

This document provides a comprehensive plan for the backend implementation.

    