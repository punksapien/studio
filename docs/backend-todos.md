
# Consolidated Backend TODO List

This document provides a consolidated checklist of backend functionalities that need to be implemented for the Nobridge platform. These tasks are primarily derived from the intended logic for API routes and interactions with services like Cloudflare D1/R2.

## I. Authentication & User Management (Conceptual: OTP based or Clerk)

1.  **Buyer Registration (`POST /api/auth/register/buyer`):**
    *   [ ] Validate input against `BuyerRegisterSchema`.
    *   [ ] Check D1 `user_profiles` for existing email.
    *   [ ] Hash password.
    *   [ ] Store buyer profile in D1 `user_profiles` (link with `user_id`, set role 'buyer', default statuses `anonymous`/`false` for verification/paid, save persona fields, `email_verified_at = NULL`).
    *   [ ] Generate and send 'REGISTRATION' OTP.
    *   [ ] Implement robust error handling.
2.  **Seller Registration (`POST /api/auth/register/seller`):**
    *   [ ] Similar to buyer, role 'seller', save `initialCompanyName`.
3.  **User Login - Initiate (`POST /api/auth/login/initiate`):**
    *   [ ] Validate `email`, `password` against D1.
    *   [ ] If valid & `email_verified_at` is NOT NULL, generate and send 'LOGIN' OTP.
4.  **OTP Verification (`POST /api/auth/verify-otp`):**
    *   [ ] Validate `email`, `otp`, `type`.
    *   [ ] Verify OTP against D1 `otp_verifications`.
    *   [ ] If type 'register', update `user_profiles.email_verified_at`.
    *   [ ] If type 'login', generate session token/cookie, update `user_profiles.last_login`.
    *   [ ] If type 'password_reset', allow password update.
5.  **Forgot Password - Initiate (`POST /api/auth/forgot-password/initiate`):**
    *   [ ] If user exists & verified, send 'PASSWORD_RESET' OTP.
6.  **Reset Password - Complete (`POST /api/auth/reset-password/complete`):**
    *   [ ] Verify 'PASSWORD_RESET' OTP via `/api/auth/verify-otp`.
    *   [ ] Update password in D1.
7.  **User Profile Update (`PUT /api/profile`):**
    *   [ ] Authenticate user.
    *   [ ] Validate request body against relevant `ProfileSchema`.
    *   [ ] Update user's profile data in D1 `user_profiles`.
8.  **Password Change (from Settings - `PUT /api/auth/change-password`):**
    *   [ ] Authenticate user.
    *   [ ] Validate `currentPassword`, `newPassword`.
    *   [ ] Verify `currentPassword` against D1, then update with new hashed password.

## II. Listing Management (D1 & R2)

1.  **Create Listing (`POST /api/listings`):**
    *   [ ] Authenticate seller.
    *   [ ] Validate request body against `ListingSchema` (including `imageUrls` string array, `askingPrice` number, `adjustedCashFlow` number, `dealStructureLookingFor` string array).
    *   [ ] Insert new listing into D1 `listings` table (store arrays as JSON strings, numbers as numbers).
    *   [ ] Handle document uploads (if any) to R2, store R2 keys/URLs.
2.  **Get Listings (Marketplace - `GET /api/listings`):**
    *   [ ] Implement filtering: `industry`, `country`, numeric `minAskingPrice`/`maxAskingPrice`, `keywords[]` (array of strings, use multiple `LIKE` clauses).
    *   [ ] Implement sorting and pagination.
    *   [ ] Query D1 `listings`, return public anonymous fields.
3.  **Get Single Listing (Public Detail - `GET /api/listings/[listingId]`):**
    *   [ ] Fetch listing from D1.
    *   [ ] Conditionally include verified fields based on seller verification and requesting buyer's verification/paid status. Ensure response includes `imageUrls` array, `adjustedCashFlow`, `specificGrowthOpportunities`.
4.  **Update Listing (Seller - `PUT /api/listings/[listingId]`):**
    *   [ ] Authenticate seller and verify ownership.
    *   [ ] Validate request body (partial `ListingSchema`).
    *   [ ] Update D1 `listings`. Handle R2 file updates/deletions.

## III. Inquiry System (D1)

1.  **Create Inquiry (`POST /api/inquiries`):**
    *   [ ] Authenticate buyer.
    *   [ ] Validate `listingId`. Fetch `seller_id`.
    *   [ ] Create record in D1 `inquiries` (status `new_inquiry`, `conversationId = NULL`).
    *   [ ] Notify seller.
2.  **Get Inquiries (User Dashboards - `GET /api/inquiries`):**
    *   [ ] Authenticate user. Fetch inquiries based on role (`buyer_id` or `seller_id`).
    *   [ ] Join with `listings`, `user_profiles`. Include `conversationId`.
3.  **Seller Engages with Inquiry (`POST /api/inquiries/[inquiryId]/engage`):**
    *   [ ] Authenticate seller. Verify ownership.
    *   [ ] Update `inquiries.status` based on verification flow (e.g., `seller_engaged_buyer_pending_verification`, `ready_for_admin_connection`).
    *   [ ] Notify relevant parties.

## IV. Verification System (D1)

1.  **Create Verification Request (`POST /api/verification-requests`):**
    *   [ ] Authenticate user.
    *   [ ] Store request in D1 `verification_requests`.
    *   [ ] Update `user_profiles.verification_status = 'pending_verification'` or `listings.status = 'pending_verification'`.
    *   [ ] Notify admin team.

## V. Admin Panel APIs (D1)

*   **General:** Implement Admin Auth, Audit Logging.
*   **User Management:**
    *   `GET /api/admin/users`: Fetch users with filters, pagination.
    *   `GET /api/admin/users/[userId]`: Fetch specific user.
    *   `PUT /api/admin/users/[userId]/status`: Update `verification_status`, `is_paid`.
    *   `PUT /api/admin/users/[userId]/profile`: Edit user profile.
    *   `POST /api/admin/users/[userId]/send-reset-otp`: Trigger password reset OTP.
*   **Listing Management:**
    *   `GET /api/admin/listings`: Fetch listings with filters, pagination.
    *   `GET /api/admin/listings/[listingId]`: Fetch full listing details.
    *   `PUT /api/admin/listings/[listingId]/status`: Update listing `status`.
*   **Verification Queues:**
    *   `GET /api/admin/verification-requests`: Fetch requests.
    *   `PUT /api/admin/verification-requests/[requestId]/status`: Update request status and related entity status.
*   **Engagement Queue & Conversation Creation (`POST /api/admin/engagements/[inquiryId]/facilitate-connection`):**
    *   [ ] Fetch `inquiry` by `inquiryId`.
    *   [ ] Verify `inquiry.status` is `ready_for_admin_connection`.
    *   [ ] **Create `Conversation` record in D1** (set `status: 'ACTIVE'`).
    *   [ ] **Update `inquiries.status` to `CONNECTION_FACILITATED_IN_APP_CHAT_OPENED'`.**
    *   [ ] **Update `inquiries.conversationId` with the new `conversationId`.**
    *   [ ] Notify buyer and seller.
*   **Analytics (`GET /api/admin/analytics/...`):**
    *   [ ] Implement aggregation queries for metrics including "Total Listings (All Statuses)" (e.g., `SELECT COUNT(*) FROM listings`) and "Closed/Deactivated Listings" (e.g., `SELECT COUNT(*) FROM listings WHERE status IN ('inactive', 'closed_deal', 'rejected_by_admin')`).
*   **Conversation Oversight (NEW):**
    *   `GET /api/admin/conversations`: List all conversations with filters.
    *   `GET /api/admin/conversations/[conversationId]/messages`: Get messages for a specific conversation.
    *   `PUT /api/admin/conversations/[conversationId]/status`: Update conversation status (e.g., 'ARCHIVED_BY_ADMIN').

## VI. Messaging System (D1 & Conceptual Real-time)

1.  **Get User's Conversations (`GET /api/conversations`):**
    *   [ ] Authenticate user.
    *   [ ] Query D1 `conversations` table (joined with `listings`, `user_profiles`) for conversations where user is `buyer_id` or `seller_id` and `status = 'ACTIVE'`.
    *   [ ] Calculate unread counts for current user. Paginate.
2.  **Get Messages for a Conversation (`GET /api/conversations/[conversationId]/messages`):**
    *   [ ] Authenticate user and verify participation.
    *   [ ] Fetch `messages` from D1 for `conversationId`.
    *   [ ] Mark fetched messages as read in D1 for the current user.
    *   [ ] Update user's unread count on the `Conversation` record to 0. Paginate.
3.  **Send Message (`POST /api/conversations/[conversationId]/messages`):**
    *   [ ] Authenticate user and verify participation.
    *   [ ] Create new `Message` record in D1.
    *   [ ] Update `Conversation` record (`updated_at`, `lastMessageSnippet`, increment receiver's unread count).
    *   [ ] Implement real-time notification (MVP: client polls or simple push).

## VII. General Backend & Infrastructure

1.  **Database Schema Design (D1):**
    *   [ ] Finalize and implement all table schemas including `user_profiles`, `listings`, `inquiries`, `otp_verifications`, `verification_requests`, `conversations`, `messages`, `notifications`, `audit_logs`.
    *   [ ] Define keys, relationships, indexes.
2.  **Notification System:** Design and implement `notifications` table and logic.
3.  **Environment Variables & Security:** Manage secrets, input sanitization, rate limiting.
4.  **Error Handling & Logging.**
5.  **Deployment:** Plan for Cloudflare Workers.

This checklist should guide the backend development process.

    