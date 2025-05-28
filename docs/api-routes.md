
# API Route Specifications (Intended)

This document outlines the specifications for the Next.js API routes that are *intended* to be implemented for the Nobridge platform. Currently, these routes are conceptual placeholders based on frontend form submissions and actions; their backend logic needs full development.

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
*   **Success Response (200 OK / 201 Created - Conceptual, OTP flow):**
    ```json
    {
      "success": true,
      "message": "Registration initiated. Please check your email for an OTP to verify your account.",
      "email": "<user_email>" // For OTP verification step
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
    *   `500 Internal Server Error`: Backend (e.g., D1 or Worker) error during user creation.
        ```json
        { "success": false, "error": "Failed to create user. Please try again later." }
        ```
*   **Intended Backend Logic (Conceptual for D1 & Workers):**
    1.  **Validation:** Parse and validate the request body using `BuyerRegisterSchema`. If invalid, return 400.
    2.  **Email Check (D1):** Query `user_profiles` table in D1 to check if `email` already exists. If so, return 409.
    3.  **Password Hashing:** Hash password.
    4.  **Profile Creation (D1):** Insert a new record into `user_profiles` (status `email_unverified`).
    5.  **OTP Generation & Email:** Generate OTP, store it (hashed) in `otp_verifications`, send OTP email (type `REGISTRATION`).
    6.  **Response:** Return success with email for OTP page.

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
*   **Intended Backend Logic (Conceptual for D1 & Workers):** Similar to buyer, but role is 'seller'.

### 1.3. User Login (Initiate OTP)
*   **File Path (Intended):** `POST /api/auth/login/initiate`
*   **HTTP Method:** `POST`
*   **Purpose:** Validates credentials and triggers OTP for login.
*   **Request Body Schema:** (Refers to `LoginSchema` from `/app/auth/login/page.tsx`)
    *   `email: string`
    *   `password: string`
*   **Success Response (200 OK):**
    ```json
    { "success": true, "message": "Credentials verified. OTP sent to your email.", "email": "<user_email>" }
    ```
*   **Error Responses:** `401 Unauthorized` (invalid credentials), `403 Forbidden` (email not verified).
*   **Intended Backend Logic (Conceptual for D1 & Workers):**
    1.  Validate credentials against D1 (`user_profiles`).
    2.  If valid and email verified, generate and send Login OTP (type `LOGIN`).

### 1.4. OTP Verification (Unified Endpoint)
*   **File Path (Intended):** `POST /api/auth/verify-otp`
*   **Request Body:** `{ email: string, otp: string, type: 'register' | 'login' | 'password_reset' }`
*   **Success Response (200 OK):**
    *   Register: `{ "success": true, "message": "Email verified. Please login." }`
    *   Login: `{ "success": true, "message": "Login successful.", "sessionToken": "...", "user": { ... } }`
    *   Password Reset: `{ "success": true, "message": "OTP verified. Please proceed to reset your password." }`
*   **Intended Backend Logic (Conceptual for D1 & Workers):**
    1.  Verify OTP against stored hashed OTP in D1 (`otp_verifications`).
    2.  If 'register', update `user_profiles.email_verified_at`.
    3.  If 'login', generate session, update `last_login`.
    4.  If 'password_reset', mark OTP as used, allow password update step.

### 1.5. Forgot Password (Initiate OTP)
*   **File Path (Intended):** `POST /api/auth/forgot-password/initiate`
*   **Request Body Schema:** (Refers to `ForgotPasswordSchema` from `/app/auth/forgot-password/page.tsx`)
    *   `email: string`
*   **Success Response (200 OK):**
    ```json
    { "success": true, "message": "If an account with that email exists, an OTP for password reset has been sent.", "email": "<user_email>" }
    ```
*   **Intended Backend Logic (Conceptual for D1 & Workers):**
    1.  Validate email. If user exists and verified, generate and send 'PASSWORD_RESET' OTP.

### 1.6. Reset Password (Complete with OTP)
*   **File Path (Intended):** `POST /api/auth/reset-password/complete`
*   **Request Body:** `{ email: string, otp: string, newPassword: string }`
*   **Success Response (200 OK):** `{ "success": true, "message": "Password has been reset successfully." }`
*   **Intended Backend Logic (Conceptual):**
    1.  Verify OTP (type 'PASSWORD_RESET') via `/api/auth/verify-otp`.
    2.  If OTP valid, hash `newPassword` and update in D1.

## 2. User Profile Routes (`/api/profile/*`)

### 2.1. Update User Profile
*   **File Path (Intended):** `PUT /api/profile`
*   **HTTP Method:** `PUT`
*   **Purpose:** Updates the current logged-in user's profile information.
*   **Request Body Schema:** (Refers to `ProfileSchema` from buyer/seller profile pages)
*   **Success Response (200 OK):**
    ```json
    { "success": true, "message": "Profile updated successfully.", "user": { /* updated user profile data from D1 */ } }
    ```
*   **Intended Backend Logic (Conceptual for D1 & Workers):**
    1.  Authenticate user.
    2.  Validate request body.
    3.  Update corresponding fields in D1 `user_profiles` table.

### 2.2. Change Password (From Settings Page)
*   **File Path (Intended):** `PUT /api/auth/change-password`
*   **HTTP Method:** `PUT`
*   **Request Body Schema:** (Refers to `PasswordChangeSchema` from profile/settings pages)
    *   `currentPassword: string`
    *   `newPassword: string`
*   **Success Response (200 OK):**
    ```json
    { "success": true, "message": "Password updated successfully." }
    ```
*   **Intended Backend Logic (Conceptual for D1 & Workers):**
    1.  Authenticate user. Verify `currentPassword`. Update D1 with new hashed password.

## 3. Listing Routes (`/api/listings/*`)

### 3.1. Create Listing
*   **File Path (Intended):** `POST /api/listings`
*   **HTTP Method:** `POST`
*   **Purpose:** Creates a new business listing for the authenticated seller.
*   **Request Body Schema:** (Refers to `ListingSchema` from `/app/seller-dashboard/listings/create/page.tsx`)
    * Includes `imageUrls` as `string[]` (max 5), `askingPrice` as `number`, `adjustedCashFlow` as `number` (optional), `adjustedCashFlowExplanation` as `string` (optional), `specificGrowthOpportunities` as `string` (newline-separated points), and `dealStructureLookingFor` as `string[]` (multi-select).
*   **Success Response (201 Created):**
    ```json
    { "success": true, "message": "Listing created successfully.", "listing": { /* created listing data */ } }
    ```
*   **Intended Backend Logic (Conceptual for D1, R2 & Workers):**
    1.  Authenticate seller. Validate.
    2.  Insert new listing into D1 `listings` table. Store `imageUrls` and `dealStructureLookingFor` as JSON string arrays. Store `askingPrice` and `adjustedCashFlow` as numbers.
    3.  Handle file uploads (for document fields if any, via R2) to R2, store keys/URLs.

### 3.2. Get Listings (Marketplace)
*   **File Path (Intended):** `GET /api/listings`
*   **HTTP Method:** `GET`
*   **Query Parameters:** `page?`, `limit?`, `industry?`, `country?`, `revenueRange?`, `minAskingPrice?` (number), `maxAskingPrice?` (number), `keywords[]?` (array of strings), `sortBy?`, `sortOrder?`
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
*   **Intended Backend Logic (Conceptual for D1 & Workers):**
    1.  Parse query parameters.
    2.  Build D1 query:
        *   Filter by `askingPrice >= minAskingPrice AND askingPrice <= maxAskingPrice` (if `askingPrice` is numeric).
        *   For `keywords` (array of strings), use multiple `OR columnName LIKE '%keyword%'` clauses for relevant text fields.
    3.  Implement sorting and pagination.

### 3.3. Get Single Listing (Public Detail)
*   **File Path (Intended):** `GET /api/listings/[listingId]`
*   **HTTP Method:** `GET`
*   **Success Response (200 OK):**
    ```json
    { "success": true, "listing": { /* listing data, including imageUrls array, adjustedCashFlow, specificGrowthOpportunities, etc. */ } }
    ```
*   **Intended Backend Logic (Conceptual for D1 & Workers):**
    1.  Fetch listing. Determine requesting user's status.
    2.  Conditionally include verified fields based on user status and seller verification.

### 3.4. Update Listing (Seller)
*   **File Path (Intended):** `PUT /api/listings/[listingId]`
*   **Request Body Schema:** (Partial `ListingSchema`)
    *   Includes `imageUrls` as `string[]`, `askingPrice` as `number`, `adjustedCashFlow` as `number` (optional), `adjustedCashFlowExplanation` as `string` (optional), `specificGrowthOpportunities` as `string`, and `dealStructureLookingFor` as `string[]`.
*   **Intended Backend Logic (Conceptual for D1, R2 & Workers):**
    1.  Authenticate seller, verify ownership.
    2.  Update listing in D1. Handle file updates/deletions in R2.

## 4. Inquiry Routes (`/api/inquiries/*`)

### 4.1. Create Inquiry
*   **File Path (Intended):** `POST /api/inquiries`
*   **HTTP Method:** `POST`
*   **Request Body:** `{ "listingId": "string", "message"?: "string" }`
*   **Success Response (201 Created):**
    ```json
    { "success": true, "message": "Inquiry submitted.", "inquiry": { /* created inquiry data */ } }
    ```
*   **Intended Backend Logic (Conceptual for D1 & Workers):**
    1.  Authenticate buyer. Create record in D1 `inquiries`. Set `conversationId` to NULL.
    2.  Trigger notification to seller.

### 4.2. Get Inquiries (for User Dashboards)
*   **File Path (Intended):** `GET /api/inquiries`
*   **Query Parameters:** `role: 'buyer' | 'seller'`, `listingId?: string`
*   **Success Response (200 OK):**
    ```json
    { "success": true, "inquiries": [ /* array of inquiry objects including conversationId */ ] }
    ```
*   **Intended Backend Logic (Conceptual for D1 & Workers):**
    1.  Authenticate user. Fetch inquiries based on role. Join with other tables for details. Include `conversationId`.

### 4.3. Seller Engages with Inquiry
*   **File Path (Intended):** `POST /api/inquiries/[inquiryId]/engage`
*   **HTTP Method:** `POST`
*   **Success Response (200 OK):**
    ```json
    { "success": true, "message": "Engagement status updated. Buyer/Seller verification may be required.", "inquiry": { /* updated inquiry data */ } }
    ```
*   **Intended Backend Logic (Conceptual for D1 & Workers):**
    1.  Authenticate seller. Update `inquiries.status` based on verification flow (e.g., to `seller_engaged_buyer_pending_verification`, `seller_engaged_seller_pending_verification`, or `ready_for_admin_connection`).
    2.  Trigger notifications.

## 5. Verification Request Routes (`/api/verification-requests/*`)

### 5.1. Create Verification Request
*   **File Path (Intended):** `POST /api/verification-requests`
*   **HTTP Method:** `POST`
*   **Request Body:** `{ "type": "'profile_buyer' | 'profile_seller' | 'listing'", "listingId"?: "string", "bestTimeToCall"?: "string", "notes"?: "string" }`
*   **Intended Backend Logic (Conceptual for D1 & Workers):**
    1.  Authenticate user. Store request in D1 `verification_requests`. Update entity status. Notify admin.

## 6. Messaging Routes (`/api/conversations/*`) (NEW)

### 6.1. Create Conversation (Admin Initiated via Engagement Flow)
*   **Conceptual Trigger:** Part of the `POST /api/admin/engagements/[inquiryId]/facilitate-connection` API call by an Admin.
*   **Purpose:** Creates the actual conversation record in D1 when an admin facilitates a connection for an inquiry.
*   **Intended Backend Logic (within `facilitate-connection`):**
    1.  Fetch inquiry, extract buyerId, sellerId, listingId.
    2.  Create a new `Conversation` record in D1 (with `status: 'ACTIVE'`).
    3.  Update `inquiries.status` to `'CONNECTION_FACILITATED_IN_APP_CHAT_OPENED'`.
    4.  Update `inquiries.conversationId` with the new conversation ID.
    5.  Notify buyer and seller.

### 6.2. Get User's Conversations (List)
*   **File Path (Intended):** `GET /api/conversations`
*   **HTTP Method:** `GET`
*   **Purpose:** Fetches a list of all conversations for the authenticated user.
*   **Query Parameters:** `page?`, `limit?` (for pagination)
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "conversations": [
        {
          "conversationId": "string",
          "otherPartyName": "string",
          "otherPartyRole": "'buyer' | 'seller'",
          "listingTitle": "string",
          "lastMessageSnippet": "string",
          "lastMessageTimestamp": "Date",
          "unreadCount": "number",
          "status": "ConversationStatus"
        }
        // ... more conversations
      ],
      "totalPages": "number",
      "currentPage": "number"
    }
    ```
*   **Intended Backend Logic (Conceptual for D1 & Workers):**
    1.  Authenticate user.
    2.  Query D1 `conversations` where `buyerId` OR `sellerId` matches user's ID AND `status = 'ACTIVE'`.
    3.  Join with `user_profiles` for other party's name, and `listings` for title.
    4.  Order by `updatedAt` DESC. Paginate.

### 6.3. Get Messages for a Conversation
*   **File Path (Intended):** `GET /api/conversations/[conversationId]/messages`
*   **HTTP Method:** `GET`
*   **Purpose:** Fetches messages for a specific conversation.
*   **Query Parameters:** `beforeTimestamp?` (for fetching older messages/pagination), `limit?`
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "messages": [
        {
          "messageId": "string",
          "senderId": "string",
          "contentText": "string",
          "timestamp": "Date",
          "isRead": "boolean",
          "attachmentUrl?": "string"
        }
        // ... more messages
      ]
    }
    ```
*   **Intended Backend Logic (Conceptual for D1 & Workers):**
    1.  Authenticate user and verify participation in `conversationId`.
    2.  Fetch `messages` from D1 for this `conversationId`, ordered by `timestamp` ASC (or DESC for pagination).
    3.  Mark fetched messages as read for the current user: `UPDATE messages SET is_read = true WHERE conversation_id = ? AND receiver_id = ? AND is_read = false`.
    4.  Update `conversations.[buyer/seller]_unread_count` for the current user for this `conversationId` to 0.

### 6.4. Send Message in Conversation
*   **File Path (Intended):** `POST /api/conversations/[conversationId]/messages`
*   **HTTP Method:** `POST`
*   **Purpose:** Sends a new message in a specific conversation.
*   **Request Body:**
    ```json
    {
      "contentText": "string"
      // "attachmentUrl"?: "string" // Future
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "success": true,
      "message": { /* The newly created message object */ }
    }
    ```
*   **Intended Backend Logic (Conceptual for D1 & Workers):**
    1.  Authenticate user and verify participation.
    2.  Determine `receiverId` from conversation.
    3.  Create new `Message` record in D1.
    4.  Update `conversations.updatedAt` and `lastMessageSnippet`.
    5.  Increment `[buyer/seller]_unread_count` for the `receiverId` on the `Conversation` record.
    6.  Trigger real-time notification/event.

## 7. Admin Panel API Routes (Conceptual - All require Admin Auth)

*   **`/api/admin/users`**: (Existing - GET, PUT /[userId]/status, PUT /[userId]/profile, DELETE /[userId], POST /[userId]/reset-password-otp)
*   **`/api/admin/listings`**: (Existing - GET, GET /[listingId], PUT /[listingId]/status)
*   **`/api/admin/verification-requests`**: (Existing - GET, PUT /[requestId]/status)
*   **`/api/admin/engagements`**:
    *   `GET`: Fetch engagements ready for connection (status `READY_FOR_ADMIN_CONNECTION`).
    *   `POST /[inquiryId]/facilitate-connection`: (Was PUT) This route is now responsible for:
        1.  Updating `inquiries.status` to `CONNECTION_FACILITATED_IN_APP_CHAT_OPENED`.
        2.  **Creating the `Conversation` record (with `status: 'ACTIVE'`).**
        3.  Updating `inquiries.conversationId` with the new conversation ID.
        4.  Notifying buyer and seller.
*   **`/api/admin/conversations` (NEW)**
    *   `GET`: List all conversations (paginated, with filters for buyer, seller, listing, status).
*   **`/api/admin/conversations/[conversationId]/messages` (NEW)**
    *   `GET`: Get all messages for a specific conversation (read-only for admin, paginated).
*   **`/api/admin/conversations/[conversationId]/status` (NEW)**
    *   `PUT`: Update conversation status (e.g., 'ARCHIVED_BY_ADMIN').
        *   Request Body: `{ newStatus: ConversationStatus }`
*   **`/api/admin/analytics`**: (Existing - endpoints for various metrics, ensure "Total Listings" and "Closed/Deactivated Listings" metrics are included).

This outlines the intended API structure, including new messaging endpoints and admin oversight for conversations.

    