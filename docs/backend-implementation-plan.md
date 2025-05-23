
# Nobridge - Backend Implementation Plan

## Introduction

This document outlines the intended backend logic and processing steps for the Nobridge platform. It assumes a serverless architecture, conceptually leveraging:

*   **Cloudflare Workers:** For API endpoint logic, business logic, and request handling.
*   **Cloudflare D1:** As the primary SQL database for storing user profiles, listings, inquiries, etc.
*   **Cloudflare R2:** For object storage (e.g., user-uploaded documents, listing images).

The Next.js API routes defined in `src/app/api/` will serve as the primary interface between the frontend application and these backend Cloudflare Worker functions. This plan details the expected behavior and data flow for each significant user action and system process.

---

## I. Authentication Flow (User Registration, Login, Logout, Password Management - OTP Based)

This section details the core authentication mechanisms, focusing on an OTP (One-Time Password) system for both registration and login as a two-factor authentication (2FA) or primary verification method.

### A. User Registration (Seller) - Step 1: Initial Data Submission

*   **Triggering UI:** Seller Registration Form submission (`src/app/auth/register/seller/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/auth/register/seller/initiate` (POST) - Name changed to reflect it's the initiation step.
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
        *   Query the `user_profiles` table in Cloudflare D1: `SELECT user_id FROM user_profiles WHERE email = ? AND email_verified_at IS NOT NULL`. (Check for already verified emails to prevent re-registration attempts).
        *   If a verified record is found, return a 409 Conflict error (e.g., "Email address already registered and verified.").
        *   If an unverified record exists (e.g., user started registration but didn't complete OTP), consider allowing them to restart the OTP process or resend OTP. For MVP, might just overwrite or ask them to login if they remember password.
    4.  **Password Hashing:**
        *   Generate a salt.
        *   Hash the received plain-text `password` using a strong hashing algorithm (e.g., Argon2id, scrypt, or bcrypt if platform constraints allow; Cloudflare Workers support Web Crypto API for hashing like SHA-256, but for passwords, a dedicated password hashing library/method is preferred).
    5.  **Store/Update Provisional User Record in D1:**
        *   If a user with this email doesn't exist or exists but isn't verified, insert/update a record in `user_profiles` table with:
            *   `user_id`: Generate a new unique ID (e.g., UUID) if new, or use existing if updating.
            *   `full_name`, `email` (consistent case, e.g., lowercase).
            *   `hashed_password`, `password_salt`.
            *   `phone_number`, `country`.
            *   `role`: Set to `'SELLER'`.
            *   `verification_status`: Set to `'ANONYMOUS'`.
            *   `is_paid`: Set to `false`.
            *   `initial_company_name`.
            *   `email_verified_at`: `NULL` (until OTP verification).
            *   `created_at` (if new), `updated_at`.
    6.  **Generate and Send OTP:**
        *   Call a shared OTP generation/sending function (see "I.G. OTP Logic").
        *   This function will generate an OTP, hash it, store it in an `otp_verifications` table in D1 (linked to `email` or `user_id`, with `type='REGISTRATION'`, and expiry), and send the OTP to the user's email.
    7.  **Return Success Response:**
        *   Return a 200 OK status with a success message (e.g., "Registration initiated. Please check your email for an OTP.") and the `email` to be passed to the OTP verification page.

### B. User Registration (Buyer) - Step 1: Initial Data Submission

*   **Triggering UI:** Buyer Registration Form submission (`src/app/auth/register/buyer/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/auth/register/buyer/initiate` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives a POST request containing buyer data (including new Buyer Persona fields).
    2.  **Validate Input:** Use Zod schema (`BuyerRegisterSchema`).
    3.  **Check Email Uniqueness:** (As per Seller registration).
    4.  **Password Hashing:** (As per Seller registration).
    5.  **Store/Update Provisional User Record in D1:**
        *   Insert/update into `user_profiles` with buyer-specific fields (`buyer_persona_type`, `buyer_persona_other`, etc.), `role` 'BUYER', `email_verified_at` `NULL`.
    6.  **Generate and Send OTP:** (As per Seller registration, type 'REGISTRATION').
    7.  **Return Success Response:** With `email`.

### C. User Login - Step 1: Credential Validation

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
        *   If `email_verified_at` is `NULL`, the user might not have completed their initial registration OTP. In this case, re-send a registration OTP and instruct them to verify their email first. Alternatively, allow login OTP but flag the account. For MVP, prefer to enforce initial email verification. If `email_verified_at` is `NULL`, trigger OTP of type 'REGISTRATION_REVERIFY' or similar.
    6.  **Generate and Send OTP (for Login 2FA):**
        *   Call shared OTP generation/sending function (see "I.G. OTP Logic").
        *   Type should be 'LOGIN'.
    7.  **Return Success Response:**
        *   Return 200 OK with a message like "Credentials verified. Please check your email for an OTP to complete login." and the `email`.

### D. User Logout

*   **Triggering UI:** Logout button.
*   **Next.js API Route Stub (Conceptual):** `/api/auth/logout` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Should be an authenticated request (valid session cookie/token).
    2.  **Clear Session Cookie:** Instruct client to clear the session cookie (e.g., `Set-Cookie: sessionToken=; HttpOnly; Secure; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`).
    3.  **Invalidate Session (if applicable on backend):** If using server-side session storage (e.g., Cloudflare KV or Durable Objects linked to a session ID), delete or mark the session as invalid.
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
    5.  **Return Generic Success Response:** Always return 200 OK with "If an account with that email exists and is verified, an OTP has been sent." (Prevents email enumeration).

### F. Reset Password - Step 2: Verify OTP and Update Password

*   **Triggering UI:** Reset Password Form (after OTP verification, this form isn't designed yet, but would be a new page like `/auth/reset-password-confirm?email=...`). For now, OTP verification itself leads to password update.
*   **Next.js API Route Stub (Conceptual):** `/api/auth/reset-password/complete` (POST) - *This assumes OTP was verified in a prior step, and this endpoint now takes the new password.*
    *Alternatively, the OTP verification endpoint could handle password reset directly if the OTP type is 'PASSWORD_RESET'. Let's assume the latter for simplicity for now, modifying the OTP verification logic.*

### G. OTP Logic (Shared Functionality - Conceptual)

This isn't a direct API route but a conceptual shared module/logic.

*   **1. Generate OTP:**
    *   Create a cryptographically secure random numeric string (e.g., 6 digits).
*   **2. Hash OTP:**
    *   Generate a salt for the OTP.
    *   Hash the plain OTP using a strong algorithm before storing.
*   **3. Store OTP in D1:**
    *   Table: `otp_verifications` (`otp_id` PK, `email` TEXT, `hashed_otp` TEXT, `otp_salt` TEXT, `type` TEXT ('REGISTRATION', 'LOGIN', 'PASSWORD_RESET'), `expires_at` DATETIME, `created_at` DATETIME, `used_at` DATETIME NULLABLE).
    *   Store the hashed OTP, its salt, type, and an expiry (e.g., 5-10 minutes from now).
*   **4. Send OTP via Email:**
    *   Integrate an email sending service (e.g., Mailgun, SendGrid, Cloudflare Email Workers).
    *   Compose an email with the plain OTP and instructions.

### H. OTP Verification (for Registration, Login, Password Reset) - Step 2

*   **Triggering UI:** OTP Entry Form submission (`src/app/(auth)/verify-otp/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `/api/auth/verify-otp` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives POST with `email`, `otp` (plain text from form), `type` ('register', 'login', 'password_reset').
    2.  **Validate Input:** Zod schema for email and OTP format.
    3.  **Fetch Stored OTP from D1:**
        *   `SELECT otp_id, hashed_otp, otp_salt, expires_at, used_at FROM otp_verifications WHERE email = ? AND type = ? ORDER BY created_at DESC LIMIT 1`.
        *   If no OTP found, or `expires_at` is in the past, or `used_at` IS NOT NULL, return 400 error ("Invalid or expired OTP.").
    4.  **Verify OTP:**
        *   Re-hash the received plain-text `otp` using the fetched `otp_salt`.
        *   Compare with the stored `hashed_otp`. If no match, return 400 error ("Invalid OTP.").
    5.  **Mark OTP as Used:** `UPDATE otp_verifications SET used_at = DATETIME('now') WHERE otp_id = ?`.
    6.  **Perform Action Based on Type:**
        *   **If `type` is 'register':**
            *   Fetch the user record from `user_profiles` by `email`.
            *   Update `user_profiles` table: `SET email_verified_at = DATETIME('now') WHERE email = ?`.
            *   Return 200 OK: "Email verified successfully. Please login."
        *   **If `type` is 'login':**
            *   Fetch user details from `user_profiles` by `email`.
            *   Generate session token/JWT. Store session server-side if needed (e.g., Cloudflare KV).
            *   Set HTTP-only, secure session cookie.
            *   Update `last_login` in `user_profiles`.
            *   Return 200 OK with user data (role, name, etc., to help frontend redirect).
        *   **If `type` is 'password_reset':**
            *   This API should now expect `newPassword` as well.
            *   Validate `newPassword`.
            *   Generate new salt, hash `newPassword`.
            *   Update `hashed_password` and `password_salt` in `user_profiles` for the given `email`.
            *   Return 200 OK: "Password has been reset successfully. You can now login."
    7.  **Error Handling:** Return appropriate error messages for invalid OTP, expired OTP, etc.

---

## II. Business Listing Management (Seller Actions)

This section details the backend processes for sellers creating and managing their business listings. Authentication is required for all these actions, and the `seller_id` (which is the `user_id` of the authenticated seller) from the authenticated session must be used to authorize actions and associate data.

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
        *   Anonymous financial ranges: `annualRevenueRange`, `netProfitMarginRange` (optional).
        *   Actual `askingPrice` (number).
        *   Anonymous deal info: `dealStructureLookingFor` (optional array), `reasonForSellingAnonymous` (optional).
        *   Detailed/Verified info: `businessModel`, `yearEstablished`, `registeredBusinessName`, `businessWebsiteUrl`, `socialMediaLinks`, `numberOfEmployees`, `technologyStack`.
        *   Specific financials: `specificAnnualRevenueLastYear`, `specificNetProfitLastYear`, `financialsExplanation`.
        *   Detailed deal/seller info: `detailedReasonForSelling`, `sellerRoleAndTimeCommitment`, `postSaleTransitionSupport`.
        *   Growth info: `growthPotentialNarrative`, `specificGrowthOpportunities`.
        *   *Note on Document Placeholders:* The form UI has placeholders for file inputs. Actual file upload is a separate multi-step process (See Section VI). The D1 schema for `listings` should have nullable fields for these document URLs/keys (e.g., `financial_documents_url`, `key_metrics_report_url`, `ownership_documents_url`).
    3.  **Validate Input:**
        *   Use the Zod `ListingSchema` to validate the received data.
        *   If validation fails, return a 400 Bad Request error with details.
    4.  **Create Listing Record in D1:**
        *   Generate a unique `listing_id` (e.g., UUID).
        *   Fetch the seller's current `verification_status` from `user_profiles`.
        *   Insert a new record into the `listings` table in D1 with:
            *   `listing_id`, `seller_id` (from authenticated user).
            *   All validated fields from the request. Nullable fields should store NULL if not provided.
            *   Placeholders for document URLs/keys should be `NULL` initially.
            *   `status`: Set to `'ACTIVE_ANONYMOUS'`. (Listings go live anonymously immediately and await optional verification).
            *   `is_seller_verified`: Set to `true` if the `seller_id` from `user_profiles` has `verification_status = 'VERIFIED'`, otherwise `false`.
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
    2.  **Receive Request:** Worker receives a PUT request with the `listingId` in the path and updated listing data in the body (partial `ListingSchema`).
    3.  **Validate Input:**
        *   Use a partial/update version of the Zod `ListingSchema` (all fields optional) to validate any received data.
    4.  **Process Document Updates (Conceptual for R2 - See Section VI):**
        *   If new document URLs/keys are provided (after frontend handles upload to R2 and sends back the key/URL), update these in the D1 record. If document fields are cleared, set them to `NULL`.
    5.  **Update Listing Record in D1:**
        *   Update the specified fields for the given `listing_id` in the `listings` table. Only update fields that are actually present in the request body.
        *   Update `updated_at` timestamp.
        *   If significant content changes are made that might require re-verification by admins (if the listing was previously verified), potentially update `status` to `'PENDING_VERIFICATION'` or add a flag for admin attention. This depends on business rules.
    6.  **Return Success Response:**
        *   Return a 200 OK status with a success message (e.g., "Listing updated successfully.") and the updated listing data.

### C. Deactivate/Reactivate Listing

*   **Triggering UI:** Seller Dashboard -> "My Listings" -> "Deactivate/Reactivate" button.
*   **Next.js API Route Stub (Conceptual):** `/api/listings/[listingId]/status/route.ts` (PUT) or part of the general `PUT /api/listings/[listingId]` with a body like `{ status: 'INACTIVE' }`.
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Seller & Authorize:** (As in "Edit Existing Business Listing").
    2.  **Receive Request:** Worker receives PUT request with `listingId` and desired `new_status` (e.g., `{ new_status: 'INACTIVE' }` or `{ new_status: 'ACTIVE_ANONYMOUS' }`).
    3.  **Validate New Status Transition:**
        *   Fetch the current `status` of the listing from D1.
        *   Ensure the requested `new_status` is a valid transition allowed for a seller (e.g., can toggle between 'ACTIVE_ANONYMOUS'/'VERIFIED_ANONYMOUS'/'VERIFIED_PUBLIC' <-> 'INACTIVE'. Cannot self-approve 'PENDING_VERIFICATION' or 'REJECTED_BY_ADMIN').
        *   If transition is invalid, return 400 Bad Request.
    4.  **Update Listing Status in D1:**
        *   Update the `status` field for the `listingId` in the `listings` table to `new_status`.
        *   Update `updated_at` timestamp.
    5.  **Return Success Response:** 200 OK with success message and the updated listing.

### D. Seller Requests Listing/Profile Verification

*   **Triggering UI:** Seller Dashboard -> "Verification" page, or "Request Verification Call for this Listing" button on "My Listings" page.
*   **Next.js API Route Stub (Conceptual):** `/api/verification-requests/route.ts` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Seller:** Get authenticated `user_id`.
    2.  **Receive Request:** Worker receives POST request with:
        *   `verificationType`: 'PROFILE_SELLER' or 'LISTING'.
        *   `listingId` (conditionally required if `verificationType` is 'LISTING').
        *   `bestTimeToCall` (optional string).
        *   `notes` (optional string).
    3.  **Validate Input:** Use a Zod schema. Check `listingId` if `verificationType` is 'LISTING'.
    4.  **Authorize (if `verificationType` is 'LISTING'):**
        *   If `listingId` is provided, query `listings` table in D1 to ensure the `seller_id` matches the authenticated `user_id`. If not, return 403 Forbidden.
    5.  **Check Current Status & Prevent Redundant Requests:**
        *   If `verificationType` is 'PROFILE_SELLER': Query `user_profiles` for `user_id`. If `verification_status` is already 'PENDING_VERIFICATION' or 'VERIFIED', return 409 Conflict.
        *   If `verificationType` is 'LISTING': Query `listings` for `listing_id`. If `status` is already 'PENDING_VERIFICATION', 'VERIFIED_ANONYMOUS', or 'VERIFIED_PUBLIC', return 409 Conflict.
    6.  **Update Entity Status in D1 (Marks Intent):**
        *   If `verificationType` is 'PROFILE_SELLER': `UPDATE user_profiles SET verification_status = 'PENDING_VERIFICATION', updated_at = DATETIME('now') WHERE user_id = ?`.
        *   If `verificationType` is 'LISTING': `UPDATE listings SET status = 'PENDING_VERIFICATION', updated_at = DATETIME('now') WHERE listing_id = ?`.
    7.  **Create Verification Request Record in D1:**
        *   Insert a new record into a `verification_requests` table in D1 with:
            *   `request_id` (UUID).
            *   `user_id` (seller's ID).
            *   `listing_id` (if `verificationType` is 'LISTING', otherwise `NULL`).
            *   `request_type`: `verificationType`.
            *   `best_time_to_call`, `notes` (sanitized).
            *   `status`: 'NEW_REQUEST'.
            *   `created_at`, `updated_at`.
    8.  **Conceptual: Notify Admin Team:** Adds the request to Admin Panel's "Verification Queue".
    9.  **Return Success Response:** 201 Created with a success message.

---

## III. Marketplace & Buyer Actions

This section outlines the backend processes involved when buyers interact with the marketplace and individual listings.

### A. Fetch All Listings (for `/marketplace`)

*   **Triggering UI:** `/marketplace` page load, filter changes, sorting, pagination.
*   **Next.js API Route Stub (Conceptual):** `/api/listings/route.ts` (GET)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives GET request with optional query parameters: `page?`, `limit?`, `industry?`, `country?`, `revenueRange?`, `maxAskingPrice?`, `keywords?`, `sortBy?`, `sortOrder?`.
    2.  **Validate Query Parameters:** Ensure types and reasonable limits. Sanitize.
    3.  **Determine Requesting Buyer's Status (Conceptual):**
        *   Check if request is from an authenticated buyer (session token/JWT).
        *   If authenticated, retrieve `user_id`, `verification_status`, `is_paid` from session or D1 `user_profiles`. Default to anonymous if no session.
    4.  **Construct SQL Query for D1 (`listings` table):**
        *   **Field Selection:** Always select public anonymous fields (e.g., `listing_id`, `listingTitleAnonymous`, `industry`, `locationCountry`, `SUBSTR(anonymousBusinessDescription, 1, 150) AS description_snippet`, `annualRevenueRange`, `askingPrice` (the number), `imageUrl`, `created_at`). Also select `seller_id` and `is_seller_verified` from `listings`.
        *   **Filtering (`WHERE` clauses):**
            *   Always filter `listings.status` IN `('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC')`.
            *   Apply filters for `industry`, `locationCountry`.
            *   For `revenueRange`, direct string match.
            *   For `maxAskingPrice`, use `listings.askingPrice <= ?`.
            *   For `keywords`, use `WHERE (listingTitleAnonymous LIKE ? OR anonymousBusinessDescription LIKE ?)` with `'%keyword%'`.
        *   **Sorting (`ORDER BY`):** Apply based on `sortBy` (e.g., `listings.created_at`, `listings.askingPrice`) and `sortOrder`.
        *   **Pagination:** Apply `LIMIT ? OFFSET ?`.
    5.  **Execute Query & Fetch Total Count:** Execute main query and a separate `SELECT COUNT(*)` for total.
    6.  **Process Results:** Return only the selected anonymous fields and `is_seller_verified`.
    7.  **Calculate Pagination Details.**
    8.  **Return Success Response:** 200 OK with `{ listings: [...], currentPage, totalPages, totalListings }`.

### B. Fetch Single Listing Details (`/listings/[listingId]`)

*   **Triggering UI:** Navigating to a specific listing detail page.
*   **Next.js API Route Stub (Conceptual):** `/api/listings/[listingId]/route.ts` (GET)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Get `listingId`.
    2.  **Determine Requesting Buyer's Status:** (As in "Fetch All Listings").
    3.  **Fetch Listing and Seller Data from D1:**
        *   `SELECT * FROM listings WHERE listing_id = ?`. If not found or inactive/rejected, return 404.
        *   `SELECT user_id AS seller_user_id, verification_status AS seller_verification_status, is_paid AS seller_is_paid FROM user_profiles WHERE user_id = listings.seller_id`.
    4.  **Construct Response Object (Conditional Data Exposure):**
        *   Include all anonymous fields.
        *   Include `is_seller_verified` from the listing.
        *   **Conditional Verified Data:** If `listing.is_seller_verified` is `true` AND authenticated buyer has `verification_status = 'VERIFIED'` AND `is_paid = true`:
            *   Include all detailed/verified fields from the listing (e.g., `actualCompanyName`, specific financials, `growthPotentialNarrative`, `specificGrowthOpportunities`, document URLs).
            *   Document URLs should point to R2 objects (see Section VI). Frontend might need to fetch these securely if they aren't public R2 URLs.
        *   Otherwise, omit these verified fields.
    5.  **Return Success Response:** 200 OK with the constructed listing object.

### C. Buyer Inquires About Business

*   **Triggering UI:** "Inquire about business" button.
*   **Next.js API Route Stub (Conceptual):** `/api/inquiries/route.ts` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Buyer:** Get `user_id`, `verification_status`, `is_paid`. If not authenticated, return 401/403.
    2.  **Receive Request:** `{ listingId: string, message?: string }`. Validate.
    3.  **Fetch Listing and Seller Details from D1:**
        *   `SELECT seller_id, status AS listing_status, is_seller_verified, listingTitleAnonymous FROM listings WHERE listing_id = ?`. If not active/public, return error.
        *   Fetch seller's `verification_status` from `user_profiles`.
    4.  **Create Inquiry Record in D1:**
        *   Insert into `inquiries` table: `inquiry_id`, `listing_id`, `buyer_id`, `seller_id`, `message` (sanitized), `inquiry_timestamp`, initial `status = 'NEW_INQUIRY'`, and store buyer/seller/listing verification statuses at the time of inquiry.
    5.  **Trigger Notifications & Engagement Flow (Conceptual):**
        *   Notify Seller (in-app/email) about new inquiry.
        *   The subsequent flow (verification prompts for buyer/seller if anonymous, admin notification if both verified) happens after the *Seller engages* (see Section IV.B.5).
    6.  **Return Success Response:** 201 Created.

### D. Buyer Requests Profile Verification

*   **Triggering UI:** Buyer Dashboard -> "Verification" page -> "Request Verification Call".
*   **Next.js API Route Stub (Conceptual):** `/api/verification-requests/route.ts` (POST)
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Authenticate Buyer:** Get `user_id`.
    2.  **Receive Request:** `{ verificationType: 'PROFILE_BUYER', bestTimeToCall?: string, notes?: string }`. Validate.
    3.  **Check Current Status:** If already 'VERIFIED' or 'PENDING_VERIFICATION', return 409.
    4.  **Update User Profile Status in D1:** `UPDATE user_profiles SET verification_status = 'PENDING_VERIFICATION' WHERE user_id = ?`.
    5.  **Create Verification Request Record in D1:** Insert into `verification_requests` (type 'PROFILE_BUYER', status 'NEW_REQUEST').
    6.  **Conceptual: Notify Admin Team.**
    7.  **Return Success Response:** 201 Created.

---

## IV. Dashboard Data Fetching & Actions (Buyer & Seller)

All endpoints require user authentication. `user_id` from session is key.

### A. Buyer Dashboard

1.  **Overview Page (`/dashboard/page.tsx` or `/dashboard/buyer/overview`)**
    *   **Data Needed:** Buyer's name, active inquiry count, verification status, recent inquiries.
    *   **Conceptual API (GET):** `/api/dashboard/buyer/overview`
    *   **D1 Queries:** Fetch from `user_profiles`, `COUNT` from `inquiries` where `buyer_id = ?`, `SELECT` recent inquiries joined with `listings`. Map `inquiries.status` to `statusBuyerPerspective`.
    *   **Return:** Aggregated data.

2.  **My Profile (`/dashboard/profile/page.tsx`)**
    *   **Data Fetching (GET):** `/api/profile` (reusable if contextually aware of role) or `/api/dashboard/buyer/profile`.
        *   **D1 Query:** `SELECT full_name, phone_number, country, email, buyer_persona_type, ... FROM user_profiles WHERE user_id = ?`.
    *   **Profile Update (PUT):** `/api/profile` or `/api/dashboard/buyer/profile`.
        *   **Logic:** Authenticate, validate against buyer `ProfileSchema`, `UPDATE user_profiles SET ... WHERE user_id = ?`.
    *   **Password Change (PUT):** `/api/auth/change-password` (reusable).
        *   **Logic:** Authenticate, validate, verify current password against stored hash, update to new hashed password in D1.

3.  **My Inquiries (`/dashboard/inquiries/page.tsx`)**
    *   **Data Needed:** List of buyer's inquiries with listing title, seller status, inquiry status (buyer perspective).
    *   **Conceptual API (GET):** `/api/inquiries?role=buyer`
    *   **D1 Query:** `SELECT i.*, l.listingTitleAnonymous, l.is_seller_verified, s_profile.verification_status AS seller_platform_verification_status FROM inquiries i JOIN listings l ON i.listing_id = l.listing_id JOIN user_profiles s_profile ON l.seller_id = s_profile.user_id WHERE i.buyer_id = ?`. Map `i.status` to `statusBuyerPerspective`.
    *   **Actions:** "Proceed to Verification" button navigates to verification page, no direct API call.

4.  **Verification (`/dashboard/verification/page.tsx`)**
    *   **Data Needed:** Buyer's current `verification_status`. Fetch via profile API.
    *   **Action: Request Verification (POST):** `/api/verification-requests` (as per Section III.D).

5.  **Notifications (`/dashboard/notifications/page.tsx`)**
    *   **Data Needed:** List of notifications for the buyer.
    *   **Conceptual API (GET):** `/api/notifications?role=buyer`
    *   **D1 Query:** `SELECT * FROM notifications WHERE user_id = ? ORDER BY timestamp DESC`.
    *   **Action: Mark as Read (PUT):** `/api/notifications/[notificationId]/read`
        *   **Logic:** Authenticate, `UPDATE notifications SET is_read = true WHERE notification_id = ? AND user_id = ?`.

### B. Seller Dashboard

1.  **Overview Page (`/seller-dashboard/page.tsx`)**
    *   **Data Needed:** Seller's name, active listing count, total inquiries, inquiries awaiting engagement, verification status, recent active listings.
    *   **Conceptual API (GET):** `/api/seller-dashboard/overview`
    *   **D1 Queries:** Fetch from `user_profiles`, `COUNT` from `listings`, `COUNT` from `inquiries`, `COUNT` inquiries with `status = 'NEW_INQUIRY'`, `SELECT` recent listings with their inquiry counts.
    *   **Return:** Aggregated data.

2.  **My Profile (`/seller-dashboard/profile/page.tsx`)**
    *   **Data Fetching (GET):** `/api/profile` or `/api/seller-dashboard/profile`.
        *   **D1 Query:** `SELECT full_name, phone_number, country, initial_company_name, email FROM user_profiles WHERE user_id = ?`.
    *   **Profile Update (PUT):** `/api/profile` or `/api/seller-dashboard/profile`.
        *   **Logic:** Authenticate, validate against seller `ProfileSchema` (ensure `initialCompanyName` is present), `UPDATE user_profiles SET ... WHERE user_id = ?`.
    *   **Password Change (PUT):** `/api/auth/change-password`.

3.  **My Listings (`/seller-dashboard/listings/page.tsx`)**
    *   **Data Needed:** Seller's listings with title, industry, date, status, inquiry count, `is_seller_verified`.
    *   **Conceptual API (GET):** `/api/listings?seller_id=CURRENT_USER`
    *   **D1 Query:** `SELECT l.*, (SELECT COUNT(*) FROM inquiries WHERE listing_id = l.listing_id) as inquiry_count FROM listings l WHERE seller_id = ? ORDER BY created_at DESC`.
    *   **Actions:**
        *   **Deactivate/Reactivate (PUT):** `/api/listings/[listingId]/status` (as per Section II.C).
        *   **Request Listing Verification (POST):** `/api/verification-requests` (as per Section II.D, type 'LISTING').

4.  **Edit Listing (`/seller-dashboard/listings/[listingId]/edit/page.tsx`)**
    *   **Data Fetching (GET):** `/api/listings/[listingId]` (reuse public GET but with ownership check).
        *   **Logic:** Authenticate, fetch listing, verify `listing.seller_id === user_id`. Return all fields.
    *   **Update Listing (PUT):** `/api/listings/[listingId]` (as per Section II.B).

5.  **My Inquiries (`/seller-dashboard/inquiries/page.tsx`)**
    *   **Data Needed:** Inquiries for seller's listings: date, listing title, buyer name, buyer verification, inquiry status (seller perspective).
    *   **Conceptual API (GET):** `/api/inquiries?role=seller`
    *   **D1 Query:** `SELECT i.*, l.listingTitleAnonymous, u.full_name AS buyer_name, u.verification_status AS buyer_verification_status FROM inquiries i JOIN listings l ON i.listing_id = l.listing_id JOIN user_profiles u ON i.buyer_id = u.user_id WHERE i.seller_id = ?`. Map `i.status` to `statusSellerPerspective`.
    *   **Action: Seller Engages with Inquiry (POST):** `/api/inquiries/[inquiryId]/engage`
        *   **Detailed Backend Worker Logic:**
            1.  Authenticate Seller: Get `user_id`.
            2.  Receive `inquiryId`.
            3.  Fetch inquiry from D1: `SELECT * FROM inquiries WHERE inquiry_id = ?`. Verify ownership (`inquiry.seller_id === user_id`). If status is not 'NEW_INQUIRY', return error (already engaged).
            4.  Fetch buyer's profile: `SELECT verification_status AS buyer_verification_status, is_paid AS buyer_is_paid FROM user_profiles WHERE user_id = inquiry.buyer_id`.
            5.  Fetch seller's listing details: `SELECT status AS listing_status, is_seller_verified FROM listings WHERE listing_id = inquiry.listing_id`.
            6.  Fetch seller's profile: `SELECT verification_status AS seller_verification_status FROM user_profiles WHERE user_id = inquiry.seller_id`.
            7.  **Implement Engagement Flow Logic (Critical):**
                *   Determine next `inquiries.status` and notifications:
                *   If `buyer_verification_status` is 'ANONYMOUS' or 'PENDING_VERIFICATION':
                    *   Update `inquiries.status` to `'SELLER_ENGAGED_BUYER_PENDING_VERIFICATION'`.
                    *   Notify Buyer: "Seller for '[Listing Title]' ready to engage. Please verify your profile. [Link to Buyer Verification]".
                    *   (Conceptual) Add to Admin "Buyer Verification Queue" if not already there or update existing request.
                *   Else if `seller_verification_status` is 'ANONYMOUS' or 'PENDING_VERIFICATION' OR `listings.is_seller_verified` is `false`:
                    *   Update `inquiries.status` to `'SELLER_ENGAGED_SELLER_PENDING_VERIFICATION'`.
                    *   Notify Seller: "You engaged with Buyer for '[Listing Title]'. Your profile/listing needs verification. [Link to Seller Verification]".
                    *   (Conceptual) Add to Admin "Seller/Listing Verification Queue".
                *   Else (Both Buyer is 'VERIFIED' AND (Seller is 'VERIFIED' AND listing `is_seller_verified` is `true`)):
                    *   Update `inquiries.status` to `'READY_FOR_ADMIN_CONNECTION'`.
                    *   Notify Admin: "Engagement for Listing '[Listing Title]' between Buyer [Buyer Name] and Seller [Seller Name] is ready for connection. [Link to Admin Engagement Queue]".
                    *   Notify Buyer & Seller: "Both parties verified and engaged. Admin will facilitate connection."
            8.  Update `inquiries` table in D1: set new `status`, set `engagement_timestamp = DATETIME('now')`.
            9.  Return updated inquiry data or success message.

6.  **Verification (`/seller-dashboard/verification/page.tsx`)**
    *   **Data Needed:** Seller's `verification_status`, list of their anonymous/unverified listings.
    *   **Conceptual API (GET):** `/api/seller-dashboard/verification-data`
        *   **D1 Queries:** `SELECT verification_status FROM user_profiles WHERE user_id = ?`. `SELECT listing_id, listingTitleAnonymous, status, is_seller_verified FROM listings WHERE seller_id = ? AND (status IN ('ACTIVE_ANONYMOUS', 'PENDING_VERIFICATION') OR is_seller_verified = false)`.
    *   **Action: Request Verification (POST):** `/api/verification-requests` (as per Section II.D, type 'PROFILE_SELLER' or 'LISTING').

7.  **Notifications (`/seller-dashboard/notifications/page.tsx`)**
    *   **Data Needed:** List of notifications for the seller.
    *   **Conceptual API (GET):** `/api/notifications?role=seller` (Same as Buyer, but for `seller_id`).
    *   **Action: Mark as Read (PUT):** `/api/notifications/[notificationId]/read` (Same as Buyer).

---

## V. Admin Panel Backend Logic

All Admin APIs require ADMIN role authentication. Audit logging is crucial.

### General for all Admin APIs:

*   **Authentication/Authorization:** Every Admin API route MUST:
    1.  Verify authenticated user.
    2.  Fetch user's role from D1 `user_profiles`. If not 'ADMIN', return 403 Forbidden.
*   **Audit Logging (Conceptual):** Insert into an `audit_logs` table in D1 for significant write ops (admin_user_id, action, target_entity_type, target_entity_id, timestamp, details_before/after).

### A. User Management

1.  **List Users (`/api/admin/users` - GET)**
    *   **D1 Query:** `SELECT user_id, full_name, email, role, verification_status, is_paid, created_at, last_login, (SELECT COUNT(*) FROM listings WHERE seller_id = up.user_id) AS listing_count, (SELECT COUNT(*) FROM inquiries WHERE buyer_id = up.user_id) AS inquiry_count FROM user_profiles up`. Apply filters (role, verification, paid, search) and pagination.
    *   Return paginated user list.

2.  **View User Details (`/api/admin/users/[userId]` - GET)**
    *   **D1 Query:** `SELECT * FROM user_profiles WHERE user_id = ?`. Return all profile data, including buyer persona fields.

3.  **Update User Verification/Paid Status (`/api/admin/users/[userId]/status` - PUT)**
    *   **Logic:** Receive `userId`, `new_verification_status?`, `new_is_paid?`. Validate. `UPDATE user_profiles SET verification_status = COALESCE(?, verification_status), is_paid = COALESCE(?, is_paid), updated_at = DATETIME('now') WHERE user_id = ?`. Log. Notify user.

4.  **Admin Edit User Profile Details (`/api/admin/users/[userId]/profile` - PUT)**
    *   **Logic:** Receive `userId` and fields to update. Validate. `UPDATE user_profiles SET ... WHERE user_id = ?`. Log.

5.  **Admin Send Password Reset OTP (`/api/admin/users/[userId]/send-reset-otp` - POST)**
    *   **Logic:** Receive `userId`. Fetch user's email. Generate and send OTP (type 'PASSWORD_RESET', see I.G). Log.

6.  **Delete User (`/api/admin/users/[userId]` - DELETE)**
    *   **Logic:** Receive `userId`.
        *   Soft delete: `UPDATE user_profiles SET is_deleted = true, deleted_at = DATETIME('now') WHERE user_id = ?`.
        *   Consider deactivating associated listings and handling inquiries.
        *   Log admin action.

### B. Listing Management

1.  **List All Listings (`/api/admin/listings` - GET)**
    *   **D1 Query:** `SELECT l.*, u.full_name as seller_name, u.is_paid as seller_is_paid, u.verification_status as seller_verification_status FROM listings l JOIN user_profiles u ON l.seller_id = u.user_id`. Apply filters (industry, seller, status, search) and pagination.
    *   Return paginated listings.

2.  **View Full Listing Details (Admin) (`/api/admin/listings/[listingId]` - GET)**
    *   **D1 Query:** `SELECT * FROM listings WHERE listing_id = ?`. Join with seller `user_profiles` for seller details. Return ALL listing fields.

3.  **Update Listing Status (Admin) (`/api/admin/listings/[listingId]/status` - PUT)**
    *   **Logic:** Receive `listingId`, `new_status` (e.g., 'VERIFIED_PUBLIC', 'REJECTED_BY_ADMIN'), `rejection_reason?`. Validate.
    *   `UPDATE listings SET status = ?, updated_at = DATETIME('now') WHERE listing_id = ?`.
    *   If `new_status` is 'VERIFIED_PUBLIC' or 'VERIFIED_ANONYMOUS', also set `listings.is_seller_verified = true`.
    *   If 'REJECTED_BY_ADMIN', store `rejection_reason` (e.g., in `listings.admin_notes` or separate log).
    *   Log. Notify seller.

### C. Verification Queues

1.  **Fetch Buyer Verification Queue (`/api/admin/verification-requests?type=PROFILE_BUYER` - GET)**
    *   **D1 Query:** `SELECT vr.*, u.full_name AS user_name, u.email AS user_email, u.buyer_persona_type FROM verification_requests vr JOIN user_profiles u ON vr.user_id = u.user_id WHERE vr.request_type = 'PROFILE_BUYER' AND vr.status NOT IN ('Approved', 'Rejected') ORDER BY vr.created_at ASC`. Paginate.

2.  **Fetch Seller/Listing Verification Queue (`/api/admin/verification-requests?type=LISTING` or `type=PROFILE_SELLER` - GET)**
    *   **D1 Query:** `SELECT vr.*, u.full_name AS user_name, u.email AS user_email, l.listingTitleAnonymous FROM verification_requests vr JOIN user_profiles u ON vr.user_id = u.user_id LEFT JOIN listings l ON vr.listing_id = l.listing_id WHERE vr.request_type IN ('LISTING', 'PROFILE_SELLER') AND vr.status NOT IN ('Approved', 'Rejected') ORDER BY vr.created_at ASC`. Paginate.

3.  **Update Verification Request Status (`/api/admin/verification-requests/[requestId]/status` - PUT)**
    *   **Logic:** Receive `requestId`, `new_queue_status` (e.g., 'Contacted', 'Docs Under Review', 'Approved', 'Rejected'), `admin_notes?`. Validate.
    *   Fetch `verification_requests` record to get `user_id`, `listing_id`, `request_type`.
    *   `UPDATE verification_requests SET status = ?, admin_notes = ?, updated_at = DATETIME('now') WHERE request_id = ?`.
    *   **If `new_queue_status` is 'Approved':**
        *   If `request_type` is 'PROFILE_BUYER' or 'PROFILE_SELLER': `UPDATE user_profiles SET verification_status = 'VERIFIED', updated_at = DATETIME('now') WHERE user_id = ?`.
        *   If `request_type` is 'LISTING': `UPDATE listings SET status = 'VERIFIED_ANONYMOUS' (or 'VERIFIED_PUBLIC'), is_seller_verified = true, updated_at = DATETIME('now') WHERE listing_id = ?`.
    *   Log. Notify user.

### D. Engagement Queue

1.  **Fetch Engagements Ready for Connection (`/api/admin/engagements` or `/api/admin/inquiries?status=ready_for_admin_connection` - GET)**
    *   **D1 Query:** `SELECT i.*, buyer.full_name AS buyer_name, buyer.verification_status AS buyer_verification, seller.full_name AS seller_name, seller.verification_status AS seller_verification, l.listingTitleAnonymous, l.status AS listing_status, l.is_seller_verified FROM inquiries i JOIN user_profiles buyer ON i.buyer_id = buyer.user_id JOIN user_profiles seller ON i.seller_id = seller.user_id JOIN listings l ON i.listing_id = l.listing_id WHERE i.status = 'READY_FOR_ADMIN_CONNECTION' ORDER BY i.engagement_timestamp ASC`. Paginate.

2.  **Update Engagement Status (Mark as Connection Facilitated) (`/api/admin/engagements/[inquiryId]/status` - PUT)**
    *   **Logic:** Receive `inquiryId`, `new_status` (should be 'CONNECTION_FACILITATED'). Validate.
    *   `UPDATE inquiries SET status = 'CONNECTION_FACILITATED', updated_at = DATETIME('now') WHERE inquiry_id = ?`.
    *   Log. Notify buyer and seller.

### E. Analytics Data Aggregation

*   **User Metrics:**
    *   Total Users, Seller vs Buyer counts: `SELECT role, COUNT(*) FROM user_profiles GROUP BY role`.
    *   Paid/Free Breakdown: `SELECT role, is_paid, COUNT(*) FROM user_profiles GROUP BY role, is_paid`.
    *   Verification Status: `SELECT role, verification_status, COUNT(*) FROM user_profiles GROUP BY role, verification_status`.
*   **Listing Metrics:**
    *   Total Listings by Status: `SELECT status, COUNT(*) FROM listings GROUP BY status`.
    *   Listings by Industry: `SELECT industry, COUNT(*) FROM listings WHERE status IN ('ACTIVE_ANONYMOUS', 'VERIFIED_ANONYMOUS', 'VERIFIED_PUBLIC') GROUP BY industry`.
    *   Listings by Asking Price (Ranges for reporting): Requires bucketing `listings.askingPrice` values.
*   **Engagement/Deal Flow:**
    *   Total Inquiries by Status: `SELECT status, COUNT(*) FROM inquiries GROUP BY status`.
    *   Successful Connections MTD: `SELECT COUNT(*) FROM inquiries WHERE status = 'CONNECTION_FACILITATED' AND engagement_timestamp >= [start_of_month_D1_syntax]`.
*   **Revenue Metrics (Conceptual - requires payment/subscription table in D1):**
    *   Total Revenue MTD: `SELECT SUM(amount) FROM subscriptions WHERE transaction_date >= [start_of_month_D1_syntax]`.
    *   Revenue by Buyer/Seller: Join `subscriptions` with `user_profiles` on `user_id`, then `SUM(amount) GROUP BY user_profiles.role`.

---

## VI. File Upload Handling (Conceptual for R2)

This section details the intended multi-step process for handling file uploads from the frontend (e.g., Seller's "Create Listing Form") to Cloudflare R2, and then linking these files to records in Cloudflare D1.

1.  **Step 1: Frontend Requests Pre-signed URL for Upload**
    *   **Triggering UI:** User selects a file in an `<input type="file">`.
    *   **Frontend Action:** Makes API request (e.g., `POST /api/upload/generate-signed-url`).
    *   **Request Body:** `filename: string`, `contentType: string`, `context: 'listing_document' | 'profile_verification'`, `listingId?: string`, `documentType?: string` (e.g., 'financial_statement', 'id_proof').
    *   **Next.js API Route Stub (Conceptual):** `/api/upload/generate-signed-url/route.ts` (POST)

2.  **Step 2: Backend Worker Generates Pre-signed R2 URL**
    *   **Backend Worker Logic (Cloudflare Worker):**
        1.  **Authenticate User & Authorize:** Verify user and permissions for the upload context.
        2.  **Validate Request Body.**
        3.  **Construct R2 Object Key:** Generate a unique, secure key/path (e.g., `users/${user_id}/listings/${listingId}/documents/${documentType}/${uuidv4()}-${sanitized_filename}`).
        4.  **Use Cloudflare R2 SDK:** Call R2 binding's method to generate a pre-signed URL for `PUT` operation, specifying bucket, object key, expiry, content type.
        5.  **Return Success Response:** 200 OK with `{ signedUrl: string, objectKey: string }`.

3.  **Step 3: Frontend Uploads File Directly to R2**
    *   **Frontend Action:** Uses `fetch` API to `PUT` the file to the `signedUrl` with matching `Content-Type`.

4.  **Step 4: Frontend Notifies Backend of Successful Upload to Link File**
    *   **Frontend Action (after R2 upload success):** Makes API request (e.g., `POST /api/listings/[listingId]/documents`).
    *   **Request Body:** `documentType: string`, `fileKey: string` (R2 objectKey), `originalFilename: string`, `fileSize?: number`, `contentType?: string`.
    *   **Next.js API Route Stub (Conceptual):** `/api/listings/[listingId]/documents/route.ts` (POST) or `/api/profile/documents/route.ts` (POST).

5.  **Step 5: Backend Worker Updates D1 Database with File Reference**
    *   **Backend Worker Logic (Cloudflare Worker):**
        1.  **Authenticate User & Authorize.**
        2.  **Validate Request Body.**
        3.  **Update D1 Database:**
            *   For listings: `UPDATE listings SET [relevant_document_url_field] = ? WHERE listing_id = ? AND seller_id = ?`. The specific field depends on `documentType`.
            *   For profile verification: Update `user_profiles` or a separate `user_verification_documents` table.
        4.  **Return Success Response:** 200 OK.

    