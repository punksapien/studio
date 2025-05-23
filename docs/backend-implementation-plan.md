
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
*   **Next.js API Route Stub (Conceptual):** `POST /api/auth/register/seller/route.ts`
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
*   **Next.js API Route Stub (Conceptual):** `POST /api/auth/register/buyer/route.ts`
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
*   **Next.js API Route Stub (Conceptual):** `POST /api/auth/login/route.ts`
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives POST request with `email` and `password`.
    2.  **Validate Input:** Use Zod schema (`LoginSchema`). Return 400 if invalid.
    3.  **Fetch User from D1:**
        *   Query `user_profiles` table: `SELECT user_id, hashed_password, password_salt, role, verification_status, is_paid, full_name, email_verified FROM user_profiles WHERE email = ?`.
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

*   **Triggering UI:** Logout button (e.g., in User Dashboards, potentially main Navbar if user is logged in).
*   **Next.js API Route Stub (Conceptual):** `POST /api/auth/logout/route.ts`
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
*   **Next.js API Route Stub (Conceptual):** `POST /api/auth/forgot-password/route.ts`
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
*   **Next.js API Route Stub (Conceptual):** `POST /api/auth/reset-password/route.ts`
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

*   **Triggering UI:** Seller Dashboard -> "Create New Listing" form submission (`src/app/seller-dashboard/listings/create/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `POST /api/listings/route.ts`
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives a POST request with all listing data:
        *   `listingTitleAnonymous`, `industry`, `locationCountry`, `locationCityRegionGeneral`.
        *   `anonymousBusinessDescription`, `keyStrengthsAnonymous` (array).
        *   `businessModel`, `yearEstablished`, `registeredBusinessName`, `businessWebsiteUrl`, `socialMediaLinks`, `numberOfEmployees`, `technologyStack`.
        *   `annualRevenueRange`, `netProfitMarginRange`, `askingPriceRange`.
        *   `specificAnnualRevenueLastYear`, `specificNetProfitLastYear`, `financialsExplanation`.
        *   `dealStructureLookingFor` (array), `reasonForSellingAnonymous`, `detailedReasonForSelling`.
        *   `sellerRoleAndTimeCommitment`, `postSaleTransitionSupport`.
        *   `growthPotentialNarrative`, `specificGrowthOpportunities`.
        *   Placeholders for document names/keys if a pre-signed URL upload flow is used for `financialDocumentsUrl`, `keyMetricsReportUrl`, `ownershipDocumentsUrl`.
    2.  **Authenticate Seller:** Verify the request is from an authenticated seller and retrieve their `user_id` (this will be the `seller_id` for the listing).
    3.  **Validate Input:**
        *   Use the Zod schema (`ListingSchema` from the create listing page) to validate the received data.
        *   If validation fails, return a 400 Bad Request error with details.
    4.  **Process Document Placeholders (Conceptual for R2):**
        *   If the request includes references to files already uploaded to R2 (e.g., via a pre-signed URL flow handled by the client prior to this API call), store these R2 object keys/paths.
        *   If direct file upload to this worker is intended (less ideal for serverless, but possible for small files), handle `multipart/form-data`, upload to R2, and get the R2 object keys/paths.
    5.  **Create Listing Record in D1:**
        *   Generate a unique `listing_id` (e.g., UUID).
        *   Insert a new record into the `listings` table in D1 with:
            *   `listing_id`, `seller_id` (from authenticated user).
            *   All validated fields from the request.
            *   Document URLs/keys for `financialDocumentsUrl`, `keyMetricsReportUrl`, `ownershipDocumentsUrl` (pointing to R2 locations).
            *   `status`: Set to `'PENDING_ADMIN_REVIEW'` or `'ACTIVE_ANONYMOUS'` (depending on platform policy).
            *   `is_seller_verified`: This should reflect the current verification status of the `seller_id` from the `user_profiles` table.
            *   `created_at`, `updated_at`: Current UTC timestamps.
    6.  **Return Success Response:**
        *   Return a 201 Created status with a success message (e.g., "Listing created successfully and is pending review.") and the new `listing_id`.

### B. Edit Existing Business Listing

*   **Triggering UI:** Seller Dashboard -> "My Listings" -> "Edit Listing" button (`src/app/seller-dashboard/listings/[listingId]/edit/page.tsx`).
*   **Next.js API Route Stub (Conceptual):** `PUT /api/listings/[listingId]/route.ts`
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives a PUT request with the `listingId` in the path and updated listing data in the body.
    2.  **Authenticate Seller:** Verify the request is from an authenticated seller and retrieve their `user_id`.
    3.  **Authorize Seller:** Query the `listings` table in D1: `SELECT seller_id FROM listings WHERE listing_id = ?`.
        *   If listing not found, return 404.
        *   If `seller_id` from listing does not match authenticated `user_id`, return 403 Forbidden (not owner).
    4.  **Validate Input:**
        *   Use a partial/update version of the Zod `ListingSchema` (all fields optional) to validate the received data.
    5.  **Process Document Updates (Conceptual for R2):**
        *   If new document placeholders are provided, handle potential new uploads to R2 (e.g., via pre-signed URLs generated on client or a separate upload endpoint).
        *   If existing documents are meant to be removed, this might involve deleting objects from R2 (or just removing their reference from D1).
    6.  **Update Listing Record in D1:**
        *   Update the specified fields for the given `listing_id` in the `listings` table.
        *   Update `updated_at` timestamp.
        *   If significant content changes are made that require re-verification, potentially update `status` to `'PENDING_ADMIN_REVIEW'`.
    7.  **Return Success Response:**
        *   Return a 200 OK status with a success message (e.g., "Listing updated successfully.") and the updated listing data.

### C. Deactivate/Reactivate Listing

*   **Triggering UI:** Seller Dashboard -> "My Listings" -> "Deactivate/Reactivate" button.
*   **Next.js API Route Stub (Conceptual):** `PUT /api/listings/[listingId]/status/route.ts` (or a more generic update endpoint).
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives PUT request with `listingId` and desired new status (e.g., `{ status: 'INACTIVE' }` or `{ status: 'ACTIVE_ANONYMOUS' }`).
    2.  **Authenticate Seller:** Verify authenticated seller and get `user_id`.
    3.  **Authorize Seller:** Verify ownership of the `listingId` as in "Edit Listing."
    4.  **Validate New Status:** Ensure the new status is a valid transition (e.g., can't reactivate a 'REJECTED' listing without admin action).
    5.  **Update Listing Status in D1:**
        *   Update the `status` field for the `listingId` in the `listings` table.
        *   Update `updated_at` timestamp.
    6.  **Return Success Response:** 200 OK with success message.

### D. Seller Requests Listing Verification

*   **Triggering UI:** Seller Dashboard -> "Verification" page, or "Request Verification Call for this Listing" button on "My Listings" page.
*   **Next.js API Route Stub (Conceptual):** `POST /api/verification-requests/route.ts` (with type 'listing') or `POST /api/listings/[listingId]/request-verification/route.ts`.
*   **Detailed Backend Worker Logic (Step-by-Step):**
    1.  **Receive Request:** Worker receives request with `listingId` (if verifying specific listing), `bestTimeToCall` (optional), `notes` (optional). Requires authenticated seller `user_id`.
    2.  **Authenticate Seller:** Get `user_id`.
    3.  **Authorize (if specific listing):** If `listingId` is provided, verify the authenticated seller owns this listing.
    4.  **Update Listing Status (if specific listing):**
        *   If `listingId` is provided, query the `listings` table in D1.
        *   If listing status is already 'VERIFIED_PUBLIC', 'VERIFIED_ANONYMOUS', or 'PENDING_VERIFICATION', return appropriate message (e.g., "Listing is already verified or pending verification.").
        *   Update `listings.status` to `'PENDING_VERIFICATION'`.
    5.  **Create Verification Request Record in D1:**
        *   Insert a new record into a `verification_requests` table with:
            *   `request_id` (UUID).
            *   `user_id` (seller's ID).
            *   `listing_id` (if applicable).
            *   `request_type`: 'LISTING_VERIFICATION' (or 'PROFILE_VERIFICATION' if general).
            *   `best_time_to_call`, `notes`.
            *   `status`: 'NEW_REQUEST'.
            *   `created_at`, `updated_at`.
    6.  **Conceptual: Notify Admin Team:** Trigger an internal mechanism (e.g., add to an admin task queue, send an email to admin group) about the new verification request. This is managed by the Admin Panel.
    7.  **Return Success Response:** 201 Created with a success message (e.g., "Verification request submitted. Our team will contact you.").

---
