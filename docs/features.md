
# Core Feature Walkthroughs

This document details the major features of the BizMatch Asia platform, outlining the user flow, UI components, data involved, and intended backend interactions.

## 1. User Registration

### 1.1. Buyer Registration

*   **UI Components/Pages:**
    *   Main choice page: `/app/auth/register/page.tsx`
    *   Buyer registration form: `/app/auth/register/buyer/page.tsx`
    *   Shared fields component: `/src/components/auth/common-registration-fields.tsx`
    *   Auth card wrapper: `/src/components/auth/auth-card-wrapper.tsx`
*   **User Flow:**
    1.  User navigates to `/auth/register`.
    2.  User clicks "Register as a Buyer".
    3.  User is taken to `/app/auth/register/buyer`.
    4.  User fills out: Full Name, Email, Password, Confirm Password, Phone Number, Country.
    5.  User selects "Buyer Persona Type" (e.g., "Individual Investor / Entrepreneur").
    6.  If "Other" persona is selected, user fills "Please Specify Role".
    7.  User fills (optional) "Investment Focus", "Preferred Investment Size", "Key Industries of Interest".
    8.  User submits the form. A success/error message is displayed based on (currently placeholder) submission logic.
*   **Key Data Collected:** All fields from the `BuyerRegisterSchema` defined in `/app/auth/register/buyer/page.tsx`.
*   **Intended API Route:** `POST /api/auth/register/buyer` (Conceptual path: `src/app/api/auth/register/buyer/route.ts`)
*   **Intended Backend Logic (Clerk & Supabase):**
    1.  **(TODO)** Validate incoming data against `BuyerRegisterSchema`.
    2.  **(TODO)** Check if email already exists in the Supabase `user_profiles` table. If yes, return 409 Conflict error.
    3.  **(TODO)** If new email, create the user in Clerk (using `clerkClient.users.createUser`) with email, password, and basic profile info (e.g., first name from full name).
    4.  **(TODO)** On successful Clerk user creation, store the Clerk User ID and additional profile information (full name, phone, country, buyer persona details, default role 'buyer', initial `verification_status = 'anonymous'`, `is_paid = false`) in the Supabase `user_profiles` table.
    5.  **(TODO)** Trigger Clerk's email verification flow for the new user.
    6.  **(TODO)** Return a success response (e.g., `{ success: true, message: "..." }`) or error messages.

### 1.2. Seller Registration

*   **UI Components/Pages:**
    *   Main choice page: `/app/auth/register/page.tsx`
    *   Seller registration form: `/app/auth/register/seller/page.tsx`
    *   Shared fields component: `/src/components/auth/common-registration-fields.tsx`
    *   Auth card wrapper: `/src/components/auth/auth-card-wrapper.tsx`
*   **User Flow:**
    1.  User navigates to `/auth/register`.
    2.  User clicks "Register as a Seller".
    3.  User is taken to `/app/auth/register/seller`.
    4.  User fills out: Full Name, Email, Password, Confirm Password, Phone Number, Country.
    5.  User fills (optional) "Initial Company Name".
    6.  User submits the form. A success/error message is displayed.
*   **Key Data Collected:** All fields from the `SellerRegisterSchema` in `/app/auth/register/seller/page.tsx`.
*   **Intended API Route:** `POST /api/auth/register/seller` (Conceptual path: `src/app/api/auth/register/seller/route.ts`)
*   **Intended Backend Logic (Clerk & Supabase):**
    1.  **(TODO)** Validate incoming data against `SellerRegisterSchema`.
    2.  **(TODO)** Check Supabase for existing email.
    3.  **(TODO)** If new email, create user in Clerk.
    4.  **(TODO)** Store Clerk User ID and profile information (full name, phone, country, initial company name, default role 'seller', initial `verification_status = 'anonymous'`, `is_paid = false`) in Supabase `user_profiles`.
    5.  **(TODO)** Trigger Clerk's email verification flow.
    6.  **(TODO)** Return a success response or error messages.

## 2. User Login

*   **UI Components/Pages:**
    *   Login form: `/app/auth/login/page.tsx`
    *   Auth card wrapper: `/src/components/auth/auth-card-wrapper.tsx`
*   **User Flow:**
    1.  User navigates to `/auth/login`.
    2.  User enters Email and Password.
    3.  User clicks "Forgot password?" to go to `/app/auth/forgot-password/page.tsx` if needed.
    4.  User submits the login form. A success/error message is displayed.
*   **Key Data Collected:** Email, Password from `LoginSchema`.
*   **Intended API Route:** This flow would primarily be handled by Clerk's client-side SDKs and its built-in sign-in mechanisms. A custom API route might only be needed for pre/post login hooks.
*   **Intended Backend Logic (Clerk & Supabase):**
    1.  **(TODO)** Clerk handles authentication.
    2.  **(TODO)** On successful login, update `last_login` timestamp in Supabase `user_profiles` table for the logged-in user.
    3.  **(TODO)** Clerk manages session and redirects (e.g., to `/dashboard` or `/seller-dashboard` based on role).

## 3. Business Listing Creation (by Seller)

*   **UI Components/Pages:**
    *   Listing creation form: `/app/seller-dashboard/listings/create/page.tsx`
    *   Seller dashboard layout: `/app/seller-dashboard/layout.tsx`
*   **User Flow:**
    1.  Seller navigates to `/seller-dashboard` and clicks "Create New Listing" (either from overview or sidebar).
    2.  Seller fills out the multi-section form:
        *   Section 1: Basic Info (Anonymous Title, Industry, Location).
        *   Section 2: Business Profile & Operations (Anonymous Description, Key Strengths, Business Model, Year Established, Registered Name, Website, Social Links, Employees, Tech Stack).
        *   Section 3: Financial Performance (Anonymous Ranges, Specific TTM figures, Financial Explanation, Document upload placeholders).
        *   Section 4: Deal & Seller Info (Deal Structure, Anonymous Reason, Detailed Reason, Seller Role, Transition Support, Document upload placeholders).
        *   Section 5: Growth & Future Potential (Narrative, Specific Opportunities).
    3.  Seller submits the form. A toast notification indicates success/failure (currently placeholder).
*   **Key Data Collected:** All fields from `ListingSchema` in `/app/seller-dashboard/listings/create/page.tsx`. File inputs are UI placeholders.
*   **Intended API Route:** `POST /api/listings` (Conceptual path: `src/app/api/listings/route.ts`)
*   **Intended Backend Logic (Clerk & Supabase):**
    1.  **(TODO)** Authenticate the request (ensure user is a logged-in seller using Clerk `auth().userId`).
    2.  **(TODO)** Validate incoming data against `ListingSchema`.
    3.  **(TODO)** Store the new listing in the Supabase `listings` table, associating it with the `seller_id` (from authenticated user).
    4.  **(TODO)** Set default listing `status` (e.g., 'active' or 'pending_verification') and `is_seller_verified` (based on the seller's current profile status).
    5.  **(TODO)** Handle file uploads (for document placeholders) to Supabase Storage and link their URLs to the listing record.
    6.  **(TODO)** Return the created listing data or a success message.

## 4. Marketplace Display & Browsing

*   **UI Components/Pages:**
    *   Main marketplace: `/app/marketplace/page.tsx`
    *   Filter component: `/src/components/marketplace/filters.tsx`
    *   Listing card: `/src/components/marketplace/listing-card.tsx`
    *   Sort dropdown: `/src/components/marketplace/sort-dropdown.tsx`
    *   Pagination: `/src/components/shared/pagination-controls.tsx`
*   **User Flow:**
    1.  User navigates to `/marketplace`.
    2.  Page loads listings (currently from `sampleListings` with client-side pagination).
    3.  User can use filters (Industry, Country, Revenue, Price, Keywords). (Filtering logic is currently UI only).
    4.  User can use the sort dropdown. (Sorting logic is currently UI only).
    5.  User can navigate through paginated results.
    6.  User clicks on a listing card to view details.
*   **Key Data Displayed:** Anonymous listing details (`listingTitleAnonymous`, `industry`, `locationCityRegionGeneral`, `locationCountry`, `annualRevenueRange`, `askingPriceRange`, `isSellerVerified` for badge) on cards.
*   **Intended API Route:** `GET /api/listings` (Conceptual path: `src/app/api/listings/route.ts`)
*   **Intended Backend Logic (Supabase):**
    1.  **(TODO)** Accept query parameters for filtering, sorting, and pagination.
    2.  **(TODO)** Construct a Supabase query to fetch `listings` that are 'active'.
    3.  **(TODO)** Apply filters and sorting.
    4.  **(TODO)** Implement pagination logic.
    5.  **(TODO)** Return a paginated list of listings (only public/anonymous fields + seller's verification status) and total count/pages.

## 5. Listing Detail Page

*   **UI Components/Pages:** `/app/listings/[listingId]/page.tsx`
*   **User Flow:**
    1.  User navigates to a specific listing page (e.g., from marketplace).
    2.  Page displays detailed information.
    3.  "Potential for Growth Narrative" and "Specific Growth Opportunities" are displayed.
    4.  Document sections (Financial Snapshot, Ownership, etc.) show "Visible to paid, verified buyers" or "Not provided" based on placeholder data.
    5.  An "Inquire about Business" button is present.
*   **Key Data Displayed:** All fields from the `Listing` type, with censorship logic for verified details (currently based on placeholder `currentUser` and `showVerifiedDetails` logic).
*   **Intended API Route:** `GET /api/listings/[listingId]` (Conceptual path: `src/app/api/listings/[listingId]/route.ts`)
*   **Intended Backend Logic (Clerk & Supabase):**
    1.  **(TODO)** Fetch the specific listing from Supabase using `listingId`.
    2.  **(TODO)** Fetch associated seller details (especially `is_verified` and `is_paid`).
    3.  **(TODO)** Determine the requesting user's status (authenticated, verified, paid) from Clerk session and Supabase `user_profiles`.
    4.  **(TODO)** Return listing data, selectively including verified fields (`actualCompanyName`, `fullBusinessAddress`, specific financials, document URLs) only if the listing's seller is verified AND the current viewing buyer is verified and paid.

## 6. Inquiry System (Initial UI)

*   **UI Components/Pages:** Button on `/app/listings/[listingId]/page.tsx`.
*   **User Flow:** A buyer on a listing detail page clicks "Inquire about Business". (Currently, button is disabled if `currentUser` is not a buyer).
*   **Key Data Potentially Collected:** `listingId`, `buyerId` (from session).
*   **Intended API Route:** `POST /api/inquiries` (Conceptual path: `src/app/api/inquiries/route.ts`)
*   **Intended Backend Logic (Clerk & Supabase):**
    1.  **(TODO)** Authenticate the request (ensure user is a logged-in buyer via Clerk).
    2.  **(TODO)** Validate `listingId`.
    3.  **(TODO)** Fetch `sellerId` from the listing in Supabase.
    4.  **(TODO)** Create a new record in the Supabase `inquiries` table, linking `buyer_id`, `listing_id`, `seller_id`, `timestamp`, and setting initial `status` (e.g., 'new_inquiry').
    5.  **(TODO)** Implement a notification system to inform the seller about the new inquiry.
    6.  **(TODO)** Return a success response.

## 7. Buyer Dashboard

### 7.1. Buyer Dashboard Overview
*   **UI Components/Pages:** `/app/dashboard/page.tsx` (Context: Buyer role)
*   **User Flow:** Logged-in buyer accesses their dashboard.
*   **Key Data Displayed:** Welcome message, active inquiries count, verification status card (with CTA if not verified), list of recent inquiries. Data is from `sampleUsers` and `sampleBuyerInquiries`.
*   **Intended API Routes (Conceptual):** `GET /api/dashboard/buyer/stats` (for counts), `GET /api/dashboard/buyer/recent-inquiries`.

### 7.2. Buyer Profile Management
*   **UI Components/Pages:** `/app/dashboard/profile/page.tsx` (Context: Buyer role)
*   **User Flow:** Buyer views and edits their profile, including new Buyer Persona fields. Password change functionality present.
*   **Key Data Managed:** `User` profile fields from `ProfileSchema`.
*   **Intended API Route:** `PUT /api/profile`
*   **Intended Backend Logic (TODO):** See Section 1.3 (User Profile Update) & 1.4 (Password Change) under "API Route Specifications". Ensure Buyer Persona fields are saved to Supabase.

### 7.3. Buyer "My Inquiries"
*   **UI Components/Pages:** `/app/dashboard/inquiries/page.tsx` (Context: Buyer role)
*   **User Flow:** Buyer views their past inquiries, their statuses (e.g., "Inquiry Sent", "Seller Engaged - Your Verification Required"), and can link to listings or verification.
*   **Key Data Displayed:** `Inquiry` objects from `sampleBuyerInquiries`, filtered for the current buyer.
*   **Intended API Route:** `GET /api/inquiries?role=buyer` (Conceptual)

### 7.4. Buyer Verification Request
*   **UI Components/Pages:** `/app/dashboard/verification/page.tsx` (Context: Buyer role)
*   **User Flow:** Anonymous buyer requests verification via a form (name, email, phone pre-filled).
*   **Key Data Collected:** `bestTimeToCall`, `notes`.
*   **Intended API Route:** `POST /api/verification-requests` (with `type: 'buyer'`)
*   **Intended Backend Logic (TODO):** See Section 4.1 under "API Route Specifications".

## 8. Seller Dashboard

### 8.1. Seller Dashboard Overview
*   **UI Components/Pages:** `/app/seller-dashboard/page.tsx`
*   **User Flow:** Logged-in seller accesses their dashboard.
*   **Key Data Displayed:** Welcome, "Create New Listing" CTA, stats (active listings, inquiries), verification CTA, recent active listings. Data from `sampleUsers`, `sampleListings`, `sampleSellerInquiries`.
*   **Intended API Routes (Conceptual):** `GET /api/seller-dashboard/stats`, `GET /api/seller-dashboard/recent-listings`.

### 8.2. Seller Profile Management
*   **UI Components/Pages:** `/app/seller-dashboard/profile/page.tsx`
*   **User Flow:** Seller views and edits their profile (Full Name, Phone, Country, Initial Company Name). Password change.
*   **Key Data Managed:** `User` profile fields from `ProfileSchema`.
*   **Intended API Route:** `PUT /api/profile`
*   **Intended Backend Logic (TODO):** See Section 1.3 (User Profile Update) & 1.4 (Password Change) under "API Route Specifications". Ensure seller-specific fields are saved.

### 8.3. Seller Create/Manage Listings
*   **Create UI:** `/app/seller-dashboard/listings/create/page.tsx` (Covered in Section 3 above)
*   **Manage UI:** `/app/seller-dashboard/listings/page.tsx`
*   **Edit UI:** `/app/seller-dashboard/listings/[listingId]/edit/page.tsx`
*   **User Flow (Manage):** Seller views their listings, can edit, deactivate/reactivate, view inquiries per listing, request verification.
*   **Intended API Routes (Conceptual):**
    *   `GET /api/listings?sellerId=[currentUserId]`
    *   `PUT /api/listings/[listingId]` (for content edits and status changes e.g., active/inactive)
*   **Intended Backend Logic (TODO for Edit/Status Change):** Authenticate seller, verify ownership, validate data, update Supabase `listings`.

### 8.4. Seller "My Inquiries"
*   **UI Components/Pages:** `/app/seller-dashboard/inquiries/page.tsx`
*   **User Flow:** Seller views inquiries for their listings, buyer status, and can "Engage in Conversation".
*   **Key Data Displayed:** `Inquiry` objects from `sampleSellerInquiries`, filtered for the current seller.
*   **Intended API Route:** `GET /api/inquiries?role=seller` and `POST /api/inquiries/[inquiryId]/engage` (Conceptual)
*   **Intended Backend Logic (TODO for Engage):** See Section 4.3 under "API Route Specifications".

### 8.5. Seller/Listing Verification Request
*   **UI Components/Pages:** `/app/seller-dashboard/verification/page.tsx`
*   **User Flow:** Seller requests verification for their profile or a specific listing via a form.
*   **Key Data Collected:** `listingId` (optional), `bestTimeToCall`, `notes`.
*   **Intended API Route:** `POST /api/verification-requests` (with `type: 'seller_profile'` or `type: 'listing'`)
*   **Intended Backend Logic (TODO):** See Section 4.1 under "API Route Specifications".

## 9. Admin Panel

### 9.1. User Management
*   **UI Components/Pages:** `/app/admin/users/page.tsx`, `/app/admin/users/[userId]/page.tsx`
*   **User Flow:** Admin views user list, filters, views detailed user profiles (including buyer persona fields and `isPaid` status), toggles verification and paid statuses (placeholder actions).
*   **Intended API Routes (Conceptual):** `GET /api/admin/users`, `GET /api/admin/users/[userId]`, `PUT /api/admin/users/[userId]/status`.

### 9.2. Listing Management
*   **UI Components/Pages:** `/app/admin/listings/page.tsx`, `/app/admin/listings/[listingId]/page.tsx`
*   **User Flow:** Admin views all listings, filters, views full listing details (including all seller-provided data and document placeholders), and has placeholder actions for approval/rejection.
*   **Intended API Routes (Conceptual):** `GET /api/admin/listings`, `GET /api/admin/listings/[listingId]`, `PUT /api/admin/listings/[listingId]/status`.

### 9.3. Verification Queues
*   **UI Components/Pages:** `/app/admin/verification-queue/buyers/page.tsx`, `/app/admin/verification-queue/sellers/page.tsx`
*   **User Flow:** Admin views pending buyer or seller/listing verification requests, updates statuses (placeholder actions).
*   **Intended API Routes (Conceptual):** `GET /api/admin/verification-requests`, `PUT /api/admin/verification-requests/[requestId]/status`.

### 9.4. Engagement Queue
*   **UI Components/Pages:** `/app/admin/engagement-queue/page.tsx`
*   **User Flow:** Admin views engagements where both parties are verified and ready for connection, marks as "Connection Initiated" (placeholder action).
*   **Intended API Routes (Conceptual):** `GET /api/admin/engagements`, `PUT /api/admin/engagements/[engagementId]/status`.

### 9.5. Admin Analytics & Reporting
*   **UI Components/Pages:** `/app/admin/page.tsx` (Overview), `/app/admin/analytics/page.tsx` (Detailed)
*   **User Flow:** Admin views platform metrics, including new revenue breakdowns (Revenue from Buyers/Sellers) and connection breakdowns (Active/Closed Successful Connections).
*   **Key Data Displayed:** Metrics from `sampleAdminDashboardMetrics`.
*   **Intended API Routes (Conceptual):** `GET /api/admin/analytics/overview`, `GET /api/admin/analytics/detailed`.

This provides a comprehensive walkthrough of the prototyped features and their intended backend interactions.
