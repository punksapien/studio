
# Nobridge - Backend Implementation Plan

## Introduction

This document outlines the intended backend logic and processing steps for the Nobridge platform. It assumes a serverless architecture, conceptually leveraging:

*   **Cloudflare Workers:** For API endpoint logic, business logic, and request handling.
*   **Cloudflare D1:** As the primary SQL database for storing user profiles, listings, inquiries, etc.
*   **Cloudflare R2:** For object storage (e.g., user-uploaded documents, listing images).

The Next.js API routes defined in `src/app/api/` will serve as the primary interface between the frontend application and these backend Cloudflare Worker functions. This plan details the expected behavior and data flow for each significant user action and system process.

---

## I. Authentication Flow (User Registration, Login, Logout, Password Management - OTP Based)

This section details the core authentication mechanisms, focusing on an OTP (One-Time Password) system for both registration and login as a primary verification method for email and a conceptual second factor for login.

### A. User Registration (Seller)

*   **Triggering UI:** Seller Registration Form submission (`src/app/auth/register/seller/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/auth/register/seller/initiate` (POST) - Handles initial data submission and triggers OTP.
*   **Detailed Backend Worker Logic (Step-by-Step for `/api/auth/register/seller/initiate`):**
    1.  **Receive Request:** Worker receives a POST request containing seller data:
        *   `fullName`, `email`, `password` (plain text from form), `phoneNumber`, `country`, `initialCompanyName` (optional).
    2.  **Validate Input:**
        *   Use the Zod schema (`SellerRegisterSchema` from the frontend or a shared schema definition) to validate the received data.
        *   If validation fails, return a 400 Bad Request error with validation details.
    3.  **Check Email Uniqueness:**
        *   Query the `user_profiles` table in Cloudflare D1: `SELECT user_id FROM user_profiles WHERE email = ?`.
        *   If a record is found (regardless of `email_verified_at` status), return a 409 Conflict error (e.g., "Email address already in use or pending verification.").
    4.  **Password Hashing:**
        *   Generate a salt.
        *   Hash the received plain-text `password` using a strong hashing algorithm (e.g., Argon2id, scrypt, or bcrypt if platform constraints allow; Cloudflare Workers support Web Crypto API for hashing like SHA-256, but a dedicated password hashing library/method is preferred).
    5.  **Store Provisional User Record in D1:**
        *   Insert a new record in `user_profiles` table with:
            *   `user_id`: Generate a new unique ID (e.g., UUID).
            *   `full_name`, `email` (consistent case, e.g., lowercase).
            *   `hashed_password`, `password_salt`.
            *   `phone_number`, `country`.
            *   `role`: Set to `'SELLER'`.
            *   `verification_status`: Set to `'ANONYMOUS'`.
            *   `is_paid`: Set to `false`.
            *   `initial_company_name`.
            *   `email_verified_at`: `NULL` (until OTP verification).
            *   Timestamps: `created_at`, `updated_at`.
    6.  **Generate and Send OTP (for Email Verification):**
        *   Call a shared OTP generation/sending function (see "I.G. OTP Logic").
        *   This function will generate an OTP, hash it, store it in an `otp_verifications` table in D1 (linked to `email` or `user_id`, with `type='REGISTRATION'`, and expiry), and send the OTP to the user's email.
    7.  **Return Success Response:**
        *   Return a 200 OK status with a success message (e.g., "Registration initiated. Please check your email for an OTP.") and the `email` (to be passed to the OTP verification page).

### B. User Registration (Buyer)

*   **Triggering UI:** Buyer Registration Form submission (`src/app/auth/register/buyer/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/auth/register/buyer/initiate` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step for `/api/auth/register/buyer/initiate`):**
    1.  **Receive Request:** Worker receives a POST request containing buyer data: `fullName`, `email`, `password`, `phoneNumber`, `country`, `buyerPersonaType`, `buyerPersonaOther` (if applicable), `investmentFocusDescription`, `preferredInvestmentSize`, `keyIndustriesOfInterest`.
    2.  **Validate Input:** Use Zod schema (`BuyerRegisterSchema`).
    3.  **Check Email Uniqueness:** (As per Seller registration).
    4.  **Password Hashing:** (As per Seller registration).
    5.  **Store Provisional User Record in D1:**
        *   Insert into `user_profiles` with buyer-specific fields (`buyer_persona_type`, `buyer_persona_other`, etc.), `role` 'BUYER', `email_verified_at` `NULL`.
    6.  **Generate and Send OTP (for Email Verification):** (As per Seller registration, type 'REGISTRATION').
    7.  **Return Success Response:** With `email`.

### C. User Login - Step 1: Credential Validation & OTP Trigger

*   **Triggering UI:** Login Form submission (`src/app/auth/login/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/auth/login/initiate` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives POST request with `email` and `password`.
    2.  **Validate Input:** Use Zod schema (`LoginSchema`).
    3.  **Fetch User from D1:**
        *   Query `user_profiles` table: `SELECT user_id, hashed_password, password_salt, role, verification_status, is_paid, full_name, email_verified_at FROM user_profiles WHERE email = ?`.
        *   If no user found, return 401 Unauthorized error (e.g., "Invalid credentials.").
    4.  **Verify Password:**
        *   Re-hash the provided plain-text `password` using the fetched `password_salt`.
        *   Compare with stored `hashed_password`. If no match, return 401.
    5.  **Check Email Verification Status:**
        *   If `email_verified_at` is `NULL`, the user hasn't completed their initial registration OTP. They cannot log in yet. Return an error like "Email not verified. Please check your email for the registration OTP or request a new one."
        *   (Optional: If resending registration OTP is an option, it could be triggered here instead of an error).
    6.  **Generate and Send OTP (for Login 2FA):**
        *   Call shared OTP generation/sending function (see "I.G. OTP Logic").
        *   Type should be 'LOGIN'.
    7.  **Return Success Response:**
        *   Return 200 OK with a message like "Credentials verified. Please check your email for an OTP to complete login." and the `email` (to be passed to the OTP verification page).

### D. User Logout

*   **Triggering UI:** Logout button (e.g., in user dashboards).
*   **Next.js API Route Stub (Conceptual):** `/api/auth/logout` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Should be an authenticated request (valid session cookie/token).
    2.  **Clear Session Cookie:** Instruct client to clear the session cookie (e.g., `Set-Cookie: sessionToken=; HttpOnly; Secure; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`).
    3.  **Invalidate Session (if applicable on backend):** If using server-side session storage (e.g., Cloudflare KV or D1 linked to a session ID), delete or mark the session as invalid.
    4.  **Return Success Response:** Return 200 OK.

### E. Forgot Password - Step 1: Request Reset OTP

*   **Triggering UI:** Forgot Password Form submission (`src/app/auth/forgot-password/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/auth/forgot-password/initiate` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives POST request with `email`.
    2.  **Validate Input:** Use Zod schema.
    3.  **Fetch User from D1:** Query `user_profiles`: `SELECT user_id, email_verified_at FROM user_profiles WHERE email = ?`.
    4.  **Process Request:**
        *   If user exists AND their `email_verified_at` is NOT NULL:
            *   Generate and Send OTP (type 'PASSWORD_RESET', see "I.G. OTP Logic").
    5.  **Return Generic Success Response:** Always return 200 OK with "If an account with that email exists and is verified, an OTP for password reset has been sent." (Prevents email enumeration).

### F. Reset Password - Step 2: Verify OTP and Update Password

*   **Triggering UI:** New Reset Password Form (conceptually, `/auth/reset-password-confirm?token=...`, after user clicks link in email). This page would submit to the endpoint below.
*   **Next.js API Route Stub (Conceptual):** `/api/auth/reset-password/complete` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives POST with `token`, `newPassword`, `confirmNewPassword`.
    2.  **Validate Input:** Zod schema for token format and new password rules (strength, match).
    3.  **Verify Reset Token & Fetch User from D1:**
        *   Query `otp_verifications` table: `SELECT user_id, expires_at, used_at FROM otp_verifications WHERE hashed_otp = HASH(?) AND type = 'PASSWORD_RESET'`. (Note: The token in the URL *is* the OTP itself for this flow, or a unique token that maps to an OTP record. For simplicity here, assume it's a unique token mapping to an OTP record where `hashed_otp` is actually `hashed_token`).
        *   If no token found, or `expires_at` is in the past, or `used_at` IS NOT NULL, return 400 error ("Invalid or expired password reset token.").
        *   Fetch the `user_id` associated with the token.
    4.  **Mark Token as Used:** `UPDATE otp_verifications SET used_at = DATETIME('now') WHERE otp_id = ?` (or based on token value).
    5.  **Update Password:**
        *   Generate new salt, hash `newPassword`.
        *   Update `hashed_password` and `password_salt` in `user_profiles` for the fetched `user_id`.
    6.  **Return Success Response:** Return 200 OK: "Password has been reset successfully. You can now login."
    7.  **Error Handling:** Appropriate errors for invalid token, etc.

### G. OTP Logic (Shared Functionality - Conceptual Module/Worker)

This outlines common logic used by various OTP-dependent flows.

*   **1. Generate OTP:**
    *   Create a cryptographically secure random numeric string (e.g., 6 digits).
*   **2. Hash OTP:**
    *   Generate a salt for the OTP.
    *   Hash the plain OTP using a strong algorithm (e.g., SHA-256 if not Argon2/bcrypt) before storing.
*   **3. Store OTP in D1:**
    *   Table: `otp_verifications`
        *   `otp_id` (PK, UUID)
        *   `email` (TEXT, Indexed) - Used to look up OTPs for a user.
        *   `user_id` (TEXT, FK to `user_profiles.user_id`, Nullable) - Link to user if known.
        *   `hashed_otp` (TEXT)
        *   `otp_salt` (TEXT)
        *   `type` (TEXT - e.g., 'REGISTRATION', 'LOGIN', 'PASSWORD_RESET')
        *   `expires_at` (DATETIME) - e.g., 5-10 minutes from creation.
        *   `created_at` (DATETIME)
        *   `used_at` (DATETIME, Nullable) - Timestamp when OTP was successfully used.
    *   Store the hashed OTP, its salt, type, associated email/user_id, and expiry.
*   **4. Send OTP via Email:**
    *   Integrate an email sending service (e.g., Mailgun, SendGrid, Cloudflare Email Workers).
    *   Compose an email template with the plain OTP and clear instructions based on the OTP `type`.

### H. OTP Verification (Generic Endpoint for Registration & Login OTPs)

*   **Triggering UI:** OTP Entry Form submission (`src/app/(auth)/verify-otp/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/auth/verify-otp` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives POST with `email`, `otp` (plain text OTP from form), `type` (e.g., 'register', 'login' - passed from the client to indicate context).
    2.  **Validate Input:** Zod schema for email and OTP format (e.g., 6 digits).
    3.  **Fetch Stored OTP from D1:**
        *   `SELECT otp_id, user_id, hashed_otp, otp_salt, expires_at, used_at FROM otp_verifications WHERE email = ? AND type = ? AND used_at IS NULL AND expires_at > DATETIME('now') ORDER BY created_at DESC LIMIT 1`.
        *   If no valid OTP record found, return 400 error ("Invalid or expired OTP. Please try again or request a new one.").
    4.  **Verify OTP:**
        *   Re-hash the received plain-text `otp` using the fetched `otp_salt`.
        *   Compare with the stored `hashed_otp`. If no match, increment a try counter (optional, for rate limiting) and return 400 error ("Invalid OTP.").
    5.  **Mark OTP as Used:** `UPDATE otp_verifications SET used_at = DATETIME('now') WHERE otp_id = ?`.
    6.  **Perform Action Based on Type:**
        *   **If `type` is 'register':**
            *   Fetch the user record from `user_profiles` by `email` (or `user_id` from OTP record).
            *   Update `user_profiles` table: `SET email_verified_at = DATETIME('now') WHERE email = ?` (or `user_id = ?`).
            *   Return 200 OK: "Email verified successfully. Please login."
        *   **If `type` is 'login':**
            *   Fetch user details from `user_profiles` by `email` (or `user_id` from OTP record).
            *   Generate session token/JWT (e.g., using Cloudflare Worker secrets for signing).
            *   Set an HTTP-only, secure session cookie with appropriate expiry.
            *   (Optional) If using stateful sessions, store session data in D1 or KV linked to a session ID.
            *   Update `last_login` timestamp in `user_profiles`.
            *   Return 200 OK with user data (role, name, etc., to help frontend redirect and personalize).
    7.  **Error Handling:** Return appropriate error messages for invalid OTP, expired OTP, too many attempts (if implemented), etc.

### I. Resend OTP (Conceptual)

*   **Triggering UI:** "Resend OTP" button on `/auth/verify-otp/page.tsx`.
*   **Next.js API Route Stub (Conceptual):** `/api/auth/resend-otp` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives POST with `email` and `type` ('register', 'login').
    2.  **Validate Input.**
    3.  **(Rate Limiting Check):** Query `otp_verifications` to check how many OTPs were sent for this email and type recently. If too many, return a rate limit error (e.g., "Too many OTP requests. Please try again later.").
    4.  **Fetch User from D1 (optional, for context):**
        *   If `type` is 'login', ensure user exists and email is verified.
        *   If `type` is 'register', ensure user exists but email is not yet verified.
    5.  **Invalidate Old OTPs (Optional but Recommended):** `UPDATE otp_verifications SET expires_at = DATETIME('now') WHERE email = ? AND type = ? AND used_at IS NULL`.
    6.  **Generate and Send New OTP:** Call shared OTP logic (see "I.G. OTP Logic") for the given `email` and `type`.
    7.  **Return Success Response:** 200 OK ("A new OTP has been sent to your email address.").

---

## II. Business Listing Management (Seller Actions)

This section details the backend processes for sellers creating and managing their business listings. All actions require an authenticated 'SELLER' role. The `seller_id` (which is the `user_id` of the authenticated seller) from the authenticated session must be used to authorize actions and associate data.

### A. Create New Business Listing

*   **Triggering UI:** Seller Dashboard -> "Create New Listing" form submission (`/app/seller-dashboard/listings/create/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/listings` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Seller & Authorize:**
        *   Verify the request is from an authenticated user (via session token/JWT).
        *   Retrieve `user_id` from the session. This will be the `seller_id` for the listing.
        *   Query `user_profiles` table in D1 to confirm `role` is 'SELLER'. If not, return 403 Forbidden.
    2.  **Receive Request:** Worker receives a POST request with all listing data as per the enhanced `ListingSchema` (from the frontend page). This includes:
        *   Anonymous info: `listingTitleAnonymous`, `industry`, `locationCountry`, `locationCityRegionGeneral`, `anonymousBusinessDescription`, `keyStrengthsAnonymous` (array).
        *   Anonymous financial ranges: `annualRevenueRange`, `netProfitMarginRange` (optional).
        *   Actual `askingPrice` (number).
        *   Anonymous deal info: `dealStructureLookingFor` (optional array), `reasonForSellingAnonymous` (optional).
        *   Detailed/Verified info: `businessModel`, `yearEstablished`, `registeredBusinessName`, `businessWebsiteUrl`, `socialMediaLinks`, `numberOfEmployees`, `technologyStack`.
        *   Specific financials: `specificAnnualRevenueLastYear`, `specificNetProfitLastYear`.
        *   New: `adjustedCashFlow`, `adjustedCashFlowExplanation`.
        *   Detailed deal/seller info: `detailedReasonForSelling`, `sellerRoleAndTimeCommitment`, `postSaleTransitionSupport`.
        *   Growth info: `specificGrowthOpportunities` (bullet points as string).
        *   `imageUrls`: Array of up to 5 image URLs.
        *   *Note on Document Placeholders:* File input fields on the form are for UI. The backend logic for actual file uploads to R2 and linking is separate (See Section VI). The D1 `listings` schema will have nullable TEXT fields for document URLs/keys (e.g., `financial_documents_url`, `key_metrics_report_url`, `ownership_documents_url`).
    3.  **Validate Input:**
        *   Use the Zod `ListingSchema` (or an equivalent schema defined for the API) to validate all received data.
        *   If validation fails, return a 400 Bad Request error with details.
    4.  **Create Listing Record in D1:**
        *   Generate a unique `listing_id` (e.g., UUID).
        *   Fetch the seller's current `verification_status` from their `user_profiles` record in D1.
        *   Insert a new record into the `listings` table in D1 with:
            *   `listing_id`, `seller_id` (from authenticated user).
            *   All validated fields from the request. Store `imageUrls` as a JSON string or in a related table if D1 structure prefers normalization.
            *   Placeholders for document URLs/keys (e.g., `financial_documents_url`) should be `NULL` initially.
            *   `status`: Set to `'ACTIVE_ANONYMOUS'`. (Listings go live anonymously immediately, verification is an optional seller-initiated step).
            *   `is_seller_verified`: Set to `true` if the `seller_id` from `user_profiles` has `verification_status = 'VERIFIED'`, otherwise `false`.
            *   Timestamps: `created_at`, `updated_at` (set to current UTC).
    5.  **Return Success Response:**
        *   Return a 201 Created status with a success message (e.g., "Listing created successfully.") and the new `listing_id` and created listing data.

### B. Edit Existing Business Listing

*   **Triggering UI:** Seller Dashboard -> "My Listings" -> "Edit Listing" button (e.g., `/app/seller-dashboard/listings/[listingId]/edit/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/listings/[listingId]` (PUT)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Seller & Authorize:**
        *   Verify authenticated seller and get `user_id`.
        *   Retrieve `listingId` from the URL path.
        *   Query the `listings` table in D1: `SELECT seller_id, status FROM listings WHERE listing_id = ?`.
        *   If listing not found, return 404 Not Found.
        *   If `listings.seller_id` does not match authenticated `user_id`, return 403 Forbidden (user is not the owner).
    2.  **Receive Request:** Worker receives a PUT request with the `listingId` in the path and updated listing data in the body (can be a partial `ListingSchema`).
    3.  **Validate Input:**
        *   Use a partial/update version of the Zod `ListingSchema` (all fields optional) to validate any received data.
    4.  **Process Document Updates (Conceptual for R2 - See Section VI):**
        *   If new document URLs/keys are provided (after frontend potentially handles upload to R2 and sends back the key/URL), update these in the D1 record. If document fields are cleared, set them to `NULL`. This depends on whether file uploads are handled in this edit flow or separately.
    5.  **Update Listing Record in D1:**
        *   Update the specified fields for the given `listing_id` in the `listings` table. Only update fields that are present in the request body.
        *   Update `updated_at` timestamp to current UTC.
        *   If significant content changes are made that might require re-verification by admins (if the listing was previously 'VERIFIED_PUBLIC' or 'VERIFIED_ANONYMOUS'), potentially update `status` to `'PENDING_VERIFICATION'` or add a flag/note for admin attention. This depends on defined business rules.
    6.  **Return Success Response:**
        *   Return a 200 OK status with a success message (e.g., "Listing updated successfully.") and the updated listing data fetched from D1.

### C. Deactivate/Reactivate Listing

*   **Triggering UI:** Seller Dashboard -> "My Listings" -> "Deactivate/Reactivate" button.
*   **Next.js API Route Stub (Conceptual):** `/api/listings/[listingId]/status` (PUT) - or could be part of the general `PUT /api/listings/[listingId]` with a body like `{ new_status: 'INACTIVE' }`. Let's assume a dedicated status endpoint for clarity.
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Seller & Authorize:** (As in "Edit Existing Business Listing" - verify ownership).
    2.  **Receive Request:** Worker receives PUT request with `listingId` in the path and desired `new_status` in the body (e.g., `{ "new_status": "INACTIVE" }` or `{ "new_status": "ACTIVE_ANONYMOUS" }`).
    3.  **Validate New Status Transition:**
        *   Fetch the current `status` of the listing from D1.
        *   Ensure the requested `new_status` is a valid transition allowed for a seller. For example, a seller can typically toggle between 'ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC' and 'INACTIVE'. They should not be able to self-approve a listing from 'PENDING_VERIFICATION' or change a 'REJECTED_BY_ADMIN' status without admin intervention.
        *   If the transition is invalid based on business rules, return 400 Bad Request.
    4.  **Update Listing Status in D1:**
        *   Update the `status` field for the `listingId` in the `listings` table to the `new_status`.
        *   Update `updated_at` timestamp to current UTC.
    5.  **Return Success Response:** 200 OK with success message and the updated listing data fetched from D1.

### D. Seller Requests Listing/Profile Verification

*   **Triggering UI:**
    *   Seller Dashboard -> "Verification" page -> "Request Verification" button.
    *   Seller Dashboard -> "My Listings" page -> "Request Verification Call for this Listing" button next to a specific anonymous listing.
*   **Next.js API Route Stub (Conceptual):** `/api/verification-requests` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Seller:** Get authenticated `user_id`.
    2.  **Receive Request:** Worker receives POST request with:
        *   `verificationType`: 'PROFILE_SELLER' or 'LISTING'.
        *   `listingId` (string, conditionally required if `verificationType` is 'LISTING').
        *   `bestTimeToCall` (optional string).
        *   `notes` (optional string).
    3.  **Validate Input:** Use a Zod schema. Ensure `listingId` is provided and valid if `verificationType` is 'LISTING'.
    4.  **Authorize (if `verificationType` is 'LISTING'):**
        *   If `listingId` is provided, query `listings` table in D1 to ensure the `seller_id` matches the authenticated `user_id`. If not, return 403 Forbidden.
    5.  **Check Current Status & Prevent Redundant Requests:**
        *   If `verificationType` is 'PROFILE_SELLER': Query `user_profiles` for the `user_id`. If `verification_status` is already 'PENDING_VERIFICATION' or 'VERIFIED', return 409 Conflict (e.g., "Profile verification already in progress or completed.").
        *   If `verificationType` is 'LISTING': Query `listings` for the `listing_id`. If `status` is already 'PENDING_VERIFICATION', 'VERIFIED_ANONYMOUS', or 'VERIFIED_PUBLIC', return 409 Conflict (e.g., "Listing verification already in progress or completed.").
    6.  **Update Entity Status in D1 (to reflect pending state):**
        *   If `verificationType` is 'PROFILE_SELLER': `UPDATE user_profiles SET verification_status = 'PENDING_VERIFICATION', updated_at = DATETIME('now') WHERE user_id = ?`.
        *   If `verificationType` is 'LISTING': `UPDATE listings SET status = 'PENDING_VERIFICATION', updated_at = DATETIME('now') WHERE listing_id = ?`.
    7.  **Create Verification Request Record in D1:**
        *   Insert a new record into a `verification_requests` table in D1 with:
            *   `request_id` (PK, UUID).
            *   `user_id` (seller's ID from session).
            *   `listing_id` (if `verificationType` is 'LISTING', otherwise `NULL`).
            *   `request_type` (stores `verificationType`).
            *   `best_time_to_call` (sanitized string).
            *   `notes` (sanitized string).
            *   `status`: 'NEW_REQUEST' (initial status for the admin queue).
            *   Timestamps: `created_at`, `updated_at`.
    8.  **Conceptual: Notify Admin Team:** This action effectively adds the request to the Admin Panel's "Seller/Listing Verification Queue". (An actual notification system like email to admins or a webhook could be triggered).
    9.  **Return Success Response:** 201 Created with a success message (e.g., "Verification request submitted successfully. Our team will be in touch.").

---

## III. Marketplace & Buyer Actions

This section outlines the backend processes involved when buyers interact with the marketplace and individual listings.

### A. Fetch All Listings (for `/marketplace`)

*   **Triggering UI:** `/marketplace` page load, filter changes, sorting, pagination.
*   **Next.js API Route Stub (Conceptual):** `/api/listings` (GET)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives GET request with optional query parameters:
        *   `page` (number, for pagination, default 1)
        *   `limit` (number, items per page, default 9-12)
        *   `industry` (string or array of strings, for industry filter)
        *   `country` (string, for country filter)
        *   `revenueRange` (string, for revenue range filter)
        *   `maxAskingPrice` (number, for max asking price filter)
        *   `keywords` (string, for keyword search)
        *   `sortBy` (string, e.g., 'createdAt', 'askingPrice')
        *   `sortOrder` (string, 'asc' or 'desc')
    2.  **Validate Query Parameters:** Ensure types are correct and values are within reasonable limits. Sanitize string inputs to prevent SQL injection if not using a query builder that handles this.
    3.  **Determine Requesting Buyer's Status (Conceptual):**
        *   Check if the request is from an authenticated buyer (e.g., via session token/JWT).
        *   If authenticated, retrieve their `user_id`. Query D1 `user_profiles` to get their `verification_status` and `is_paid` status.
        *   If not authenticated, treat as an anonymous public user.
    4.  **Construct SQL Query for D1 (`listings` table):**
        *   **Base `SELECT`:** Select fields needed for the `ListingCard` display. This will always include public anonymous fields: `listing_id`, `listingTitleAnonymous`, `industry`, `locationCountry`, `locationCityRegionGeneral`, `SUBSTR(anonymousBusinessDescription, 1, 150) AS description_snippet` (or handle snippet in frontend), `annualRevenueRange`, `askingPrice` (the number, not the range string), `imageUrls` (first URL or a primary image URL), `is_seller_verified` (boolean flag on the listing itself, derived from seller's verification), `created_at`.
        *   **Filtering (`WHERE` clauses):**
            *   Always filter for `listings.status` IN `('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC')`. (Do not show 'INACTIVE', 'PENDING_VERIFICATION', 'REJECTED_BY_ADMIN', 'CLOSED_DEAL').
            *   If `industry` filter is present: `AND industry = ?` (or `IN (?,?,?)` if multiple).
            *   If `country` filter is present: `AND locationCountry = ?`.
            *   If `revenueRange` filter is present: `AND annualRevenueRange = ?`.
            *   If `maxAskingPrice` filter is present: `AND askingPrice <= ?`.
            *   If `keywords` filter is present: `AND (listingTitleAnonymous LIKE '%keyword%' OR anonymousBusinessDescription LIKE '%keyword%' OR industry LIKE '%keyword%')`. (Use appropriate D1 syntax for case-insensitive LIKE if available, or handle case in query/data).
        *   **Sorting (`ORDER BY`):**
            *   Based on `sortBy` and `sortOrder`. E.g., `ORDER BY listings.created_at DESC` (for newest), `ORDER BY listings.askingPrice ASC`.
        *   **Pagination:** Apply `LIMIT ? OFFSET ?`. `OFFSET` is `(page - 1) * limit`.
    5.  **Execute Query & Fetch Total Count:**
        *   Execute the main query to get the paginated list of listings.
        *   Execute a separate `SELECT COUNT(*) FROM listings WHERE ...` (with the same filters) to get the `totalListings` for pagination calculation.
    6.  **Process Results:**
        *   For each listing, ensure only the selected public fields are returned. The `is_seller_verified` flag is important for the "Verified Seller" badge on the card.
    7.  **Calculate Pagination Details:** `totalPages = Math.ceil(totalListings / limit)`.
    8.  **Return Success Response:** 200 OK with `{ listings: [...], currentPage, totalPages, totalListings }`.

### B. Fetch Single Listing Details (`/listings/[listingId]`)

*   **Triggering UI:** Navigating to a specific listing detail page (e.g., `/app/listings/[listingId]/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/listings/[listingId]` (GET)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Get `listingId` from the URL path.
    2.  **Determine Requesting Buyer's Status:** (As in "Fetch All Listings" - check auth, get `user_id`, `verification_status`, `is_paid` from D1).
    3.  **Fetch Listing and Seller Data from D1:**
        *   Query `listings` table: `SELECT * FROM listings WHERE listing_id = ?`.
        *   If listing not found, or its `status` is not one of ('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC'), return 404 Not Found.
        *   If listing found, query `user_profiles` table: `SELECT user_id AS seller_user_id, verification_status AS seller_platform_verification_status, is_paid AS seller_is_paid, full_name AS seller_full_name FROM user_profiles WHERE user_id = fetched_listing.seller_id`.
    4.  **Construct Response Object (Conditional Data Exposure):**
        *   **Always include:** All public/anonymous fields from the `listings` record (e.g., `listingTitleAnonymous`, `industry`, `locationCountry`, `anonymousBusinessDescription`, `keyStrengthsAnonymous`, `annualRevenueRange`, `askingPrice`, `imageUrls`, `specificGrowthOpportunities` (as this is now public), `reasonForSellingAnonymous`, `dealStructureLookingFor`).
        *   Also include `listing.is_seller_verified` (boolean from listing record).
        *   **Conditionally Include Verified/Detailed Information:**
            *   The condition: `listing.is_seller_verified === true` AND the authenticated buyer has `verification_status === 'VERIFIED'` AND `is_paid === true`.
            *   If condition is met, additionally include:
                *   `actualCompanyName`, `registeredBusinessName`, `yearEstablished`, `fullBusinessAddress`.
                *   `businessModel`, `socialMediaLinks`, `numberOfEmployees`, `technologyStack`.
                *   `specificAnnualRevenueLastYear`, `specificNetProfitLastYear`.
                *   `adjustedCashFlow`, `adjustedCashFlowExplanation`.
                *   `detailedReasonForSelling`, `sellerRoleAndTimeCommitment`, `postSaleTransitionSupport`.
                *   URLs for uploaded documents: `financialDocumentsUrl`, `key_metrics_report_url`, `ownershipDocumentsUrl`, `secureDataRoomLink`, etc. (These would be R2 URLs or identifiers).
            *   If condition is NOT met, these verified fields should be omitted or explicitly set to a placeholder like "Access Restricted".
    5.  **Return Success Response:** 200 OK with the constructed listing object containing either anonymous or full details based on the logic above.

### C. Buyer Inquires About Business

*   **Triggering UI:** "Inquire about business" button on listing card or detail page.
*   **Next.js API Route Stub (Conceptual):** `/api/inquiries` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Buyer:**
        *   Verify authenticated buyer via session token/JWT. Get `user_id`.
        *   Query D1 `user_profiles` for `buyer_id` to get their `verification_status` and `is_paid`.
        *   If not authenticated or role is not 'BUYER', return 401/403 Unauthorized.
    2.  **Receive Request:** Worker receives POST request with `{ "listingId": "string", "message"?: "string" }`.
    3.  **Validate Input:** Use Zod schema. Ensure `listingId` is a valid format.
    4.  **Fetch Listing and Seller Details from D1:**
        *   `SELECT seller_id, status AS listing_status, is_seller_verified, listingTitleAnonymous FROM listings WHERE listing_id = ?`.
        *   If listing not found or its status is not publicly visible (e.g., 'INACTIVE', 'REJECTED_BY_ADMIN'), return 404 or 400 error.
        *   Fetch seller's `verification_status` from `user_profiles` using `seller_id`.
    5.  **Create Inquiry Record in D1:**
        *   Insert a new record into the `inquiries` table in D1:
            *   `inquiry_id` (PK, UUID).
            *   `listing_id` (from request).
            *   `buyer_id` (from authenticated buyer's session).
            *   `seller_id` (fetched from the listing).
            *   `message` (optional, sanitized text from request).
            *   `inquiry_timestamp` (current UTC).
            *   `status`: Set to `'NEW_INQUIRY'` (initial system status).
            *   Store snapshots at time of inquiry: `buyer_verification_at_inquiry` (buyer's `verification_status`), `seller_verification_at_inquiry` (seller's `verification_status`), `listing_is_seller_verified_at_inquiry` (listing's `is_seller_verified`).
            *   Timestamps: `created_at`, `updated_at`.
    6.  **Trigger Notifications & Engagement Flow (Conceptual - more detail in Section IV for Seller Dashboard):**
        *   **Notify Seller:** Send an in-app notification and/or email to the seller about the new inquiry. Content: "You have a new inquiry for '[Listing Title]' from [Buyer Name/Status]. View in your dashboard."
        *   **Admin Queue/Notification (Conditional):** The subsequent logic for admin involvement (if buyer is anonymous and seller engages, or if seller is anonymous, or if both are verified) is complex and primarily triggered when the *seller engages*. For now, this step primarily creates the inquiry and notifies the seller.
    7.  **Return Success Response:** 201 Created with a success message (e.g., "Inquiry submitted successfully.") and potentially the created inquiry data.

### D. Buyer Requests Profile Verification

*   **Triggering UI:** Buyer Dashboard -> "Verification" page -> "Request Verification Call" button.
*   **Next.js API Route Stub (Conceptual):** `/api/verification-requests` (POST) - This can be a shared endpoint, with `type` distinguishing the request.
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Buyer:** Get authenticated `user_id`.
    2.  **Receive Request:** Worker receives POST request with:
        *   `verificationType`: Should be 'PROFILE_BUYER'.
        *   `bestTimeToCall` (optional string).
        *   `notes` (optional string).
        *   (Future: may include uploaded document identifiers if files are part of this request).
    3.  **Validate Input:** Use a Zod schema.
    4.  **Check Current User Status:**
        *   Query `user_profiles` for the `user_id`.
        *   If `verification_status` is already 'VERIFIED' or 'PENDING_VERIFICATION', return 409 Conflict (e.g., "Verification already in progress or completed.").
    5.  **Update User Profile Status in D1:**
        *   `UPDATE user_profiles SET verification_status = 'PENDING_VERIFICATION', updated_at = DATETIME('now') WHERE user_id = ?`.
    6.  **Create Verification Request Record in D1:**
        *   Insert a new record into the `verification_requests` table in D1:
            *   `request_id` (PK, UUID).
            *   `user_id` (buyer's ID from session).
            *   `listing_id`: `NULL` (as this is profile verification).
            *   `request_type`: 'PROFILE_BUYER'.
            *   `best_time_to_call` (sanitized).
            *   `notes` (sanitized).
            *   `status`: 'NEW_REQUEST'.
            *   Timestamps: `created_at`, `updated_at`.
    7.  **Conceptual: Notify Admin Team:** Adds the request to Admin Panel's "Buyer Verification Queue".
    8.  **Return Success Response:** 201 Created with a success message (e.g., "Profile verification request submitted successfully. Our team will be in touch.").

---

## IV. Dashboard Data Fetching & Actions (Buyer & Seller)

All API endpoints in this section require user authentication. The `user_id` from the authenticated session is crucial for fetching user-specific data and authorizing actions.

### A. Buyer Dashboard

1.  **Overview Page (`/dashboard/page.tsx` or dynamic `/dashboard` for buyer role)**
    *   **Data Needed for Display:**
        *   Buyer's full name.
        *   Number of active inquiries.
        *   Buyer's current `verification_status`.
        *   List of 2-3 most recent inquiries (listing title, inquiry date, inquiry status from buyer's perspective).
    *   **Conceptual API Route(s) (GET):** `/api/dashboard/buyer/overview`
    *   **Detailed Backend Worker Logic (D1 Queries):**
        1.  Authenticate buyer, get `user_id`.
        2.  Fetch buyer's details: `SELECT full_name, verification_status FROM user_profiles WHERE user_id = ?`.
        3.  Fetch active inquiry count: `SELECT COUNT(*) FROM inquiries WHERE buyer_id = ? AND status NOT IN ('archived', 'connection_facilitated')`.
        4.  Fetch recent inquiries: `SELECT i.id, i.listing_id, i.inquiry_timestamp, i.status AS system_status, l.listingTitleAnonymous FROM inquiries i JOIN listings l ON i.listing_id = l.listing_id WHERE i.buyer_id = ? ORDER BY i.inquiry_timestamp DESC LIMIT 3`.
        5.  Map `system_status` to `statusBuyerPerspective` for each inquiry based on the rules defined in the MVP.
        6.  Return aggregated data: `{ fullName, verificationStatus, activeInquiryCount, recentInquiries: [...] }`.

2.  **My Profile (`/dashboard/profile/page.tsx` or dynamic `/dashboard/profile` for buyer role)**
    *   **Data Fetching API Route (GET):** `/api/profile` (This could be a shared endpoint that returns profile data based on the authenticated user's role and ID).
        *   **Backend Worker Logic (D1 Query):** `SELECT full_name, email, phone_number, country, buyer_persona_type, buyer_persona_other, investment_focus_description, preferred_investment_size, key_industries_of_interest FROM user_profiles WHERE user_id = ?`. (Email is fetched for display but not editable).
    *   **Profile Update API Route (PUT):** `/api/profile`
        *   **Backend Worker Logic:**
            1.  Authenticate buyer, get `user_id`.
            2.  Receive updated profile data in request body (Full Name, Phone, Country, and all Buyer Persona fields).
            3.  Validate input against buyer-specific `ProfileSchema`.
            4.  `UPDATE user_profiles SET full_name = ?, phone_number = ?, ..., updated_at = DATETIME('now') WHERE user_id = ?`.
            5.  Return 200 OK with updated profile data.
    *   **Password Change API Route (PUT):** (Moved to `/dashboard/settings` or a shared `/api/auth/change-password`)
        *   See "I. Authentication Flow" for password change logic, which would be invoked by a settings page.

3.  **My Inquiries (`/dashboard/inquiries/page.tsx` or dynamic `/dashboard/inquiries` for buyer role)**
    *   **Data Needed:** List of all buyer's inquiries, including listing title, seller's verification status (badge), inquiry date, and the inquiry status from the buyer's perspective.
    *   **Conceptual API Route(s) (GET):** `/api/inquiries?role=buyer` (or just `/api/inquiries` if role is derived from session).
    *   **Detailed Backend Worker Logic (D1 Queries):**
        1.  Authenticate buyer, get `user_id`.
        2.  `SELECT i.id, i.listing_id, i.inquiry_timestamp, i.status AS system_status, l.listingTitleAnonymous, l.is_seller_verified AS listing_seller_is_verified, seller_profile.verification_status AS seller_platform_verification_status FROM inquiries i JOIN listings l ON i.listing_id = l.listing_id JOIN user_profiles seller_profile ON l.seller_id = seller_profile.user_id WHERE i.buyer_id = ? ORDER BY i.inquiry_timestamp DESC`.
        3.  For each inquiry, determine `statusBuyerPerspective` based on `i.system_status`, buyer's `verification_status`, `listing_seller_is_verified`, and `seller_platform_verification_status` (as per the detailed engagement flow logic in MVP plan).
        4.  Return the list of processed inquiries.
    *   **Action: "Proceed to Verification" Button:** This is a UI navigation link to `/dashboard/verification`, no direct API call from this button itself.

4.  **Verification (`/dashboard/verification/page.tsx` or dynamic `/dashboard/verification` for buyer role)**
    *   **Data Needed:** Buyer's current `verification_status` (fetched via the profile API or a dedicated status API).
    *   **Action: Request Verification Call (POST):** Uses the shared `/api/verification-requests` endpoint (as detailed in Section III.D).

5.  **Notifications (`/dashboard/notifications/page.tsx` or dynamic for buyer role)**
    *   **Data Needed:** List of notifications for the buyer, including message, timestamp, link (if any), read/unread status.
    *   **Conceptual API Route(s) (GET):** `/api/notifications` (filters by authenticated `user_id`).
    *   **Detailed Backend Worker Logic (D1 Query):** `SELECT notification_id, message, timestamp, link, is_read, type FROM notifications WHERE user_id = ? ORDER BY timestamp DESC`.
    *   **Action: Mark Notification as Read (PUT):** `/api/notifications/[notificationId]/read`
        *   **Backend Worker Logic:**
            1.  Authenticate buyer, get `user_id`.
            2.  Receive `notificationId` from path.
            3.  `UPDATE notifications SET is_read = true, updated_at = DATETIME('now') WHERE notification_id = ? AND user_id = ?`.
            4.  Return 200 OK.

### B. Seller Dashboard

1.  **Overview Page (`/seller-dashboard/page.tsx`)**
    *   **Data Needed:** Seller's full name, count of active listings, total inquiries received, inquiries awaiting engagement, seller's `verification_status`, list of 2-3 recent active listings with inquiry counts.
    *   **Conceptual API Route(s) (GET):** `/api/seller-dashboard/overview`
    *   **Detailed Backend Worker Logic (D1 Queries):**
        1.  Authenticate seller, get `user_id`.
        2.  Fetch seller's details: `SELECT full_name, verification_status FROM user_profiles WHERE user_id = ?`.
        3.  Fetch active listing count: `SELECT COUNT(*) FROM listings WHERE seller_id = ? AND status IN ('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC')`.
        4.  Fetch total inquiries: `SELECT COUNT(*) FROM inquiries WHERE seller_id = ?`.
        5.  Fetch inquiries awaiting engagement: `SELECT COUNT(*) FROM inquiries WHERE seller_id = ? AND status = 'NEW_INQUIRY'`.
        6.  Fetch recent active listings with inquiry counts:
            `SELECT l.listing_id, l.listingTitleAnonymous, l.status, l.is_seller_verified, (SELECT COUNT(*) FROM inquiries WHERE listing_id = l.listing_id) as inquiry_count FROM listings l WHERE l.seller_id = ? AND l.status IN ('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC') ORDER BY l.created_at DESC LIMIT 3`.
        7.  Return aggregated data.

2.  **My Profile (`/seller-dashboard/profile/page.tsx`)**
    *   **Data Fetching API Route (GET):** `/api/profile` (shared endpoint).
        *   **Backend Worker Logic (D1 Query):** `SELECT full_name, email, phone_number, country, initial_company_name FROM user_profiles WHERE user_id = ?`.
    *   **Profile Update API Route (PUT):** `/api/profile`
        *   **Backend Worker Logic:**
            1.  Authenticate seller, get `user_id`.
            2.  Receive updated profile data (Full Name, Phone, Country, Initial Company Name).
            3.  Validate input against seller-specific `ProfileSchema` (ensure `initialCompanyName` is present).
            4.  `UPDATE user_profiles SET full_name = ?, phone_number = ?, ..., updated_at = DATETIME('now') WHERE user_id = ?`.
            5.  Return 200 OK with updated profile data.
    *   **Password Change API Route (PUT):** (Moved to `/seller-dashboard/settings` or shared `/api/auth/change-password`).

3.  **My Listings (`/seller-dashboard/listings/page.tsx`)**
    *   **Data Needed:** List of all seller's listings, including anonymous title, industry, creation date, status, `is_seller_verified` flag, and inquiry count for each listing.
    *   **Conceptual API Route(s) (GET):** `/api/listings?seller_view=true` (or derive from session that it's a seller viewing their own).
    *   **Detailed Backend Worker Logic (D1 Query):**
        1.  Authenticate seller, get `user_id`.
        2.  `SELECT l.*, (SELECT COUNT(*) FROM inquiries WHERE listing_id = l.listing_id) as inquiry_count FROM listings l WHERE l.seller_id = ? ORDER BY l.created_at DESC`. This fetches all fields for the seller to manage.
        3.  Return the list of listings.
    *   **Actions:**
        *   **Deactivate/Reactivate Listing (PUT):** Uses `/api/listings/[listingId]/status` (as per Section II.C).
        *   **Request Listing Verification (POST):** Uses `/api/verification-requests` (as per Section II.D, with `verificationType: 'LISTING'`).

4.  **Edit Listing (`/seller-dashboard/listings/[listingId]/edit/page.tsx`)**
    *   **Data Fetching API Route (GET):** `/api/listings/[listingId]?view=seller_edit` (or similar to indicate owner view).
        *   **Backend Worker Logic:**
            1.  Authenticate seller, get `user_id`.
            2.  Fetch `listingId` from path.
            3.  Query `SELECT * FROM listings WHERE listing_id = ? AND seller_id = ?`.
            4.  If not found or not owned, return 404/403.
            5.  Return all listing fields to pre-fill the edit form.
    *   **Update Listing API Route (PUT):** Uses `/api/listings/[listingId]` (as per Section II.B).

5.  **My Inquiries (Seller Perspective) (`/seller-dashboard/inquiries/page.tsx`)**
    *   **Data Needed:** List of inquiries for the seller's listings, including inquiry date, listing title, buyer's name/status (e.g., "Anonymous Buyer" or "Jane Smith - Verified Buyer"), and inquiry status from the seller's perspective.
    *   **Conceptual API Route(s) (GET):** `/api/inquiries?role=seller` (or just `/api/inquiries`).
    *   **Detailed Backend Worker Logic (D1 Queries):**
        1.  Authenticate seller, get `user_id`.
        2.  `SELECT i.id, i.listing_id, i.inquiry_timestamp, i.status AS system_status, i.message, l.listingTitleAnonymous, buyer_profile.full_name AS buyer_name, buyer_profile.verification_status AS buyer_verification_status FROM inquiries i JOIN listings l ON i.listing_id = l.listing_id JOIN user_profiles buyer_profile ON i.buyer_id = buyer_profile.user_id WHERE i.seller_id = ? ORDER BY i.inquiry_timestamp DESC`.
        3.  For each inquiry, determine `statusSellerPerspective` based on `i.system_status`, buyer's `verification_status`, seller's profile verification, and listing's `is_seller_verified` status (as per detailed engagement flow logic in MVP plan).
        4.  Return the list of processed inquiries.
    *   **Action: Seller Engages with Inquiry (POST):** `/api/inquiries/[inquiryId]/engage`
        *   **Detailed Backend Worker Logic:**
            1.  Authenticate Seller, get `user_id`.
            2.  Receive `inquiryId` from path.
            3.  Fetch inquiry from D1: `SELECT * FROM inquiries WHERE inquiry_id = ?`. Verify ownership (`inquiry.seller_id === user_id`).
            4.  If `inquiry.status` is not 'NEW_INQUIRY', return error (e.g., "Already engaged or action taken.").
            5.  Fetch buyer's profile from D1: `SELECT verification_status AS buyer_verification_status, is_paid AS buyer_is_paid FROM user_profiles WHERE user_id = inquiry.buyer_id`.
            6.  Fetch seller's listing details from D1: `SELECT status AS listing_current_status, is_seller_verified FROM listings WHERE listing_id = inquiry.listing_id`.
            7.  Fetch seller's own profile from D1: `SELECT verification_status AS seller_verification_status FROM user_profiles WHERE user_id = inquiry.seller_id`.
            8.  **Implement Engagement Flow Logic (Critical - based on MVP document):**
                *   Set `next_inquiry_status` and trigger notifications based on:
                    *   If `buyer_verification_status` is 'ANONYMOUS' or 'PENDING_VERIFICATION':
                        *   `next_inquiry_status` = `'SELLER_ENGAGED_BUYER_PENDING_VERIFICATION'`.
                        *   Notify Buyer: "Seller for '[Listing Title]' ready to engage. Please verify your profile. [Link to Buyer Verification]".
                        *   (Conceptual) Add/Update Buyer's entry in Admin "Verification Queue".
                    *   Else if `seller_verification_status` (seller's profile) is 'ANONYMOUS' or 'PENDING_VERIFICATION' OR `listing.is_seller_verified` is `false`:
                        *   `next_inquiry_status` = `'SELLER_ENGAGED_SELLER_PENDING_VERIFICATION'`.
                        *   Notify Seller: "You engaged with Buyer for '[Listing Title]'. Your profile/listing needs verification. [Link to Seller Verification]".
                        *   (Conceptual) Add/Update Seller's/Listing's entry in Admin "Verification Queue".
                    *   Else (Both Buyer is 'VERIFIED' AND Seller's profile is 'VERIFIED' AND listing `is_seller_verified` is `true`):
                        *   `next_inquiry_status` = `'READY_FOR_ADMIN_CONNECTION'`.
                        *   Notify Admin: "Engagement for Listing '[Listing Title]' between Buyer [Buyer Name] and Seller [Seller Name] is ready for admin connection. [Link to Admin Engagement Queue]".
                        *   Notify Buyer & Seller: "Both parties verified and engaged. Our admin team will facilitate the connection shortly."
            9.  Update `inquiries` table in D1: `SET status = ?, engagement_timestamp = DATETIME('now'), updated_at = DATETIME('now') WHERE inquiry_id = ?`.
            10. Return 200 OK with updated inquiry data or a success message.

6.  **Verification (`/seller-dashboard/verification/page.tsx`)**
    *   **Data Needed:** Seller's `verification_status`, list of their anonymous/unverified listings (ID and Title).
    *   **Conceptual API Route(s) (GET):** `/api/seller-dashboard/verification-data`
        *   **Backend Worker Logic (D1 Queries):**
            1.  Authenticate seller, get `user_id`.
            2.  `SELECT verification_status FROM user_profiles WHERE user_id = ?`.
            3.  `SELECT listing_id, listingTitleAnonymous, status, is_seller_verified FROM listings WHERE seller_id = ? AND (status IN ('ACTIVE_ANONYMOUS', 'PENDING_VERIFICATION') OR is_seller_verified = false)`.
            4.  Return seller's status and list of their unverified/pending listings.
    *   **Action: Request Verification (POST):** Uses the shared `/api/verification-requests` endpoint (as per Section II.D, with `verificationType: 'PROFILE_SELLER'` or `verificationType: 'LISTING'` and the `listingId`).

7.  **Notifications (`/seller-dashboard/notifications/page.tsx`)**
    *   **Data Needed:** List of notifications for the seller.
    *   **Conceptual API Route(s) (GET):** `/api/notifications` (filters by authenticated `user_id`).
    *   **Backend Worker Logic (D1 Query):** (Same as Buyer's notification fetch).
    *   **Action: Mark Notification as Read (PUT):** `/api/notifications/[notificationId]/read` (Same as Buyer's).

---

## V. Admin Panel Backend Logic

All Admin APIs require ADMIN role authentication (e.g., check a role field in `user_profiles` or a custom claim if using an auth provider). Audit logging for significant actions is crucial.

### General for all Admin APIs:

*   **Authentication/Authorization:** Every Admin API route MUST:
    1.  Verify the request is from an authenticated user.
    2.  Fetch the user's role from D1 `user_profiles`. If the role is not 'ADMIN', return 403 Forbidden.
*   **Audit Logging (Conceptual):** For significant write operations (e.g., status changes, deletions), insert a record into an `audit_logs` table in D1: `log_id, admin_user_id, action_type, target_entity_type (e.g., 'USER', 'LISTING'), target_entity_id, timestamp, details_before (JSON), details_after (JSON)`.

### A. User Management

1.  **List Users (`/api/admin/users` - GET)**
    *   **Detailed Backend Worker Logic (D1 Query):**
        *   `SELECT user_id, full_name, email, role, verification_status, is_paid, created_at, last_login, (SELECT COUNT(*) FROM listings WHERE seller_id = up.user_id) AS listing_count, (SELECT COUNT(*) FROM inquiries WHERE buyer_id = up.user_id) AS inquiry_count FROM user_profiles up`.
        *   Apply filters based on query params (e.g., `role`, `verification_status`, `is_paid`, search keyword on `full_name` or `email`).
        *   Implement pagination (`LIMIT ? OFFSET ?`).
        *   Return paginated list of users.

2.  **View User Details (`/api/admin/users/[userId]` - GET)**
    *   **Detailed Backend Worker Logic (D1 Query):**
        *   `SELECT * FROM user_profiles WHERE user_id = ?`. (Returns all profile fields including buyer persona details).

3.  **Update User Verification/Paid Status (`/api/admin/users/[userId]/status` - PUT)**
    *   **Request Body:** `{ new_verification_status?: VerificationStatus, new_is_paid?: boolean }`
    *   **Detailed Backend Worker Logic:**
        1.  Receive `userId` from path, `new_verification_status`, `new_is_paid` from body.
        2.  Validate input.
        3.  `UPDATE user_profiles SET verification_status = COALESCE(?, verification_status), is_paid = COALESCE(?, is_paid), updated_at = DATETIME('now') WHERE user_id = ?`. (Use COALESCE to only update if new value is provided).
        4.  Log admin action.
        5.  (Conceptual) Notify user of status change.
        6.  Return 200 OK with updated user profile.

4.  **Admin Edit User Profile Details (`/api/admin/users/[userId]/profile` - PUT)**
    *   **Request Body:** Partial `UserProfileSchema` (e.g., `fullName`, `phoneNumber`, `country`, buyer/seller specific fields).
    *   **Detailed Backend Worker Logic:**
        1.  Receive `userId` from path and fields to update from body.
        2.  Validate input.
        3.  `UPDATE user_profiles SET field1 = ?, field2 = ?, ..., updated_at = DATETIME('now') WHERE user_id = ?`.
        4.  Log admin action.
        5.  Return 200 OK with updated profile.

5.  **Admin Send Password Reset OTP (`/api/admin/users/[userId]/send-reset-otp` - POST)**
    *   **Detailed Backend Worker Logic:**
        1.  Receive `userId` from path.
        2.  Fetch user's email from `user_profiles` in D1: `SELECT email FROM user_profiles WHERE user_id = ?`.
        3.  If user found, call shared OTP generation/sending function (see "I.G. OTP Logic") with `type = 'PASSWORD_RESET'` for the user's email.
        4.  Log admin action.
        5.  Return 200 OK ("Password reset OTP sent if user exists.").

6.  **Delete User (`/api/admin/users/[userId]` - DELETE)**
    *   **Detailed Backend Worker Logic:**
        1.  Receive `userId` from path.
        2.  **Consider implications:**
            *   Soft delete: `UPDATE user_profiles SET is_deleted = true, deleted_at = DATETIME('now'), email = original_email || '_deleted_' || uuid() WHERE user_id = ?`. (Anonymize/change email to allow re-registration with same email later if desired).
            *   Or hard delete (more complex due to foreign keys).
            *   Deactivate/anonymize associated listings.
            *   Handle/archive ongoing inquiries.
        3.  Log admin action.
        4.  Return 200 OK or 204 No Content.

### B. Listing Management

1.  **List All Listings (`/api/admin/listings` - GET)**
    *   **Detailed Backend Worker Logic (D1 Query):**
        *   `SELECT l.*, u.full_name as seller_name, u.is_paid as seller_is_paid, u.verification_status as seller_verification_status FROM listings l JOIN user_profiles u ON l.seller_id = u.user_id`.
        *   Apply filters based on query params (industry, seller name/ID, listing status, `is_seller_verified`, search keyword).
        *   Implement pagination.
        *   Return paginated list of listings.

2.  **View Full Listing Details (Admin) (`/api/admin/listings/[listingId]` - GET)**
    *   **Detailed Backend Worker Logic (D1 Query):**
        *   `SELECT * FROM listings WHERE listing_id = ?`.
        *   Join with `user_profiles` to get seller details (`seller_name`, `seller_verification_status`, `seller_is_paid`).
        *   Return ALL listing fields (anonymous and verified details, document URLs/keys).

3.  **Update Listing Status (Admin) (`/api/admin/listings/[listingId]/status` - PUT)**
    *   **Request Body:** `{ new_status: ListingStatus, admin_notes?: string }` (e.g., 'VERIFIED_PUBLIC', 'REJECTED_BY_ADMIN').
    *   **Detailed Backend Worker Logic:**
        1.  Receive `listingId` from path, `new_status`, `admin_notes` from body.
        2.  Validate `new_status` against allowed `ListingStatus` values.
        3.  Fetch the listing: `SELECT seller_id FROM listings WHERE listing_id = ?`.
        4.  Start a D1 transaction if multiple related updates.
        5.  `UPDATE listings SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = DATETIME('now') WHERE listing_id = ?`.
        6.  **Conditional Updates based on `new_status`:**
            *   If `new_status` is 'VERIFIED_PUBLIC' or 'VERIFIED_ANONYMOUS':
                *   `UPDATE listings SET is_seller_verified = true WHERE listing_id = ?`.
                *   Also, consider if this implies the seller's profile should also be marked as 'VERIFIED' if it wasn't already: `UPDATE user_profiles SET verification_status = 'VERIFIED' WHERE user_id = (listing.seller_id) AND verification_status != 'VERIFIED'`. This depends on business rules.
            *   If `new_status` is 'REJECTED_BY_ADMIN', ensure `admin_notes` (rejection reason) is stored.
        7.  Log admin action.
        8.  (Conceptual) Notify seller of the listing status change, including rejection reason if applicable.
        9.  Commit D1 transaction.
        10. Return 200 OK with updated listing data.

### C. Verification Queues

1.  **Fetch Buyer Verification Queue (`/api/admin/verification-requests?type=PROFILE_BUYER` - GET)**
    *   **Detailed Backend Worker Logic (D1 Query):**
        *   `SELECT vr.*, u.full_name AS user_name, u.email AS user_email, u.buyer_persona_type FROM verification_requests vr JOIN user_profiles u ON vr.user_id = u.user_id WHERE vr.request_type = 'PROFILE_BUYER' AND vr.status NOT IN ('Approved', 'Rejected') ORDER BY vr.created_at ASC`.
        *   Implement pagination.
        *   Return paginated list of buyer verification requests.

2.  **Fetch Seller/Listing Verification Queue (`/api/admin/verification-requests?type=PROFILE_SELLER` or `type=LISTING` - GET)**
    *   **Detailed Backend Worker Logic (D1 Query):**
        *   Construct query based on `type`:
            *   For 'PROFILE_SELLER': `SELECT vr.*, u.full_name AS user_name, u.email AS user_email FROM verification_requests vr JOIN user_profiles u ON vr.user_id = u.user_id WHERE vr.request_type = 'PROFILE_SELLER' AND vr.status NOT IN ('Approved', 'Rejected') ORDER BY vr.created_at ASC`.
            *   For 'LISTING': `SELECT vr.*, u.full_name AS user_name, u.email AS user_email, l.listingTitleAnonymous FROM verification_requests vr JOIN user_profiles u ON vr.user_id = u.user_id JOIN listings l ON vr.listing_id = l.listing_id WHERE vr.request_type = 'LISTING' AND vr.status NOT IN ('Approved', 'Rejected') ORDER BY vr.created_at ASC`.
        *   Implement pagination.
        *   Return paginated list of requests.

3.  **Update Verification Request Status (`/api/admin/verification-requests/[requestId]/status` - PUT)**
    *   **Request Body:** `{ new_queue_status: VerificationQueueStatus, admin_notes?: string }` (e.g., 'Contacted', 'Docs Under Review', 'Approved', 'Rejected').
    *   **Detailed Backend Worker Logic:**
        1.  Receive `requestId` from path, `new_queue_status`, `admin_notes` from body.
        2.  Validate `new_queue_status`.
        3.  Fetch `verification_requests` record by `requestId` to get `user_id`, `listing_id`, `request_type`.
        4.  Start D1 transaction.
        5.  Update `verification_requests` table: `SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = DATETIME('now') WHERE request_id = ?`.
        6.  **If `new_queue_status` is 'Approved':**
            *   If `request_type` is 'PROFILE_BUYER' or 'PROFILE_SELLER': `UPDATE user_profiles SET verification_status = 'VERIFIED', updated_at = DATETIME('now') WHERE user_id = ?`.
            *   If `request_type` is 'LISTING':
                *   `UPDATE listings SET status = 'VERIFIED_ANONYMOUS', is_seller_verified = true, updated_at = DATETIME('now') WHERE listing_id = ?`. (Default to 'VERIFIED_ANONYMOUS', admin can change to 'VERIFIED_PUBLIC' via listing management if desired).
                *   Also, mark the seller as verified if not already: `UPDATE user_profiles SET verification_status = 'VERIFIED' WHERE user_id = (listing_owner_id) AND verification_status != 'VERIFIED'`.
        7.  **If `new_queue_status` is 'Rejected':**
            *   If `request_type` is 'PROFILE_BUYER' or 'PROFILE_SELLER': `UPDATE user_profiles SET verification_status = 'REJECTED', updated_at = DATETIME('now') WHERE user_id = ?`. (Store `admin_notes` on the verification request).
            *   If `request_type` is 'LISTING': `UPDATE listings SET status = 'REJECTED_BY_ADMIN', admin_notes = COALESCE(?, admin_notes), updated_at = DATETIME('now') WHERE listing_id = ?`.
        8.  Log admin action.
        9.  (Conceptual) Notify user of verification outcome (approved or rejected with reason).
        10. Commit D1 transaction.
        11. Return 200 OK.

### D. Engagement Queue

1.  **Fetch Engagements Ready for Connection (`/api/admin/engagements` or `/api/admin/inquiries?status=READY_FOR_ADMIN_CONNECTION` - GET)**
    *   **Detailed Backend Worker Logic (D1 Query):**
        *   `SELECT i.id AS inquiry_id, i.engagement_timestamp, buyer.user_id AS buyer_user_id, buyer.full_name AS buyer_name, buyer.email AS buyer_email, buyer.phone_number AS buyer_phone, buyer.verification_status AS buyer_verification, seller.user_id AS seller_user_id, seller.full_name AS seller_name, seller.email AS seller_email, seller.phone_number AS seller_phone, seller.verification_status AS seller_verification, l.listing_id, l.listingTitleAnonymous, l.status AS listing_status, l.is_seller_verified FROM inquiries i JOIN user_profiles buyer ON i.buyer_id = buyer.user_id JOIN user_profiles seller ON i.seller_id = seller.user_id JOIN listings l ON i.listing_id = l.listing_id WHERE i.status = 'READY_FOR_ADMIN_CONNECTION' ORDER BY i.engagement_timestamp ASC`.
        *   Implement pagination.
        *   Return paginated list of engagements with contact details for admin.

2.  **Update Engagement Status (Mark as Connection Facilitated) (`/api/admin/engagements/[inquiryId]/status` - PUT)**
    *   **Request Body:** `{ new_status: 'CONNECTION_FACILITATED', admin_notes?: string }`.
    *   **Detailed Backend Worker Logic:**
        1.  Receive `inquiryId` from path, `new_status`, `admin_notes` from body.
        2.  Validate `new_status` (must be 'CONNECTION_FACILITATED').
        3.  `UPDATE inquiries SET status = 'CONNECTION_FACILITATED', admin_notes = COALESCE(?, admin_notes), updated_at = DATETIME('now') WHERE inquiry_id = ?`.
        4.  Log admin action.
        5.  (Conceptual) Notify buyer and seller that the admin has facilitated the connection.
        6.  Return 200 OK.

### E. Analytics Data Aggregation (Conceptual for D1 Queries)

*   **User Metrics:**
    *   Total Users (Sellers vs Buyers): `SELECT role, COUNT(*) FROM user_profiles GROUP BY role`.
    *   Paid/Free Breakdown: `SELECT role, is_paid, COUNT(*) FROM user_profiles GROUP BY role, is_paid`.
    *   Verification Status Breakdown: `SELECT role, verification_status, COUNT(*) FROM user_profiles GROUP BY role, verification_status`.
    *   New User Registrations (24h/7d): `SELECT COUNT(*) FROM user_profiles WHERE created_at >= DATETIME('now', '-X days')`. (Separate by role if needed).
*   **Listing Metrics:**
    *   Total Listings (All Statuses): `SELECT COUNT(*) FROM listings`.
    *   Active Listings (Verified vs Anonymous): `SELECT is_seller_verified, COUNT(*) FROM listings WHERE status IN ('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC') GROUP BY is_seller_verified`.
    *   Deactivated/Closed Listings: `SELECT COUNT(*) FROM listings WHERE status IN ('INACTIVE', 'CLOSED_DEAL')`.
    *   New Listings Created (24h/7d): `SELECT COUNT(*) FROM listings WHERE created_at >= DATETIME('now', '-X days')`.
    *   Listings by Industry: `SELECT industry, COUNT(*) FROM listings WHERE status IN ('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC') GROUP BY industry`.
    *   Listings by Asking Price (Ranges for reporting): Requires bucketing `listings.askingPrice` values using CASE statements or application-level logic. E.g., `SELECT CASE WHEN askingPrice < 100000 THEN 'Under 100k' ... END as price_range, COUNT(*) FROM listings ... GROUP BY price_range`.
*   **Engagement/Deal Flow Metrics:**
    *   Total Inquiries by Status: `SELECT status, COUNT(*) FROM inquiries GROUP BY status`.
    *   Successful Connections Facilitated MTD: `SELECT COUNT(*) FROM inquiries WHERE status = 'CONNECTION_FACILITATED' AND engagement_timestamp >= [start_of_current_month_D1_syntax]`.
*   **Revenue Metrics (Conceptual - requires payment/subscription table in D1 if not directly on `user_profiles`):**
    *   Assume a `subscriptions` table: `sub_id, user_id, plan_type ('SELLER_VERIFIED', 'BUYER_VERIFIED'), amount, transaction_date, status ('ACTIVE', 'CANCELED')`.
    *   Total Revenue MTD: `SELECT SUM(amount) FROM subscriptions WHERE status = 'ACTIVE' AND transaction_date >= [start_of_current_month_D1_syntax]`.
    *   Revenue from Buyers: `SELECT SUM(s.amount) FROM subscriptions s JOIN user_profiles u ON s.user_id = u.user_id WHERE u.role = 'BUYER' AND s.status = 'ACTIVE' AND s.transaction_date >= ...`.
    *   Revenue from Sellers: (Similar query for `u.role = 'SELLER'`).

---

## VI. File Upload Handling (Conceptual for R2)

This section details the intended multi-step process for handling file uploads (e.g., listing images, verification documents) from the frontend to Cloudflare R2, and then linking these files to records in Cloudflare D1.

1.  **Step 1: Frontend Requests Pre-signed URL for Upload**
    *   **Triggering UI:** User selects a file in an `<Input type="file">` on a form (e.g., Create/Edit Listing, Verification Application).
    *   **Frontend Action:**
        *   Makes an API request (e.g., `POST /api/upload/generate-signed-url`).
        *   **Request Body:** `{ filename: string, contentType: string, context: 'listing_image' | 'listing_document' | 'profile_verification_document', entityId?: string (e.g., listingId if for a listing), documentType?: string (e.g., 'financial_statement', 'id_proof') }`.
    *   **Next.js API Route Stub (Conceptual):** `/api/upload/generate-signed-url` (POST)

2.  **Step 2: Backend Worker Generates Pre-signed R2 URL**
    *   **Cloudflare Worker Logic:**
        1.  **Authenticate User & Authorize:**
            *   Verify authenticated user.
            *   Based on `context` and `entityId` (if provided), authorize if the user is allowed to upload for that entity (e.g., seller owns the `listingId`).
        2.  **Validate Request Body:** Check `filename`, `contentType`, `context`.
        3.  **Construct R2 Object Key:** Generate a unique, secure object key/path.
            *   Example for listing image: `listings/${listingId}/images/${uuidv4()}-${sanitized_filename}`.
            *   Example for verification doc: `users/${user_id}/verification/${documentType}/${uuidv4()}-${sanitized_filename}`.
        4.  **Use Cloudflare R2 SDK/API:**
            *   Call the R2 binding's method (e.g., `r2Bucket.createPresignedUrl` or equivalent if using raw API) to generate a pre-signed URL for a `PUT` operation.
            *   Specify bucket name, object key, desired expiry time for the URL (e.g., 5-15 minutes), and `contentType`.
        5.  **Return Success Response:** 200 OK with `{ signedUrl: string, objectKey: string }`. The `objectKey` is returned so the frontend can reference it when notifying the backend of a successful upload.

3.  **Step 3: Frontend Uploads File Directly to R2**
    *   **Frontend Action:**
        *   Uses the `fetch` API (or a library like Axios) to make a `PUT` request directly to the `signedUrl` received from the backend.
        *   The request body is the file itself.
        *   The `Content-Type` header of the `PUT` request MUST match the `contentType` specified when generating the pre-signed URL.
        *   Handle upload progress and success/error states in the UI.

4.  **Step 4: Frontend Notifies Backend of Successful Upload to Link File**
    *   **Triggering UI:** After the direct R2 upload in Step 3 succeeds.
    *   **Frontend Action:** Makes an API request to a backend endpoint to record the file association.
        *   Example for listing image/document: `POST /api/listings/[listingId]/documents` (or `/images`).
        *   Example for profile verification document: `POST /api/profile/documents`.
    *   **Request Body:** `{ documentType: string (e.g., 'listing_image_1', 'financial_statement', 'id_proof'), fileKey: string (the R2 objectKey received in Step 2), originalFilename: string, fileSize?: number, contentType?: string }`.
    *   **Next.js API Route Stub (Conceptual):** e.g., `/api/listings/[listingId]/documents` (POST) or `/api/profile/documents` (POST).

5.  **Step 5: Backend Worker Updates D1 Database with File Reference**
    *   **Cloudflare Worker Logic:**
        1.  **Authenticate User & Authorize:** Verify user and ensure they are allowed to attach a document to the specified `listingId` or their own profile.
        2.  **Validate Request Body:** Check `documentType`, `fileKey`, etc.
        3.  **Update D1 Database:**
            *   **For listings:**
                *   If `documentType` indicates an image (e.g., `listing_image_1`):
                    *   Fetch the `listings` record by `listingId`.
                    *   Update its `imageUrls` array (JSON string in D1 or related table). Add the new `fileKey` (or the public R2 URL if preferred) to the array. Be mindful of the max number of images (e.g., 5).
                *   If `documentType` indicates a specific document field (e.g., `financial_statement`):
                    *   `UPDATE listings SET financial_documents_url = ? WHERE listing_id = ? AND seller_id = ?`. (Store the `fileKey` or public R2 URL).
            *   **For profile verification:**
                *   Update `user_profiles` (e.g., a field like `id_proof_document_key = ?`) OR insert into a separate `user_verification_documents` table: `doc_id, user_id, document_type, file_key, original_filename, uploaded_at`.
        4.  **Return Success Response:** 200 OK with a success message.
---

I've added the comprehensive sections II, III, IV, V, and VI to `/docs/backend-implementation-plan.md`. This includes the detailed backend logic for business listing management, marketplace and buyer actions, all dashboard functionalities, admin panel operations, and the conceptual file upload handling.

I am profoundly sorry for the prior errors and the stress this has caused. I have been exceptionally careful to ensure this response is accurate and directly provides the necessary, complete code for the documentation file. Please let me know if this is now correct and if we can proceed to the final "Consolidated Backend TODOs" document.