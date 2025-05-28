
# Core Feature Walkthroughs

This document details the major features of the Nobridge platform, outlining the user flow, UI components, data involved, and intended backend interactions.

## 1. User Registration

### 1.1. Buyer Registration

*   **UI Components/Pages:** `/app/auth/register/buyer/page.tsx`
*   **User Flow:**
    1.  User navigates to `/auth/register`, chooses "Buyer".
    2.  Fills form: Full Name, Email, Password, Phone, Country, Buyer Persona, Investment Focus, etc.
    3.  Submits form. (Conceptual) Backend validates, creates provisional user, sends OTP.
    4.  User redirected to `/auth/verify-otp` with email and type.
*   **Key Data Collected:** `BuyerRegisterSchema` fields.
*   **Intended API Route:** `POST /api/auth/register/buyer`
*   **Intended Backend Logic:** Validate, check email uniqueness, store provisional user in D1, generate & send OTP.

### 1.2. Seller Registration

*   **UI Components/Pages:** `/app/auth/register/seller/page.tsx`
*   **User Flow:** Similar to Buyer, but for Sellers.
*   **Key Data Collected:** `SellerRegisterSchema` fields.
*   **Intended API Route:** `POST /api/auth/register/seller`
*   **Intended Backend Logic:** Similar to Buyer, role is 'seller'.

## 2. User Login

*   **UI Components/Pages:** `/app/auth/login/page.tsx`
*   **User Flow:**
    1.  User enters Email and Password.
    2.  Submits form. (Conceptual) Backend validates credentials, sends OTP if valid & email verified.
    3.  User redirected to `/auth/verify-otp` with email and type.
*   **Key Data Collected:** `LoginSchema` fields.
*   **Intended API Route:** `POST /api/auth/login/initiate` (for credential check & OTP), then `/api/auth/verify-otp` (for OTP check & session creation).

## 3. OTP Verification

*   **UI Components/Pages:** `/app/(auth)/verify-otp/page.tsx`
*   **User Flow:**
    1.  User enters OTP received via email.
    2.  Submits form. (Conceptual) Backend verifies OTP against stored hash.
    3.  If successful (register): Email marked verified. User redirected to login.
    4.  If successful (login): Session created. User redirected to dashboard.
*   **Key Data Collected:** `OTPSchema` fields, `email` and `type` from query params.
*   **Intended API Route:** `POST /api/auth/verify-otp`

## 4. Business Listing Creation (by Seller)

*   **UI Components/Pages:** `/app/seller-dashboard/listings/create/page.tsx`
*   **User Flow:**
    1.  Seller navigates to "Create New Listing".
    2.  Fills multi-section form: Basic Info, Business Profile, Financials (including `askingPrice` as number, `adjustedCashFlow` as number), Deal Structure (multi-select `dealStructureLookingFor`), Growth (bullet points for `specificGrowthOpportunities`), Image URLs (up to 5).
    3.  Submits form.
*   **Key Data Collected:** `ListingSchema` fields.
*   **Intended API Route:** `POST /api/listings`
*   **Intended Backend Logic:** Authenticate seller, validate, store listing in D1 (arrays as JSON strings, numbers as numbers), handle document uploads to R2.

## 5. Marketplace Display & Browsing

*   **UI Components/Pages:** `/app/marketplace/page.tsx`, `src/components/marketplace/filters.tsx`, `src/components/marketplace/listing-card.tsx`
*   **User Flow:**
    1.  User navigates to `/marketplace`.
    2.  Listings displayed with pagination.
    3.  User filters by Industry, Country, Revenue, Price Range (numeric), Keywords (multi-select from predefined list).
    4.  Clicks listing card for details.
*   **Key Data Displayed:** Anonymous listing details, `askingPrice` (number), `isSellerVerified`. "Listed Date" is REMOVED from `ListingCard`.
*   **Intended API Route:** `GET /api/listings` (with query params for filters including `keywords[]` and numeric `minAskingPrice`/`maxAskingPrice`).

## 6. Listing Detail Page

*   **UI Components/Pages:** `/app/listings/[listingId]/page.tsx`
*   **User Flow:**
    1.  Views listing. Main image displayed with clickable thumbnails.
    2.  Displays "Adjusted Cash Flow" if available.
    3.  "Specific Growth Opportunities" shown as bullet points (no narrative).
    4.  Headings for "Business Overview" and "Reason for Selling" no longer include "Anonymous".
    5.  "Verified Seller Information & Documents" section is simplified (no "Operational Details," "Business Model," "Technology Stack").
    6.  "Financials Explanation" section completely removed.
    7.  "Deal Structure Looking For" displays multiple selected options.
*   **Key Data Displayed:** `Listing` fields, conditional display for verified data.
*   **Intended API Route:** `GET /api/listings/[listingId]`

## 7. Inquiry System

### 7.1. Buyer Makes Inquiry
*   **UI Components/Pages:** Button on `/app/listings/[listingId]/page.tsx`.
*   **User Flow:** Buyer clicks "Inquire about Business".
*   **Intended API Route:** `POST /api/inquiries`
*   **Intended Backend Logic:** Authenticate buyer, create `Inquiry` record (status `new_inquiry`, `conversationId = NULL`), notify seller.

### 7.2. Seller Engages with Inquiry
*   **UI Components/Pages:** `/app/seller-dashboard/inquiries/page.tsx`.
*   **User Flow:** Seller views new inquiry, clicks "Engage in Conversation".
*   **Intended API Route:** `POST /api/inquiries/[inquiryId]/engage`
*   **Intended Backend Logic:** Authenticate seller, update `Inquiry.status` based on buyer/seller verification (e.g., to `seller_engaged_buyer_pending_verification` or `ready_for_admin_connection`), notify relevant parties.

### 7.3. Admin Facilitates Connection (Opens Chat)
*   **UI Components/Pages:** `/app/admin/engagement-queue/page.tsx`.
*   **User Flow:** Admin reviews inquiries with status `ready_for_admin_connection`. Clicks "Facilitate Connection & Open Chat".
*   **Intended API Route:** `POST /api/admin/engagements/[inquiryId]/facilitate-connection`
*   **Intended Backend Logic:** Authenticate admin, create `Conversation` record in D1, update `Inquiry.status` to `CONNECTION_FACILITATED_IN_APP_CHAT_OPENED`, set `Inquiry.conversationId`, notify buyer/seller.

## 8. In-App Messaging

### 8.1. Accessing Conversations
*   **Buyer UI:** `/app/dashboard/inquiries/page.tsx` (button "Open Conversation" if `inquiry.status` is `CONNECTION_FACILITATED_IN_APP_CHAT_OPENED` and `conversationId` exists). New "Messages" link in sidebar to `/app/dashboard/messages/page.tsx`.
*   **Seller UI:** `/app/seller-dashboard/inquiries/page.tsx` (similar button). New "Messages" link in sidebar to `/app/seller-dashboard/messages/page.tsx`.

### 8.2. Conversation List Page
*   **UI Components/Pages:** `/app/dashboard/messages/page.tsx`, `/app/seller-dashboard/messages/page.tsx`.
*   **User Flow:** User sees a list of their conversations (other party name, listing title, last message snippet, timestamp, unread count). Clicks to open.
*   **Intended API Route:** `GET /api/conversations`

### 8.3. Conversation View Page (Chat Interface)
*   **UI Components/Pages:** `/app/dashboard/messages/[conversationId]/page.tsx`, `/app/seller-dashboard/messages/[conversationId]/page.tsx`.
*   **User Flow:**
    *   Header shows other party name, link to listing.
    *   Scrollable message area: Own messages (right, light brand color), other's messages (left, white/neutral). Timestamps displayed.
    *   Input area at bottom: Text area, "Send" button.
*   **Intended API Routes:** `GET /api/conversations/[conversationId]/messages` (fetch), `POST /api/conversations/[conversationId]/messages` (send).

## 9. Buyer Dashboard

### 9.1. Buyer Dashboard Overview & Profile
*   **UI:** `/app/dashboard/page.tsx`, `/app/dashboard/profile/page.tsx`.
*   **Functionality:** View stats, manage profile (including Buyer Persona fields). Password change moved to Settings.

### 9.2. Buyer "My Inquiries"
*   **UI:** `/app/dashboard/inquiries/page.tsx`.
*   **Functionality:** View inquiries. If status is "Seller Engaged - Your Verification Required," display explanatory text and a "Verify Profile" button linking to verification page. If status is "Connection Facilitated - Chat Open," "Open Conversation" button links to chat.

### 9.3. Buyer Verification Request
*   **UI:** `/app/dashboard/verification/page.tsx`.
*   **Functionality:** Anonymous buyer requests verification. Explanatory text and "Verify Profile" CTA for unverified users.

### 9.4. Buyer Notifications
*   **UI:** `/app/dashboard/notifications/page.tsx`.
*   **Functionality:** For notifications requiring buyer verification, include a "Verify Your Profile to Proceed" CTA button.

### 9.5. Buyer Settings
*   **UI:** `/app/dashboard/settings/page.tsx`.
*   **Functionality:** Manage notification preferences. "Change Password" UI and functionality now located here.

## 10. Seller Dashboard

### 10.1. Seller Dashboard Overview & Profile
*   **UI:** `/app/seller-dashboard/page.tsx`, `/app/seller-dashboard/profile/page.tsx`.
*   **Functionality:** View stats, manage profile. Password change moved to Settings.

### 10.2. Seller Create/Manage Listings
*   **UI:** `/app/seller-dashboard/listings/create/page.tsx`, `/app/seller-dashboard/listings/page.tsx`, `/app/seller-dashboard/listings/[listingId]/edit/page.tsx`.
*   **Functionality:** Create, view, edit listings. Listing form includes updated fields (`askingPrice` number, `adjustedCashFlow`, `specificGrowthOpportunities` bullets, multi-select `dealStructureLookingFor`).

### 10.3. Seller "My Inquiries"
*   **UI:** `/app/seller-dashboard/inquiries/page.tsx`.
*   **Functionality:** View inquiries. "Engage in Conversation" button initiates engagement flow. If status is "Connection Facilitated - Chat Open," "Open Conversation" button links to chat.

### 10.4. Seller Settings
*   **UI:** `/app/seller-dashboard/settings/page.tsx`.
*   **Functionality:** Manage notification preferences. "Change Password" UI and functionality now located here.

## 11. Admin Panel

### 11.1. User & Listing Management
*   **UI:** `/app/admin/users/`, `/app/admin/listings/`.
*   **Functionality:** Admins can view and manage users and listings.

### 11.2. Verification Queues
*   **UI:** `/app/admin/verification-queue/buyers/`, `/app/admin/verification-queue/sellers/`.
*   **Functionality:** Admin reviews and processes verification requests.

### 11.3. Engagement Queue
*   **UI:** `/app/admin/engagement-queue/page.tsx`.
*   **Functionality:** Admin views engagements ready for connection. Provides a "Facilitate Connection & Open Chat" action which (conceptually) updates inquiry status and creates a `Conversation` record.

### 11.4. Conversation Oversight (NEW)
*   **UI:** `/app/admin/conversations/page.tsx`, `/app/admin/conversations/[conversationId]/page.tsx`.
*   **Functionality:**
    *   List all conversations (buyer, seller, listing, status, last message time).
    *   View full message history of a specific conversation (read-only).
    *   (Conceptual) Archive or manage conversation status.
*   **Intended API Routes:** `GET /api/admin/conversations`, `GET /api/admin/conversations/[conversationId]/messages`, `PUT /api/admin/conversations/[conversationId]/status`.

### 11.5. Admin Analytics
*   **UI:** `/app/admin/analytics/page.tsx`.
*   **Functionality:** Displays platform metrics, including "Total Listings (All Statuses)" and "Closed/Deactivated Listings".
*   **Intended Backend:** D1 queries for these metrics.

This provides a comprehensive walkthrough of current and planned features.

    