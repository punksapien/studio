
# API Route Specifications (Intended)

This document outlines the specifications for the Next.js API routes that are *intended* to be implemented for the BizMatch Asia platform. Currently, these routes are conceptual placeholders based on frontend form submissions and actions; their backend logic needs full development.

**Base Path:** `/api` (e.g., a route handler would be at `src/app/api/auth/register/route.ts`)

## 1. Authentication Routes (`/api/auth/*`)

### 1.1. Buyer Registration
*   **File Path (Intended):** `src/app/api/auth/register/buyer/route.ts`
*   **HTTP Method:** `POST`
*   **Purpose:** Registers a new buyer user.
*   **Request Body Schema:** (Refers to `BuyerRegisterSchema` from `/app/auth/register/buyer/page.tsx`)
    *   `fullName: string`
    *   `email: string` (unique)
    *   `password: string`
    *   `phoneNumber: string`
    *   `country: string`
    *   `buyerPersonaType: BuyerPersona`
    *   `buyerPersonaOther?: string` (required if `buyerPersonaType` is "Other")
    *   `investmentFocusDescription?: string`
    *   `preferredInvestmentSize?: PreferredInvestmentSize`
    *   `keyIndustriesOfInterest?: string`
*   **Success Response (201 Created):**
    ```json
    {
      "success": true,
      "message": "Buyer registered successfully. Please check your email to verify your account.",
      "userId": "<clerk_user_id>"
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Validation failed (e.g., missing fields, invalid email).
        ```json
        { "success": false, "error": "Validation failed", "details": { /* Zod error issues */ } }
        ```
    *   `409 Conflict`: Email already exists.
        ```json
        { "success": false, "error": "Email address already in use." }
        ```
    *   `500 Internal Server Error`: Clerk or Supabase error during user creation.
        ```json
        { "success": false, "error": "Failed to create user. Please try again later." }
        ```
*   **Intended Backend Logic (Clerk & Supabase):**
    1.  **Validation:** Parse and validate the request body using `BuyerRegisterSchema`. If invalid, return 400.
    2.  **Email Check (Supabase):** Query `user_profiles` table in Supabase to check if `email` already exists. If so, return 409.
    3.  **User Creation (Clerk):** Call `clerkClient.users.createUser()` with `emailAddress`, `password`, `firstName` (from `fullName`), `lastName` (from `fullName`).
    4.  **Profile Creation (Supabase):** On successful Clerk user creation, insert a new record into `user_profiles` table:
        *   `id`: Use Clerk User ID.
        *   `clerk_user_id`: Store Clerk User ID.
        *   `full_name`, `email`, `phone_number`, `country`.
        *   `role`: 'buyer'.
        *   `verification_status`: 'anonymous'.
        *   `is_paid`: `false`.
        *   All buyer persona fields: `buyer_persona_type`, `buyer_persona_other`, etc.
        *   `created_at`, `updated_at`: Current timestamps.
    5.  **Email Verification (Clerk):** Ensure Clerk's email verification flow is triggered for the new user (often default Clerk behavior).
    6.  **Response:** Return 201 success with user ID. Log any Clerk or Supabase errors and return 500 if they occur.

### 1.2. Seller Registration
*   **File Path (Intended):** `src/app/api/auth/register/seller/route.ts`
*   **HTTP Method:** `POST`
*   **Purpose:** Registers a new seller user.
*   **Request Body Schema:** (Refers to `SellerRegisterSchema` from `/app/auth/register/seller/page.tsx`)
    *   `fullName: string`
    *   `email: string` (unique)
    *   `password: string`
    *   `phoneNumber: string`
    *   `country: string`
    *   `initialCompanyName?: string`
*   **Success/Error Responses:** Similar structure to Buyer Registration.
*   **Intended Backend Logic (Clerk & Supabase):**
    1.  **Validation:** Validate against `SellerRegisterSchema`.
    2.  **Email Check (Supabase):** Check `user_profiles` for existing email.
    3.  **User Creation (Clerk):** Create user in Clerk.
    4.  **Profile Creation (Supabase):** Insert into `user_profiles`:
        *   `id` (Clerk User ID), `clerk_user_id`.
        *   `full_name`, `email`, `phone_number`, `country`.
        *   `role`: 'seller'.
        *   `initial_company_name` (if provided).
        *   `verification_status`: 'anonymous', `is_paid`: `false`.
        *   `created_at`, `updated_at`.
    5.  **Email Verification (Clerk):** Trigger Clerk email verification.
    6.  **Response:** Return appropriate success/error.

### 1.3. User Login
*   **Note:** This is primarily handled by Clerk's hosted pages or UI components (`<SignIn />`). A custom API is generally not needed unless specific pre/post login actions are required. If a custom API is built:
*   **File Path (Intended, if custom):** `src/app/api/auth/login/route.ts`
*   **HTTP Method:** `POST`
*   **Request Body Schema:** (Refers to `LoginSchema` from `/app/auth/login/page.tsx`)
    *   `email: string`
    *   `password: string`
*   **Success Response (200 OK, if custom and not redirecting):**
    ```json
    { "success": true, "message": "Login successful.", "user": { /* basic user info, session token if needed */ } }
    ```
*   **Intended Backend Logic (Clerk & Supabase):**
    1.  **(TODO)** Use Clerk SDK to attempt sign-in (`clerkClient.signIn.create`, `attemptFirstFactor`).
    2.  **(TODO)** On successful Clerk sign-in, retrieve the Clerk `userId`.
    3.  **(TODO)** Update `last_login` timestamp in Supabase `user_profiles` table for the `userId`.
    4.  **(TODO)** Clerk typically handles session creation and redirects. If custom, return session info or success.

### 1.4. Forgot Password
*   **Note:** This is primarily handled by Clerk's hosted pages or UI components.
*   **File Path (Intended, if custom):** `src/app/api/auth/forgot-password/route.ts`
*   **Request Body Schema:** (Refers to `ForgotPasswordSchema` from `/app/auth/forgot-password/page.tsx`)
    *   `email: string`
*   **Intended Backend Logic (Clerk):**
    1.  **(TODO)** Validate email.
    2.  **(TODO)** Use Clerk SDK to trigger a password reset email for the given email address.

## 2. User Profile Routes (`/api/profile/*`)

### 2.1. Update User Profile
*   **File Path (Intended):** `src/app/api/profile/route.ts`
*   **HTTP Method:** `PUT`
*   **Purpose:** Updates the current logged-in user's profile information.
*   **Request Body Schema:** (Refers to `ProfileSchema` from buyer/seller profile pages)
    *   `fullName: string`
    *   `phoneNumber: string`
    *   `country: string`
    *   `initialCompanyName?: string` (for sellers)
    *   `buyerPersonaType?: BuyerPersona`
    *   `buyerPersonaOther?: string`
    *   `investmentFocusDescription?: string`
    *   `preferredInvestmentSize?: PreferredInvestmentSize`
    *   `keyIndustriesOfInterest?: string`
*   **Success Response (200 OK):**
    ```json
    { "success": true, "message": "Profile updated successfully.", "user": { /* updated user profile data from Supabase */ } }
    ```
*   **Intended Backend Logic (Clerk & Supabase):**
    1.  **(TODO)** Authenticate user via Clerk: Get `auth().userId`. If no user, return 401.
    2.  **(TODO)** Validate request body against `ProfileSchema` (ensure role matches fields).
    3.  **(TODO)** Update corresponding fields in Supabase `user_profiles` table for the `userId`.
    4.  **(TODO)** If `fullName` changed, consider updating in Clerk: `clerkClient.users.updateUser(userId, { firstName, lastName })`.
    5.  **(TODO)** Return the updated user profile data fetched from Supabase.

### 2.2. Change Password
*   **File Path (Intended):** `src/app/api/password/route.ts`
*   **HTTP Method:** `PUT`
*   **Purpose:** Changes the current logged-in user's password.
*   **Request Body Schema:** (Refers to `PasswordChangeSchema` from profile pages)
    *   `currentPassword: string`
    *   `newPassword: string`
*   **Success Response (200 OK):**
    ```json
    { "success": true, "message": "Password updated successfully." }
    ```
*   **Intended Backend Logic (Clerk):**
    1.  **(TODO)** Authenticate user via Clerk: Get `auth().userId`.
    2.  **(TODO)** Validate request body.
    3.  **(TODO)** Use Clerk SDK: `clerkClient.users.updateUser(userId, { password: newPassword, oldPassword: currentPassword })`. Clerk handles current password verification.
    4.  **(TODO)** Return success or error based on Clerk's response.

## 3. Listing Routes (`/api/listings/*`)

### 3.1. Create Listing
*   **File Path (Intended):** `src/app/api/listings/route.ts` (for POST)
*   **HTTP Method:** `POST`
*   **Purpose:** Creates a new business listing for the authenticated seller.
*   **Request Body Schema:** (Refers to `ListingSchema` from `/app/seller-dashboard/listings/create/page.tsx`)
*   **Success Response (201 Created):**
    ```json
    { "success": true, "message": "Listing created successfully.", "listing": { /* created listing data */ } }
    ```
*   **Intended Backend Logic (Clerk & Supabase):**
    1.  **(TODO)** Authenticate user (Clerk `auth().userId`). Verify user role is 'seller'.
    2.  **(TODO)** Validate request body against `ListingSchema`.
    3.  **(TODO)** Insert new listing into Supabase `listings` table, with `seller_id = auth().userId`.
    4.  **(TODO)** Set initial `status` (e.g., 'active' or 'pending_verification') and `is_seller_verified` (based on the seller's current profile status).
    5.  **(TODO) File Uploads:** For document fields (e.g., `financialDocumentsUrl`), handle file uploads to Supabase Storage. Generate unique filenames. Store the public URLs in the `listings` table. This requires `multipart/form-data` handling.
    6.  **(TODO)** Return the created listing data.

### 3.2. Get Listings (Marketplace)
*   **File Path (Intended):** `src/app/api/listings/route.ts` (for GET)
*   **HTTP Method:** `GET`
*   **Purpose:** Fetches listings for the public marketplace with filtering, sorting, and pagination.
*   **Query Parameters:** `page?`, `limit?`, `industry?`, `country?`, `revenueRange?`, `priceRange?`, `keywords?`, `sortBy?`, `sortOrder?`
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "listings": [ /* array of listing objects - only anonymous fields + seller verification status */ ],
      "totalPages": 10,
      "currentPage": 1,
      "totalListings": 95
    }
    ```
*   **Intended Backend Logic (Supabase):**
    1.  **(TODO)** Parse and validate query parameters.
    2.  **(TODO)** Construct Supabase query to fetch `listings` where `status` is 'active', 'verified_anonymous', or 'verified_public'.
    3.  **(TODO)** Implement filtering logic based on query parameters (e.g., `industry` IN (...), `country` = ..., range checks for financial fields). Keyword search might use `ILIKE` or full-text search.
    4.  **(TODO)** Implement sorting.
    5.  **(TODO)** Implement pagination using `offset` and `limit`.
    6.  **(TODO)** Select only fields suitable for anonymous public display (e.g., `listingTitleAnonymous`, `industry`, `locationCountry`, `annualRevenueRange`, `askingPriceRange`, `anonymousBusinessDescription` snippet, `imageUrl`, `is_seller_verified`, `created_at`).
    7.  **(TODO)** Join with `user_profiles` on `seller_id` to get `is_seller_verified` for the badge.

### 3.3. Get Single Listing (Public Detail)
*   **File Path (Intended):** `src/app/api/listings/[listingId]/route.ts`
*   **HTTP Method:** `GET`
*   **Purpose:** Fetches details for a single listing, conditionally showing verified information.
*   **Success Response (200 OK):**
    ```json
    { "success": true, "listing": { /* listing data, potentially including verified fields */ } }
    ```
*   **Intended Backend Logic (Clerk & Supabase):**
    1.  **(TODO)** Extract `listingId`.
    2.  **(TODO)** Fetch listing from Supabase `listings`. If not found or not active/verified, return 404.
    3.  **(TODO)** Fetch associated seller's `user_profiles` record.
    4.  **(TODO)** Get current authenticated user's ID, `verification_status`, and `is_paid` (from Clerk `auth()` and Supabase `user_profiles`).
    5.  **(TODO)** Construct the response object. If the listing's seller (`seller.is_verified`) is true AND the current viewing buyer is also verified (`currentUser.verification_status === 'verified'`) AND paid (`currentUser.is_paid === true`), then include all detailed/verified fields from the listing (e.g., `actualCompanyName`, specific financials, document URLs, `potentialForGrowthNarrative`, `specificGrowthOpportunities`). Otherwise, only include anonymous fields.
    6.  **(TODO)** Return listing data.

### 3.4. Update Listing (Seller)
*   **File Path (Intended):** `src/app/api/listings/[listingId]/route.ts`
*   **HTTP Method:** `PUT`
*   **Purpose:** Allows an authenticated seller to update their own listing.
*   **Request Body Schema:** (Partial `ListingSchema`, all fields optional for update)
*   **Intended Backend Logic (Clerk & Supabase):**
    1.  **(TODO)** Authenticate seller (`auth().userId`).
    2.  **(TODO)** Fetch listing from Supabase by `listingId`. Verify `listing.seller_id === auth().userId`. If not owner, return 403.
    3.  **(TODO)** Validate request body against a partial/update version of `ListingSchema`.
    4.  **(TODO)** Update the listing in Supabase `listings` table.
    5.  **(TODO) File Updates:** Handle potential updates or deletions of associated files in Supabase Storage.
    6.  **(TODO)** Return updated listing data.

## 4. Inquiry Routes (`/api/inquiries/*`)

### 4.1. Create Inquiry
*   **File Path (Intended):** `src/app/api/inquiries/route.ts` (for POST)
*   **HTTP Method:** `POST`
*   **Request Body:** `{ "listingId": "string", "message"?: "string" }`
*   **Success Response (201 Created):**
    ```json
    { "success": true, "message": "Inquiry submitted.", "inquiry": { /* created inquiry data */ } }
    ```
*   **Intended Backend Logic (Clerk & Supabase):**
    1.  **(TODO)** Authenticate buyer (`auth().userId`).
    2.  **(TODO)** Validate `listingId`. Fetch the listing to get `seller_id`.
    3.  **(TODO)** Create a new record in Supabase `inquiries` table: `buyer_id`, `listing_id`, `seller_id`, `inquiry_timestamp`, initial `status = 'new_inquiry'`, `message` (if provided).
    4.  **(TODO) Notification System:** Trigger notification to the seller.
    5.  **(TODO)** Return created inquiry.

### 4.2. Get Inquiries (for User Dashboards)
*   **File Path (Intended):** `src/app/api/inquiries/route.ts` (for GET)
*   **Query Parameters:** `role: 'buyer' | 'seller'`, `listingId?: string` (if seller filters)
*   **Success Response (200 OK):**
    ```json
    { "success": true, "inquiries": [ /* array of inquiry objects with relevant details */ ] }
    ```
*   **Intended Backend Logic (Clerk & Supabase):**
    1.  **(TODO)** Authenticate user (`auth().userId`). Fetch their role from `user_profiles`.
    2.  **(TODO)** If `role === 'buyer'`, fetch inquiries from Supabase where `buyer_id = auth().userId`.
    3.  **(TODO)** If `role === 'seller'`, fetch inquiries where `seller_id = auth().userId`. Apply `listingId` filter if provided.
    4.  **(TODO)** For each inquiry, join with `listings` and `user_profiles` (for buyer/seller info) to populate display fields like `listingTitleAnonymous`, `buyerName`, `sellerStatus`, `buyerVerificationStatus`.
    5.  **(TODO)** Determine `statusBuyerPerspective` and `statusSellerPerspective` based on `inquiry.status` and user roles/verification.
    6.  **(TODO)** Return inquiries.

### 4.3. Seller Engages with Inquiry
*   **File Path (Intended):** `src/app/api/inquiries/[inquiryId]/engage/route.ts`
*   **HTTP Method:** `POST`
*   **Success Response (200 OK):**
    ```json
    { "success": true, "message": "Engagement status updated.", "inquiry": { /* updated inquiry data */ } }
    ```
*   **Intended Backend Logic (Clerk & Supabase):**
    1.  **(TODO)** Authenticate seller (`auth().userId`).
    2.  **(TODO)** Fetch inquiry by `inquiryId`. Verify `inquiry.seller_id === auth().userId`.
    3.  **(TODO)** Fetch buyer's `verification_status` and seller's listing's `verification_status` / `is_seller_verified`.
    4.  **(TODO)** Update `inquiries.status` in Supabase based on the verification flow logic (e.g., to 'seller_engaged_buyer_pending_verification', 'seller_engaged_seller_pending_verification', or 'ready_for_admin_connection').
    5.  **(TODO)** Set `engagement_timestamp`.
    6.  **(TODO) Notification System:** Trigger notifications to buyer and/or admin.
    7.  **(TODO)** Return updated inquiry.

## 5. Verification Request Routes (`/api/verification-requests/*`)

### 5.1. Create Verification Request
*   **File Path (Intended):** `src/app/api/verification-requests/route.ts`
*   **HTTP Method:** `POST`
*   **Request Body:** `{ "type": "'profile_buyer' | 'profile_seller' | 'listing'", "listingId"?: "string", "bestTimeToCall"?: "string", "notes"?: "string" }`
*   **Success Response (201 Created):**
    ```json
    { "success": true, "message": "Verification request submitted." }
    ```
*   **Intended Backend Logic (Clerk & Supabase):**
    1.  **(TODO)** Authenticate user (`auth().userId`).
    2.  **(TODO)** Validate request body. If `type === 'listing'`, ensure `listingId` is provided and belongs to the user.
    3.  **(TODO)** Store request in Supabase `verification_requests` table: `user_id`, `request_type`, `listing_id`, `notes`, `best_time_to_call`, `status = 'New Request'`.
    4.  **(TODO)** Update `user_profiles.verification_status = 'pending_verification'` or `listings.status = 'pending_verification'` as appropriate.
    5.  **(TODO) Notification System:** Notify admin team.

## 6. Admin Panel API Routes (Conceptual - All require Admin Auth)

*   **`/api/admin/users`**:
    *   `GET`: List users with filters/pagination.
    *   `PUT /[userId]/status`: Update user verification/paid status.
    *   `PUT /[userId]/profile`: Admin edit user details.
    *   `DELETE /[userId]`: Delete user.
    *   `POST /[userId]/reset-password-link`: Trigger Clerk password reset.
*   **`/api/admin/listings`**:
    *   `GET`: List all listings with filters/pagination.
    *   `GET /[listingId]`: Get full listing details.
    *   `PUT /[listingId]/status`: Approve/reject/deactivate/verify listing.
*   **`/api/admin/verification-requests`**:
    *   `GET`: Fetch requests (filter by type buyer/seller/listing).
    *   `PUT /[requestId]/status`: Update verification request status.
*   **`/api/admin/engagements`**:
    *   `GET`: Fetch engagements ready for connection.
    *   `PUT /[engagementId]/status`: Update engagement status (e.g., 'connection_facilitated').
*   **`/api/admin/analytics`**:
    *   Endpoints for various metrics (summary, user breakdown, listing breakdown, revenue).

This outlines the intended API structure. Each endpoint requires careful implementation of authentication, authorization, validation, business logic, and database interactions using Supabase and Clerk.
