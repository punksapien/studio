
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
*   **Conceptual Next.js API Route:** `POST /api/auth/register/seller` (Initiates registration and OTP sending).
*   **Detailed Backend Worker Logic:**
    1.  **Receive Request:** Worker receives POST with seller data: `fullName`, `email`, `password` (plain text), `phoneNumber`, `country`, `initialCompanyName` (optional).
    2.  **Validate Input:** Use Zod schema (`SellerRegisterSchema`).
    3.  **Check Email Uniqueness (D1 Query):** `SELECT user_id FROM user_profiles WHERE email = ?`. If found, return 409.
    4.  **Password Hashing:** Hash `password`.
    5.  **Store Provisional User Record (D1 Insert):** `user_profiles` table with `role='SELLER'`, `verification_status='ANONYMOUS'`, `email_verified_at=NULL`.
    6.  **Generate and Send OTP:** Call OTP logic (type `REGISTRATION`).
    7.  **Return Success Response:** 200 OK with `email` for OTP page.

### B. User Registration (Buyer)

*   **Triggering UI:** Buyer Registration Form (`src/app/auth/register/buyer/page.tsx`).
*   **Conceptual Next.js API Route:** `POST /api/auth/register/buyer`.
*   **Detailed Backend Worker Logic:**
    1.  **Receive Request:** Worker receives buyer data including persona fields.
    2.  **Validate Input:** Use Zod schema (`BuyerRegisterSchema`).
    3.  **Check Email Uniqueness (D1 Query).**
    4.  **Password Hashing.**
    5.  **Store Provisional User Record (D1 Insert):** `user_profiles` with buyer-specific fields, `role='BUYER'`, `email_verified_at=NULL`.
    6.  **Generate and Send OTP:** (Type `REGISTRATION`).
    7.  **Return Success Response:** With `email`.

### C. User Login - Step 1: Credential Validation & OTP Trigger

*   **Triggering UI:** Login Form (`src/app/auth/login/page.tsx`).
*   **Conceptual Next.js API Route:** `POST /api/auth/login/initiate`.
*   **Detailed Backend Worker Logic:**
    1.  **Receive Request:** `email`, `password`.
    2.  **Validate Input:** Use Zod schema (`LoginSchema`).
    3.  **Fetch User (D1 Query):** From `user_profiles`.
    4.  **Verify Password & Email Status:** If no user, password mismatch, or `email_verified_at` is `NULL`, return appropriate error.
    5.  **Generate and Send OTP:** (Type `LOGIN`).
    6.  **Return Success Response:** 200 OK with `email`.

### D. User Logout

*   **Triggering UI:** Logout button.
*   **Conceptual Next.js API Route:** `POST /api/auth/logout`.
*   **Detailed Backend Worker Logic:** Clear session cookie, invalidate server-side session if any.

### E. Forgot Password - Step 1: Request Reset OTP

*   **Triggering UI:** Forgot Password Form (`src/app/auth/forgot-password/page.tsx`).
*   **Conceptual Next.js API Route:** `POST /api/auth/forgot-password/initiate`.
*   **Detailed Backend Worker Logic:**
    1.  **Receive Request:** `email`.
    2.  **Validate Input.**
    3.  **Fetch User (D1 Query):** If user exists and `email_verified_at` IS NOT NULL, generate and send OTP (type `PASSWORD_RESET`).
    4.  **Return Generic Success Response:** To prevent email enumeration.

### F. Reset Password - Step 2: Verify OTP and Update Password

*   **Triggering UI:** New Password Form (after OTP verification from reset email).
*   **Conceptual Next.js API Route:** `POST /api/auth/reset-password/complete`.
*   **Detailed Backend Worker Logic:**
    1.  **Receive Request:** `email`, `otp`, `newPassword`.
    2.  **Validate Input.**
    3.  **Verify Reset OTP:** Call generic OTP verification for type `PASSWORD_RESET`.
    4.  **Update Password (D1 Update):** Hash `newPassword`, update `user_profiles`.
    5.  **Return Success Response.**

### G. OTP Logic (Shared Functionality)

*   **1. Generate OTP:** Secure random numeric string.
*   **2. Hash OTP:** Before storing.
*   **3. Store OTP in D1:** `otp_verifications` table (`otp_id`, `email`, `user_id`, `hashed_otp`, `otp_salt`, `type`, `expires_at`, `used_at`).
*   **4. Send OTP via Email:** Integrate email service.

### H. OTP Verification (Generic Endpoint)

*   **Triggering UI:** OTP Entry Form (`src/app/(auth)/verify-otp/page.tsx`).
*   **Conceptual Next.js API Route:** `POST /api/auth/verify-otp`.
*   **Detailed Backend Worker Logic:**
    1.  **Receive Request:** `email`, `otp`, `type` ('register', 'login', 'password_reset').
    2.  **Validate Input.**
    3.  **Fetch & Verify Stored OTP (D1 Query):** Check `otp_verifications` for matching, unused, unexpired OTP.
    4.  **Mark OTP as Used (D1 Update).**
    5.  **Perform Action Based on Type:**
        *   'register': Update `user_profiles.email_verified_at`.
        *   'login': Generate session token/cookie, update `last_login`.
        *   'password_reset': Allow password update step (client redirects to `/auth/reset-password/set-new` or similar).
    6.  **Return Success/Error Response.**

### I. Resend OTP

*   **Triggering UI:** "Resend OTP" button.
*   **Conceptual Next.js API Route:** `POST /api/auth/resend-otp`.
*   **Detailed Backend Worker Logic:** Rate limit, invalidate old OTPs (optional), generate and send new OTP.

---

## II. Business Listing Management (Seller Actions)

All actions require an authenticated 'SELLER' role.

### A. Create New Business Listing

*   **Triggering UI:** Seller Dashboard -> "Create New Listing" (`/app/seller-dashboard/listings/create/page.tsx`).
*   **Conceptual Next.js API Route:** `POST /api/listings`.
*   **Detailed Backend Worker Logic:**
    1.  **Authenticate Seller & Authorize.**
    2.  **Receive Request:** All listing data from `ListingSchema`. This includes `imageUrls` (array of up to 5 strings), `askingPrice` (number), `adjustedCashFlow` (number, optional), `adjustedCashFlowExplanation` (string, optional), `specificGrowthOpportunities` (string), `dealStructureLookingFor` (array of strings).
    3.  **Validate Input:** Use Zod `ListingSchema`.
    4.  **Conceptual File Handling (R2):** Handle document uploads (not image URLs themselves, which are provided as strings).
    5.  **Create Listing Record (D1 Insert):**
        *   Generate `listing_id`. Fetch seller's `verification_status`.
        *   Insert into `listings` table: Store `imageUrls` and `dealStructureLookingFor` as JSON string arrays. Store numeric fields like `askingPrice`, `adjustedCashFlow` directly.
        *   `status`: Default to `'active'` (or `'pending_verification'` if admin approval is needed first).
        *   `is_seller_verified`: Based on seller's profile status.
    6.  **Return Success Response:** 201 Created.

### B. Edit Existing Business Listing

*   **Triggering UI:** Seller Dashboard -> "Edit Listing" (`/app/seller-dashboard/listings/[listingId]/edit/page.tsx`).
*   **Conceptual Next.js API Route:** `PUT /api/listings/[listingId]`.
*   **Detailed Backend Worker Logic:**
    1.  **Authenticate Seller & Authorize Ownership.**
    2.  **Receive Request:** Updated listing data (partial `ListingSchema`, including array/numeric fields).
    3.  **Validate Input.**
    4.  **Conceptual File Updates (R2).**
    5.  **Update Listing Record (D1 Update):** Update specified fields.
    6.  **Return Success Response:** 200 OK.

### C. Deactivate/Reactivate Listing

*   **Triggering UI:** Seller Dashboard buttons.
*   **Conceptual Next.js API Route:** `PUT /api/listings/[listingId]/status`.
*   **Detailed Backend Worker Logic:** Authenticate, authorize, validate status transition, update `listings.status`.

### D. Seller Requests Listing/Profile Verification

*   **Triggering UI:** Seller Dashboard verification page/buttons.
*   **Conceptual Next.js API Route:** `POST /api/verification-requests`.
*   **Detailed Backend Worker Logic:** Authenticate, validate request, check current status, update entity status (`user_profiles.verification_status` or `listings.status` to `'pending_verification'`), create `verification_requests` record.

---

## III. Marketplace & Buyer Actions

### A. Fetch All Listings (for `/marketplace`)

*   **Triggering UI:** `/marketplace` page load, filter changes.
*   **Conceptual Next.js API Route:** `GET /api/listings`.
*   **Detailed Backend Worker Logic:**
    1.  **Receive Request:** Optional query params: `page`, `limit`, `industry`, `country`, `revenueRange`, `minAskingPrice` (number), `maxAskingPrice` (number), `keywords[]` (array of strings), `sortBy`, `sortOrder`.
    2.  **Validate Query Parameters.**
    3.  **Construct SQL Query for D1 (`listings` table):**
        *   Base `SELECT`: Public anonymous fields + `askingPrice` (number), `imageUrls` (first URL).
        *   Filtering (`WHERE` clauses):
            *   `listings.status IN ('active', 'verified_anonymous', 'verified_public')`.
            *   Apply standard filters.
            *   For numeric `askingPrice`: `AND askingPrice >= ?` and `AND askingPrice <= ?`.
            *   For `keywords[]`: Build dynamic `OR` conditions for each keyword against relevant text fields (e.g., `( (listingTitleAnonymous LIKE '%key1%') OR (anonymousBusinessDescription LIKE '%key1%') ) OR ...`).
        *   **Sorting & Pagination.**
    4.  **Execute Query & Fetch Total Count.**
    5.  **Return Success Response.**

### B. Fetch Single Listing Details (`/app/listings/[listingId]`)

*   **Triggering UI:** Navigating to a specific listing detail page.
*   **Conceptual Next.js API Route:** `GET /api/listings/[listingId]`.
*   **Detailed Backend Worker Logic:**
    1.  **Receive Request.**
    2.  **Determine Requesting Buyer's Status.**
    3.  **Fetch Listing and Seller Data (D1 Queries).**
    4.  **Construct Response Object:**
        *   **Always include:** Anonymous fields, `imageUrls` (array), `askingPrice` (number), `adjustedCashFlow` (number, if any), `adjustedCashFlowExplanation` (string, if any), `specificGrowthOpportunities` (string), `dealStructureLookingFor` (array).
        *   **Conditionally Include Verified Information:** Based on listing, seller, and buyer verification/paid status. Remove "Operational Details," "Business Model," and "Technology Stack" as separate detailed sections if they are now covered by more general fields or not displayed.
    5.  **Return Success Response.**

### C. Buyer Inquires About Business

*   **Triggering UI:** "Inquire about business" button.
*   **Conceptual Next.js API Route:** `POST /api/inquiries`.
*   **Detailed Backend Worker Logic:** Authenticate buyer, validate, fetch listing/seller, create `inquiries` record (status `new_inquiry`, `conversationId = NULL`), notify seller.

### D. Buyer Requests Profile Verification

*   **Triggering UI:** Buyer Dashboard verification page.
*   **Conceptual Next.js API Route:** `POST /api/verification-requests` (Shared).
*   **Detailed Backend Worker Logic:** Authenticate, validate, check status, update `user_profiles.verification_status = 'pending_verification'`, create `verification_requests` record.

---

## IV. Dashboard Data Fetching & Actions (Buyer & Seller)

### A. Buyer Dashboard

1.  **Overview, Profile, Notifications, Settings (Password Change from Settings):** Logic remains similar, ensure forms and data reflect current `User` type for buyers (including persona fields). "Change Password" UI is now in settings.
2.  **My Inquiries (`/dashboard/inquiries/page.tsx`)**
    *   **Data Needed:** List of buyer's inquiries, including `conversationId` (nullable).
    *   **Conceptual API (GET):** `/api/inquiries?role=buyer`.
    *   **Backend Logic (D1 Query):** Fetch inquiries, join with listings and seller profiles.
    *   **UI Logic:** If `inquiry.status` is `CONNECTION_FACILITATED_IN_APP_CHAT_OPENED` and `inquiry.conversationId` exists, "Open Conversation" button links to `/dashboard/messages/[conversationId]`. If verification needed, prompt user.

3.  **Messages (`/dashboard/messages/` and `/dashboard/messages/[conversationId]/`)**
    *   Uses APIs from Section VI.

### B. Seller Dashboard

1.  **Overview, Profile, Listings Management, Verification, Notifications, Settings (Password Change from Settings):** Logic remains similar. Ensure forms and data reflect current `User` and `Listing` types.
2.  **My Inquiries (Seller Perspective) (`/seller-dashboard/inquiries/page.tsx`)**
    *   **Data Fetching API (GET):** `/api/inquiries?role=seller`.
    *   **Backend Logic (D1 Query):** Fetch inquiries for seller, join with listings and buyer profiles. Include `conversationId`.
    *   **Action: Seller Engages with Inquiry (POST):** `/api/inquiries/[inquiryId]/engage`
        *   **Detailed Backend Worker Logic:**
            1.  Authenticate Seller, fetch inquiry, verify ownership.
            2.  If `inquiry.status` not 'new_inquiry', return error.
            3.  Fetch buyer and seller profile/listing verification statuses.
            4.  **Engagement Flow Logic:**
                *   If buyer not verified: `next_inquiry_status = 'seller_engaged_buyer_pending_verification'`.
                *   Else if seller/listing not verified: `next_inquiry_status = 'seller_engaged_seller_pending_verification'`.
                *   Else (Both effectively verified): `next_inquiry_status = 'ready_for_admin_connection'`. Notify Admin.
            5.  Update `inquiries.status` and `engagement_timestamp`. Trigger notifications.
    *   **UI Logic:** If `inquiry.status` is `CONNECTION_FACILITATED_IN_APP_CHAT_OPENED` and `inquiry.conversationId` exists, "Open Conversation" button links to `/seller-dashboard/messages/[conversationId]`.

3.  **Messages (`/seller-dashboard/messages/` and `/seller-dashboard/messages/[conversationId]/`)**
    *   Uses APIs from Section VI.

---

## V. Admin Panel Backend Logic

### General for all Admin APIs:
*   **Authentication/Authorization:** Verify admin role.
*   **Conceptual Audit Logging.**

### A. User Management (Existing - Review and Ensure Buyer Persona fields visible)
### B. Listing Management (Existing - Review and Ensure All New `Listing` fields are manageable)
### C. Verification Queues (Existing - Logic generally sound)

### D. Engagement Queue

1.  **Fetch Engagements Ready for Connection (`GET /api/admin/engagements` or `/api/admin/inquiries?status=ready_for_admin_connection`)**
    *   **Backend Logic (D1 Query):** Fetch inquiries with status `ready_for_admin_connection`.
2.  **Facilitate Connection & Create Conversation (`POST /api/admin/engagements/[inquiryId]/facilitate-connection`)**
    *   **Request Body:** `{ admin_notes?: string }`.
    *   **Backend Logic (CRITICAL FOR MESSAGING):**
        1.  Authenticate Admin. Fetch `inquiry` by `inquiryId`.
        2.  Verify `inquiry.status` is `ready_for_admin_connection`.
        3.  **Create `Conversation` record in D1** (See Section VII.A for details: `inquiry_id`, `listing_id`, `buyer_id`, `seller_id`, `status: 'ACTIVE'`).
        4.  **Update `inquiries.status` to `CONNECTION_FACILITATED_IN_APP_CHAT_OPENED'`.**
        5.  **Update `inquiries.conversationId` with the new conversation ID from the created `Conversation` record.**
        6.  Update `inquiries.admin_notes` with `admin_notes`.
        7.  Log admin action. Notify buyer and seller about the new chat available.
        8.  Return 200 OK with `conversationId`.

### E. Analytics Data Aggregation

*   Ensure queries for "Total Listings (All Statuses)" (e.g., `SELECT COUNT(*) FROM listings;`) and "Closed/Deactivated Listings" (e.g., `SELECT COUNT(*) FROM listings WHERE status IN ('inactive', 'closed_deal', 'rejected_by_admin');`) are noted.

### F. Conversation Oversight (Admin) (NEW)

1.  **Fetch All Active Conversations (`GET /api/admin/conversations`)**
    *   **Purpose:** Allow admins to view a list of all conversations.
    *   **Backend Worker Logic (D1 Query):**
        1.  Authenticate Admin.
        2.  `SELECT c.*, buyer_profile.full_name AS buyer_name, seller_profile.full_name AS seller_name, l.listingTitleAnonymous FROM conversations c JOIN user_profiles buyer_profile ON c.buyer_id = buyer_profile.user_id JOIN user_profiles seller_profile ON c.seller_id = seller_profile.user_id JOIN listings l ON c.listing_id = l.listing_id ORDER BY c.updated_at DESC` (with pagination and filters for `c.status`).
        3.  Return paginated conversations.

2.  **Fetch Messages for a Specific Conversation (Admin View - `GET /api/admin/conversations/[conversationId]/messages`)**
    *   **Purpose:** Allow admins to view message history for support or moderation.
    *   **Backend Worker Logic (D1 Query):**
        1.  Authenticate Admin. Receive `conversationId`.
        2.  Verify `conversationId` exists in `conversations` table.
        3.  `SELECT m.*, sender_profile.full_name AS sender_name FROM messages m JOIN user_profiles sender_profile ON m.sender_id = sender_profile.user_id WHERE m.conversation_id = ? ORDER BY m.timestamp ASC` (with pagination).
        4.  Return messages. (Admin view does not mark messages as read for users).

3.  **(Optional) Action: Admin Archive/Close Conversation (`PUT /api/admin/conversations/[conversationId]/status`)**
    *   **Purpose:** Allow admin to manually close or archive a conversation.
    *   **Request Payload:** `{ newStatus: ConversationStatus }` (e.g., 'ARCHIVED_BY_ADMIN', 'CLOSED_BY_ADMIN').
    *   **Backend Worker Logic:**
        1.  Authenticate Admin. Receive `conversationId` and `newStatus`.
        2.  Update `conversations.status = ?` in D1 for the given `conversationId`.
        3.  Log admin action.
        4.  (Conceptual) Notify participants if appropriate.
        5.  Return success.

---

## VI. File Upload Handling (Conceptual for R2)

(Existing content generally sound, ensure it aligns with `Listing` doc fields)

---
## VII. In-App Messaging System

### A. Creating a Conversation (Admin Action)

*   **Triggering Event:** Admin clicks "Facilitate Connection & Open Chat" for an inquiry in the Admin Engagement Queue (`/admin/engagement-queue`).
*   **Conceptual API Route (Called by Admin Panel Frontend):** `POST /api/admin/engagements/[inquiryId]/facilitate-connection`. (This expands the existing Admin route).
*   **Detailed Backend Worker Logic:**
    1.  **Authenticate Admin:** Verify admin privileges.
    2.  **Fetch Inquiry Details (D1 Query):** Retrieve the `inquiry` record using `inquiryId` to get `buyer_id`, `seller_id`, and `listing_id`.
    3.  **Verify Inquiry Status:** Ensure `inquiries.status` is `'ready_for_admin_connection'`. If not, return an error.
    4.  **Create Conversation Record (D1 Insert):**
        *   Generate a new unique `conversation_id` (e.g., UUID).
        *   Insert a new record into the `conversations` table with:
            *   `conversation_id`
            *   `inquiry_id`
            *   `listing_id`
            *   `buyer_id`
            *   `seller_id`
            *   `created_at` (current timestamp)
            *   `updated_at` (current timestamp)
            *   `last_message_snippet`: NULL or a system message like "Chat initiated by Admin."
            *   `buyer_unread_count`: 0
            *   `seller_unread_count`: 0
            *   `status`: `'ACTIVE'` (from `ConversationStatus` type)
    5.  **Update Inquiry Status (D1 Update):** Change `inquiries.status` to `'CONNECTION_FACILITATED_IN_APP_CHAT_OPENED'`.
    6.  **Update Inquiry Conversation ID (D1 Update):** Set `inquiries.conversationId = <new_conversation_id>` for the given `inquiryId`.
    7.  **Trigger Notifications (Conceptual):** Create notification records in D1 `notifications` table for both buyer and seller.
    8.  **Audit Log (D1 Insert):** Log the admin action.
    9.  **Return Success Response:** 200 OK with `{ success: true, message: "Connection facilitated and conversation created.", conversationId: new_conversation_id }`.

### B. Fetching User's Conversations (List View)

*   **Triggering UI:** Buyer/Seller navigates to their "Messages" page.
*   **Conceptual API Route:** `GET /api/conversations`
*   **Detailed Backend Worker Logic:**
    1.  **Authenticate User:** Get `user_id` from session.
    2.  **Receive Request:** Optional query parameters for pagination (`page`, `limit`).
    3.  **Query Conversations (D1 Query):**
        ```sql
        SELECT
            c.conversation_id, c.listing_id, c.buyer_id, c.seller_id, c.updated_at, c.last_message_snippet, c.status,
            CASE
                WHEN c.buyer_id = ?1 THEN c.buyer_unread_count
                WHEN c.seller_id = ?1 THEN c.seller_unread_count
                ELSE 0
            END AS unread_count,
            l.listingTitleAnonymous AS listing_title,
            other_user.full_name AS other_party_name,
            other_user.role AS other_party_role
        FROM conversations c
        JOIN listings l ON c.listing_id = l.listing_id
        JOIN user_profiles other_user ON (CASE WHEN c.buyer_id = ?1 THEN c.seller_id ELSE c.buyer_id END) = other_user.user_id
        WHERE (c.buyer_id = ?1 OR c.seller_id = ?1) AND c.status = 'ACTIVE' -- Or filter by other statuses
        ORDER BY c.updated_at DESC
        LIMIT ?2 OFFSET ?3;
        ```
    4.  **Fetch Total Count:** For pagination.
    5.  **Return Success Response:** 200 OK with paginated list.

### C. Fetching Messages for a Conversation

*   **Triggering UI:** User opens a specific conversation.
*   **Conceptual API Route:** `GET /api/conversations/[conversationId]/messages`
*   **Detailed Backend Worker Logic:**
    1.  **Authenticate User & Verify Participation.**
    2.  **Fetch Messages (D1 Query):** `SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC` (with pagination).
    3.  **Mark Messages as Read (D1 Update):** `UPDATE messages SET is_read = true WHERE conversation_id = ? AND receiver_id = ? AND is_read = false`.
    4.  **Update Unread Count on Conversation (D1 Update):** Set user's specific unread count (e.g., `buyer_unread_count` or `seller_unread_count`) to 0.
    5.  **Return Success Response.**

### D. Sending a New Message

*   **Triggering UI:** User sends message.
*   **Conceptual API Route:** `POST /api/conversations/[conversationId]/messages`
*   **Detailed Backend Worker Logic:**
    1.  **Authenticate User & Verify Participation.**
    2.  **Determine `receiverId`.**
    3.  **Create `Message` Record (D1 Insert).**
    4.  **Update `Conversation` Record (D1 Update):** `updated_at`, `last_message_snippet`, increment receiver's `unread_count`.
    5.  **Trigger Real-time Notification.**
    6.  **Return Success Response.**

### E. Real-time Considerations (Cloudflare)

*   **Polling (MVP).**
*   **Cloudflare Workers + Durable Objects + WebSockets (Advanced).**
*   **Third-Party Push Notification Services.**

This document provides a comprehensive plan for the backend implementation, including the new messaging system and admin oversight.

    