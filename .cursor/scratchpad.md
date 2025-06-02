# Nobridge Project - Backend Implementation: Supabase

## Background and Motivation

Nobridge is an ambitious B2B marketplace platform connecting SME business owners in Asia with buyers/investors. It's essentially "Flippa for Asian SMEs" but with sophisticated verification workflows, admin-mediated connections, and built-in messaging.

**Current State**: Complete Next.js frontend with impressive UI/UX, comprehensive user flows, and detailed TypeScript interfaces. All data currently comes from placeholder files.

**Goal**: Build a complete backend to make this static frontend into a fully functional marketplace that can launch within 4 weeks.

**Current Goal**: Implement the backend using Supabase to make the platform fully functional. This involves setting up the database, authentication, storage, and business logic (API endpoints/serverless functions) based on the designs in `docs/` and `cursor-docs/`.

**Key Documents Referenced:**
- `docs/index.md`: Project overview and vision.
- `docs/backend-todos.md`: Detailed list of backend functionalities (originally for Cloudflare, now adapted for Supabase).
- `docs/data-structures.md`: TypeScript interfaces defining data models.
- `cursor-docs/03-database-schema.md`: PostgreSQL schema for Supabase.
- `cursor-docs/05-api-design.md`: REST API endpoint specifications.

The existing plan in this scratchpad already recommended Supabase and laid out a general timeline, which we will now refine and execute.

## Key Challenges and Analysis

### Technical Complexity Assessment: HIGH
- **Multi-role system**: 3 user types (buyer/seller/admin) with different dashboards
- **Complex state machines**: Inquiry → Engagement → Admin facilitation → Chat workflows
- **Real-time messaging**: Admin-facilitated chat between verified users
- **Verification system**: Manual document review and approval workflows
- **Advanced marketplace**: Filtering, search, pagination, multiple content tiers

### Business Requirements
- **Trust-first approach**: Manual verification builds credibility
- **Admin-mediated connections**: Platform facilitates high-value conversations
- **Subscription model**: Tiered pricing for enhanced features
- **Asia-focused**: Regional specialization for SME market

**Supabase Specific Considerations:**
- **RLS Policies**: Implementing robust Row Level Security is critical for data protection and multi-tenancy.
- **Edge Functions vs. Database Functions**: Deciding where to implement business logic (e.g., complex validation, triggers).
- **Realtime Setup**: Configuring realtime for messaging and notifications.
- **Storage Management**: Setting up buckets and policies for user uploads (e.g., verification documents, listing images).
- **Auth Hooks**: Potentially using Supabase Auth hooks for custom logic post-registration or login.

## Planner's Recommendations

### Technology Stack Choice: Supabase + Vercel
**Decision Rationale**:
- **Speed over perfection**: 1-2 week timeline vs 5-6 weeks with alternatives
- **Built-in features**: Auth, real-time, storage, admin UI out of the box
- **PostgreSQL power**: Complex queries, JSON fields, full-text search
- **Reduced infrastructure work**: Focus on business logic, not setup

**Alternative Considered**: Cloudflare Workers + D1 + R2
- **Pros**: Global performance, cost optimization at scale
- **Cons**: More infrastructure setup, custom implementations needed
- **Verdict**: Better for post-MVP optimization, not initial launch

### Chat Service Decision Matrix
**Supabase Realtime Chat Component** wins for our use case:

| Service | Cost | Pros | Cons | Verdict |
|---------|------|------|------|---------|
| **Supabase Realtime** | $0 (bundled) | Drop-in React component, full backend | Limited advanced features | ✅ **Perfect for MVP** |
| Twilio Conversations | $0.05/MAU | Global infra, SMS bridge | Additional service cost | Future consideration |
| ChatKitty | $79/mo | Pre-built UI | Fixed cost regardless of usage | Over-engineered for MVP |
| Stream/Sendbird | $399+/mo | Enterprise features | Expensive for startup | Post-scale consideration |

**Decision**: Start with Supabase built-in chat, migrate to Twilio if we need SMS/WhatsApp integration later.

### Supabase vs Firebase Strategic Analysis
**Why Supabase wins for Nobridge:**

| Factor | Supabase | Firebase | Winner |
|--------|----------|----------|---------|
| **Data Model** | PostgreSQL (SQL, joins, triggers) | Firestore (NoSQL, query limitations) | ✅ **Supabase** - Perfect for marketplace |
| **Self-hosting** | Yes (Docker, cloud portability) | No (Google lock-in) | ✅ **Supabase** - Future flexibility |
| **Cost Predictability** | Fixed tiers, clear add-ons | Pay-per-read uncertainty | ✅ **Supabase** - Budget certainty |
| **Real-time** | PostgreSQL → WAL → WebSockets | Firestore streams | ✅ **Supabase** - Simpler architecture |
| **Vendor Lock-in** | Low (SQL + open APIs) | High (proprietary APIs) | ✅ **Supabase** - Migration possible |
| **Our Use Case** | Relational data, complex queries | Chat works, but joins are painful | ✅ **Supabase** - Natural fit |

**Firebase Advantages We're Trading Off:**
- Mobile analytics (FCM, Crashlytics) - Not critical for web-first B2B
- Larger ecosystem - Supabase ecosystem growing rapidly
- Battle-tested scale - We'll address if/when we hit scale issues

### Analytics Strategy (Minimal Viable)
**Phase 1 (MVP)**: Custom events table in Supabase
```sql
CREATE TABLE user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  event_type VARCHAR(50) NOT NULL, -- 'listing_viewed', 'inquiry_sent', etc.
  event_data JSONB, -- Additional context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Phase 2 (Post-Launch)**: Add PostHog for funnel analysis
- **Cost**: $0 for first 1M events/month
- **Integration**: Drop-in JavaScript + user ID mapping
- **Value**: Conversion funnel optimization

**Phase 3 (Scale)**: Consider Metabase for SQL dashboards
- Self-hosted on same infrastructure
- Direct PostgreSQL integration
- Custom business intelligence

### Architecture Overview
```
Frontend: Next.js 15 + TypeScript + ShadCN UI (✅ Complete)
Backend: Supabase (PostgreSQL + Auth + Storage + Realtime Chat)
Deployment: Vercel + Email Service (Resend)
Analytics: Custom events → PostHog (post-MVP)
Error Tracking: Sentry (free tier)
```

### Refined Timeline Estimate
**MVP Timeline: 1-2 weeks** (Revised down from 3 weeks)

**Why This Timeline is Realistic**:
- Frontend already complete (saves 4-6 weeks)
- Supabase handles most complex parts (auth, real-time, storage, chat)
- Clear TypeScript interfaces guide implementation
- Most tasks are integration work, not new development

**Major Risk Eliminated**:
- Real-time messaging complexity → Using Supabase drop-in React chat component
- Custom WebSocket management → Handled by Supabase Realtime
- Message UI development → Pre-built component with Tailwind styling

**Cost**: ~$65/month (Supabase Pro $25 + Vercel Pro $20 + Email $20)
**Chat Cost**: $0 additional (bundled in Supabase Pro)

## High-level Task Breakdown

### Week 1: Core Functionality (Days 1-5)

#### Day 1-2: Foundation (Supabase Setup & Schema)
- **Task 1.1: Supabase Project Setup**
  - Create a new Supabase project.
  - Configure basic settings (Region, Password).
  - Document API URL and `anon` key.
  - Set up necessary environment variables in the Next.js project (`.env.local`) for Supabase connection (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
  - **Success Criteria**: Supabase project is live. Next.js app can connect to Supabase (basic client instantiation).
- **Task 1.2: Database Schema Implementation**
  - Review `cursor-docs/03-database-schema.md` and `docs/data-structures.md`.
  - Execute SQL scripts in Supabase SQL Editor to create all tables:
    - `user_profiles`
    - `listings`
    - `inquiries`
    - `conversations`
    - `messages`
    - `otp_verifications`
    - `verification_requests` (ensure full schema is available/created)
    - `user_events` (for basic analytics, as per previous plan)
  - Define primary keys, foreign keys, relationships, and indexes as specified.
  - Enable RLS on all relevant tables.
  - **Success Criteria**: All tables created in Supabase. Relationships and indexes are correctly set up. RLS is enabled.
- **Task 1.3: Basic RLS Policies (Initial Pass)**
  - Implement initial RLS policies for key tables based on `cursor-docs/03-database-schema.md` and general security principles:
    - `user_profiles`: Users can select/update their own profile. Admin can select/update all.
    - `listings`: Sellers can CRUD their own listings. Authenticated users can select public listings.
    - Others TBD as functionality is built.
  - **Success Criteria**: Basic RLS policies are in place and tested for `user_profiles` and `listings` (e.g., using Supabase SQL Editor with different roles).

**Success Criteria for Day 1-2**: Supabase project initialized, database schema implemented, and basic RLS policies are functional.

#### Day 3: Authentication & User Profiles (Supabase Auth + APIs)
- **Task 2.1**: Supabase Auth Setup
  - [x] Create authentication utilities and types ✅ COMPLETED
  - [x] Set up auth helper functions (signUp, signIn, signOut, etc.) ✅ COMPLETED
  - [x] Create test authentication page ✅ COMPLETED
  - [x] Test registration flow ✅ COMPLETED
  - [x] Test login flow ✅ COMPLETED
  - [x] Test sign out flow ✅ COMPLETED
  - **Success Criteria**: Basic auth setup complete with working registration, login, and logout. ✅ ACHIEVED
- **Task 2.2**: User Registration Integration
  - [x] Integrate auth utilities with existing registration UI components ✅ COMPLETED
  - [x] Update buyer registration page to use Supabase auth ✅ COMPLETED
  - [x] Update seller registration page to use Supabase auth ✅ COMPLETED
  - [x] Test registration flows with existing UI ✅ COMPLETED
  - **Success Criteria**: Beautiful existing UI now connected to working Supabase auth backend. ✅ ACHIEVED
- **Task 2.3**: User Login Integration ✅ COMPLETED
  - [x] Integrate auth utilities with existing login UI ✅ COMPLETED
  - [x] Test login flow with existing UI ✅ COMPLETED
  - [x] Implement auth state management in navbar ✅ COMPLETED
  - [x] Add logout functionality with profile dropdown ✅ COMPLETED
  - [x] Implement role-based dashboard routing ✅ COMPLETED
  - **Success Criteria**: Complete auth system with beautiful UI, real-time state management, and logout functionality. ✅ ACHIEVED
- [x] **Task 2.4**: Email Verification ✅ COMPLETED (with UX improvements!)
  - [x] Enabled email confirmations in Supabase config (`enable_confirmations = true`) ✅ COMPLETED
  - [x] Updated auth utilities with `verifyEmailOtp` method using Supabase's built-in verification ✅ COMPLETED
  - [x] Updated verify-otp page to use real Supabase email verification instead of placeholder logic ✅ COMPLETED
  - [x] Added resend verification email functionality ✅ COMPLETED
  - [x] **BONUS**: Fixed RLS policy issues preventing profile creation during signup ✅ COMPLETED
  - [x] **BONUS**: Created service role API endpoint to bypass RLS for profile creation ✅ COMPLETED
  - [x] **BONUS**: Fixed auth callback route for magic link auto-login ✅ COMPLETED
  - [x] **BONUS**: Created comprehensive email template with both OTP and magic link ✅ COMPLETED
  - [x] **BONUS**: Simplified UI by removing redundant tabs - email now contains both options ✅ COMPLETED
  - **Success Criteria**: Email verification flow works with real Supabase OTP tokens. User status reflects verification. Magic link auto-login works. Beautiful email template with dual verification methods. ✅ FULLY ACHIEVED WITH ENHANCEMENTS!
- [x] **Task 2.5**: Profile Creation API Debugging & Enhancement ✅ COMPLETED
  - [x] Fixed JSON parsing errors in API endpoint ✅ COMPLETED
  - [x] Added comprehensive error handling for duplicate profiles (HTTP 409) ✅ COMPLETED
  - [x] Added foreign key constraint violation handling (HTTP 400) ✅ COMPLETED
  - [x] Implemented pre-check logic to prevent duplicate profile creation ✅ COMPLETED
  - [x] Added user verification debugging for auth.users relationship ✅ COMPLETED
  - [x] Tested with real Supabase Auth users to ensure proper integration ✅ COMPLETED
  - **Success Criteria**: Robust profile creation API that handles all edge cases gracefully ✅ ACHIEVED

**Success Criteria for Day 3**: Complete authentication flow including registration, login, email verification, and robust profile creation with comprehensive error handling.

#### Day 4: Listings & Marketplace (Supabase DB + Storage + APIs)
- **Task 3.1**: Create Listing
  - Implement `POST /api/listings` (for sellers).
  - Validate input data (use Zod schemas).
  - Insert data into `listings` table, linking to `seller_id`.
  - Handle file uploads using Supabase Storage for:
    - Listing images (up to 5, for `listings.image_urls` JSONB array).
    - Other listing-specific documents if submitted during creation (e.g., for fields like `financialDocumentsUrl`, `keyMetricsReportUrl`, etc., as defined in `docs/data-structures.md`).
  - Backend will receive files, upload them to Supabase Storage (e.g., to a 'listing-assets' bucket with appropriate RLS), and store the generated URLs in the corresponding `listings` table fields.
  - **Success Criteria**: Authenticated sellers can create new listings with text data, images, and other specified documents. Files are stored in Supabase Storage, and their URLs are saved in the `listings` table.
- **Task 3.2**: Get Listings (Marketplace View with FTS)
  - Implement `GET /api/listings` with filtering (industry, country, price range, keywords - FTS), sorting, and pagination.
  - Query `listings` table, respecting RLS (e.g., only show `active` or `verified_anonymous` listings to public).
  - Implement Full-Text Search using the GIN index on `listings` (see `cursor-docs/03-database-schema.md`).
  - **Success Criteria**: Public users can browse and filter listings. Pagination and sorting work. Full-text search is functional.
- **Task 3.3**: Get Single Listing (Public Detail)
  - Implement `GET /api/listings/[listingId]`.
  - Fetch listing from `listings` table.
  - Conditionally include more detailed fields based on listing status and user roles/verification (e.g., anonymous users see limited info, verified buyers might see more if seller is verified). This requires careful RLS or backend logic.
  - **Success Criteria**: Users can view details of a single listing, with information revealed based on defined rules.
- **Task 3.4**: Update Listing (Seller)
  - Implement `PUT /api/listings/[listingId]`.
  - Authenticate seller and verify ownership of the listing.
  - Validate input data.
  - Update `listings` table. Handle image updates/deletions in Supabase Storage.
  - **Success Criteria**: Sellers can update their own listings, including images.
- **Task 3.5**: Delete Listing (Seller)
  - Implement `DELETE /api/listings/[listingId]` (or an "archive/deactivate" status change).
  - Authenticate seller and verify ownership.
  - Delete from `listings` table or update status to `inactive`/`archived`. Handle associated Storage objects if deleting.
  - **Success Criteria**: Sellers can delete/deactivate their listings.

**Success Criteria for Day 4**: Core listing management (CRUD) is functional. Marketplace view with filtering/search is available. Supabase Storage is integrated for listing images.

#### Day 5: Inquiry System (Supabase DB + APIs)
- **Task 4.1**: Create Inquiry
  - Implement `POST /api/inquiries`.
  - Authenticate buyer. Validate `listingId`. Fetch `seller_id`.
  - Create a record in `inquiries` table (status `new_inquiry`).
  - Consider a database trigger or function to update `listings.inquiry_count`.
  - (Notifications to seller will be handled later with a dedicated notification system task).
  - **Success Criteria**: Authenticated buyers can submit inquiries for listings. Inquiry record is created.
- **Task 4.2**: Get Inquiries (User Dashboards)
  - Implement `GET /api/inquiries` for both buyers and sellers.
  - Authenticate user. Fetch inquiries based on `buyer_id` or `seller_id`.
  - Join with `listings` and `user_profiles` to provide necessary context.
  - **Success Criteria**: Buyers and sellers can view their respective inquiries on their dashboards.
- **Task 4.3**: Seller Engages with Inquiry / Update Inquiry Status
  - Implement `POST /api/inquiries/[inquiryId]/engage` (or a more generic `PUT /api/inquiries/[inquiryId]/status`).
  - Authenticate seller and verify ownership of the listing associated with the inquiry.
  - Update `inquiries.status` based on workflow (e.g., `seller_engaged_buyer_pending_verification`).
  - (Notifications to relevant parties later).
  - **Success Criteria**: Sellers can engage with an inquiry, updating its status.

**Success Criteria for Day 5**: Complete inquiry system is functional. Buyers can create inquiries, and users can view their inquiries. Sellers can update inquiry status.

### Week 2: Polish & Launch (Days 6-10)

#### Day 6-7: Advanced Features (Verification, Chat, Admin)
- **Task 5.1**: Verification System (User & Listing Requests)
  - Implement `POST /api/verification-requests` (as per `docs/backend-todos.md`).
  - User submits verification request (e.g., for `user_profiles.verification_status` or `listings.status`).
  - Store request in `verification_requests` table.
  - Update related entity status to `pending_verification`.
  - (Admin part: Admin APIs to review and approve/reject these requests).
  - **Success Criteria**: Users can submit verification requests. Requests are stored and statuses updated.
- **Task 5.2**: Supabase Realtime Chat Integration
  - Set up Supabase Realtime for the `conversations` and `messages` tables.
  - Implement `GET /api/conversations` to list user's active conversations (linked via `inquiries.conversation_id`).
  - Implement `GET /api/conversations/[conversationId]/messages` to fetch messages for a conversation. Mark messages as read.
  - Implement `POST /api/conversations/[conversationId]/messages` to send a message.
  - Frontend subscribes to Realtime updates for new messages.
  - The "Admin Facilitation" step (`POST /api/admin/engagements/[inquiryId]/facilitate-connection`) will create the `conversations` record and link it to the `inquiry`. This will be part of Admin tasks.
  - **Success Criteria**: Basic real-time chat between two users (buyer/seller of a facilitated inquiry) is functional. Users can view conversations and send/receive messages.
- **Task 5.3**: Basic Admin Panel APIs (User, Listing, Verification, Chat Facilitation)
  - Implement Admin authentication/role check for these routes.
  - `GET /api/admin/users`: List users with filters.
  - `PUT /api/admin/users/[userId]/status`: Update user `verification_status`, `is_paid`.
  - `GET /api/admin/listings`: List listings with filters.
  - `PUT /api/admin/listings/[listingId]/status`: Update listing `status`.
  - `GET /api/admin/verification-requests`: List verification requests.
  - `PUT /api/admin/verification-requests/[requestId]/status`: Approve/reject requests, updating related `user_profiles` or `listings` statuses.
  - `POST /api/admin/engagements/[inquiryId]/facilitate-connection`: Admin creates a `conversation` record, links it to the `inquiry`, and updates statuses.
  - **Success Criteria**: Admin can view users, listings, verification requests. Admin can update statuses and facilitate chat connections.

**Success Criteria for Day 6-7**: Verification request submission is working. Real-time chat is integrated. Basic admin functionalities for user, listing, and verification management are available. Admin can facilitate chat.

#### Day 8-9: Integration, Testing, Notifications
- **Task 6.1**: Frontend Integration & E2E Testing
  - Thoroughly connect all frontend components to the new Supabase backend APIs.
  - Perform end-to-end testing of all user flows: registration, login, profile update, listing creation/browsing/update, inquiry submission, chat, admin actions.
  - **Success Criteria**: Frontend is fully integrated with the backend. All major user flows are tested and functional.
- **Task 6.2**: Notification System (Basic)
  - Design `notifications` table schema (e.g., `user_id`, `message`, `link`, `is_read`, `created_at`).
  - Implement logic (DB triggers or within API calls) to create notifications for key events:
    - New inquiry for seller.
    - Inquiry status update for buyer/seller.
    - New message in conversation.
    - Verification status update.
  - Implement `GET /api/notifications` for users to fetch their notifications.
  - Implement `POST /api/notifications/[notificationId]/mark-read`.
  - (Real-time delivery of notifications can be a stretch goal, polling is MVP).
  - **Success Criteria**: Basic notification system is in place. Users receive notifications for key events.
- **Task 6.3**: Advanced RLS Policies & Security Review
  - Review and refine all RLS policies for completeness and correctness.
  - Test access patterns thoroughly for all roles and data states.
  - Check for any potential security vulnerabilities (e.g., SQL injection - though Supabase client helps, function inputs, etc.).
  - **Success Criteria**: RLS policies are robust and secure. Security review completed.

**Success Criteria for Day 8-9**: Frontend fully integrated and tested. Basic notification system working. RLS policies are comprehensive.

#### Day 10: Final Testing, Deployment Prep
- **Task 7.1**: Final E2E Testing & Bug Fixing
  - Conduct a final round of E2E testing across all features.
  - Address any identified bugs.
  - **Success Criteria**: Platform is stable and major bugs are fixed.
- **Task 7.2**: Supabase Production Checklist
  - Review Supabase production guidelines (e.g., database backups, monitoring, security settings like MFA for Supabase dashboard).
  - Ensure appropriate database indexes are in place for performance.
  - Consider database performance and query optimization if needed.
  - **Success Criteria**: Supabase project is configured for production readiness.
- **Task 7.3**: Deployment to Vercel (if not already continuous)
  - Ensure Next.js app (with Supabase client) is correctly deployed to Vercel.
  - All environment variables are correctly set in Vercel for production.
  - **Success Criteria**: Application is deployed and accessible in a production-like environment.

**Success Criteria for Day 10**: Platform is thoroughly tested, stable, and ready for deployment. Supabase project is production-ready.

## Project Status Board

### ✅ COMPLETED TASKS
- [x] **Authentication System (Day 3)** - Complete auth flow with registration, login, logout, email verification
- [x] **User Profile Creation API** - Robust API endpoint with comprehensive error handling
- [x] **Email Verification Integration** - Real Supabase email verification with improved UX
- [x] **Error Handling & Edge Cases** - JSON parsing, duplicate prevention, constraint violations

### 🔄 IN PROGRESS
- [ ] **Listings Management** - Creating, editing, and displaying business listings
- [ ] **Search & Filtering** - Implementing marketplace search functionality

### 📝 PLANNED (NEXT PRIORITIES)
- [ ] **Inquiry System** - Buyer inquiry workflow and seller engagement
- [ ] **Admin Dashboard** - Admin interface for verification and moderation
- [ ] **Real-time Messaging** - Supabase Realtime chat implementation
- [ ] **File Upload & Storage** - Document and image upload functionality

## Current Status / Progress Tracking

**Current Phase**: Day 3 - Authentication & User Profiles ✅ COMPLETED
**Next Phase**: Day 4 - Listings Management Implementation

**Recent Achievement**: Successfully completed comprehensive profile creation API fixes with robust error handling for all edge cases including JSON parsing, duplicate prevention, and foreign key constraints.

**Key Metrics**:
- ✅ User registration working end-to-end
- ✅ Profile creation API handles all error cases
- ✅ Email verification implemented
- ✅ Authentication state management working
- ✅ Role-based routing functional

## Executor's Feedback or Assistance Requests

### ✅ COMPLETED - Fixed React Controlled vs Uncontrolled Input Error (December 2024)

**Issue**: React console error "A component is changing an uncontrolled input to be controlled" occurring in onboarding forms. This happened when input values changed from `undefined` to defined values, violating React's controlled component rules.

**Root Cause**: Form `defaultValues` from session storage or initial state could contain `undefined` values, but React expects controlled inputs to always have defined values (at least empty strings).

**Solution Applied**:
1. **Created `getDefaultValues` helper function** in both onboarding flows:
   - Ensures all string fields default to empty strings `""` instead of `undefined`
   - Keeps optional fields (like file uploads and selects) as `undefined` when appropriate
   - Prevents value type changes during component lifecycle

2. **Fixed Buyer Onboarding** (`src/app/onboarding/buyer/[step]/page.tsx`):
   - Applied helper to `useForm` defaultValues and `methods.reset()`
   - Ensured fields like `fullName`, `country`, `phoneNumber` always have string values

3. **Fixed Seller Onboarding** (`src/app/onboarding/seller/[step]/page.tsx`):
   - Applied same pattern for seller-specific fields
   - Handled additional fields like `registeredBusinessName`, `businessWebsiteUrl`, etc.

**Technical Implementation**:
```javascript
const getDefaultValues = (data: FormValues): FormValues => {
  return {
    fullName: data.fullName || "",
    country: data.country || "",
    // ... other string fields with empty string fallbacks
    buyerPersonaType: data.buyerPersonaType || undefined, // Select fields remain undefined
    buyerIdentityFile: data.buyerIdentityFile || undefined, // File fields remain undefined
  };
};
```

**Expected Results**:
- No more React controlled vs uncontrolled input console errors
- Form inputs maintain consistent value types throughout component lifecycle
- Session storage data properly hydrates forms without type issues
- Onboarding flows work smoothly without React warnings

**Files Modified**:
- `src/app/onboarding/buyer/[step]/page.tsx`
- `src/app/onboarding/seller/[step]/page.tsx`

**Testing Required**: User should test both buyer and seller onboarding flows to confirm no more React console errors appear.

### ✅ COMPLETED - Fixed JavaScript Variable Declaration Order Error (December 2024)

**Issue**: Runtime error "Cannot access 'pathname' before initialization" occurring in onboarding layouts.

**Root Cause**: Variable `pathname` was being used in `isSuccessPage` calculation before it was declared, causing a JavaScript ReferenceError.

**Problematic Code**:
```javascript
const isSuccessPage = params.step === 'success' || pathname.endsWith('/onboarding/buyer/success');
const pathname = typeof window !== "undefined" ? window.location.pathname : ""; // Declared AFTER usage
```

**Solution Applied**:
1. **Fixed Buyer Onboarding Layout** (`src/app/onboarding/buyer/layout.tsx`):
   - Moved `pathname` declaration before its usage in `isSuccessPage`

2. **Fixed Seller Onboarding Layout** (`src/app/onboarding/seller/layout.tsx`):
   - Applied same fix to prevent similar error

**Corrected Code**:
```javascript
const pathname = typeof window !== "undefined" ? window.location.pathname : "";
const isSuccessPage = params.step === 'success' || pathname.endsWith('/onboarding/buyer/success');
```

**Expected Results**:
- Onboarding pages should now load without JavaScript runtime errors
- Both buyer and seller onboarding flows should work properly
- No more "Cannot access 'pathname' before initialization" errors

**Files Modified**:
- `src/app/onboarding/buyer/layout.tsx`
- `src/app/onboarding/seller/layout.tsx`

**Testing Required**: User should test accessing onboarding pages to confirm the error is resolved.

### ✅ COMPLETED - Fixed Major UX Flaw: Authenticated Users Accessing Auth Pages (December 2024)

**Issue**: Authenticated users could still access and view authentication pages like `/auth/login`, `/auth/register`, `/auth/forgot-password`, etc. This is a major UX flaw that confused users.

**Root Cause**: Authentication pages had no protection against already-authenticated users. They were just rendering forms without checking authentication status.

**Solution Applied**:
1. **Created AuthPageGuard Component** (`src/components/auth/auth-page-guard.tsx`):
   - Uses `useCurrentUser` hook to check authentication status
   - Shows loading spinner while checking authentication
   - Redirects authenticated users to appropriate destinations based on:
     - Onboarding completion status
     - User role (buyer → `/dashboard`, seller → `/seller-dashboard`, admin → `/admin`)
     - Incomplete onboarding → appropriate onboarding flow
   - Only renders children (auth forms) for unauthenticated users

2. **Protected All Authentication Pages**:
   - `/auth/login` - wrapped with `<AuthPageGuard>`
   - `/auth/register` - wrapped with `<AuthPageGuard>`
   - `/auth/register/buyer` - wrapped with `<AuthPageGuard>`
   - `/auth/register/seller` - wrapped with `<AuthPageGuard>`
   - `/auth/forgot-password` - wrapped with `<AuthPageGuard>`

**Technical Implementation**:
- Guard component checks `!loading && user && profile` conditions
- Intelligent redirection based on user state and role
- Smooth UX with loading states during authentication check
- Returns `null` while redirecting to prevent flash of auth content

**Expected Results**:
- Authenticated users visiting `/auth/login` should be automatically redirected to their appropriate dashboard
- No more confusing scenario where logged-in users see login forms
- Seamless experience that respects user authentication state
- Users redirected to onboarding if incomplete, or dashboard if complete

**Files Modified**:
- `src/components/auth/auth-page-guard.tsx` (new component)
- `src/app/auth/login/page.tsx`
- `src/app/auth/register/page.tsx`
- `src/app/auth/register/buyer/page.tsx`
- `src/app/auth/register/seller/page.tsx`
- `src/app/auth/forgot-password/page.tsx`

**Testing Required**: User should test accessing auth pages while logged in to confirm automatic redirection works properly.

### ✅ COMPLETED - Fixed Navbar Authentication State Synchronization (June 2, 2025)

**Issue**: Navbar wasn't automatically updating to show authenticated state after login. Users had to reload the page to see authentication changes reflected in the navbar (login/logout buttons, user profile dropdown, etc.).

**Root Cause**: The navbar component was using a separate authentication system (`@/lib/auth`) with its own state management, while the main application was using the newer `useCurrentUser` hook. These two systems were not synchronized, causing state inconsistencies.

**Technical Details**:
- **Before**: Navbar used `auth.getCurrentUser()`, `auth.onAuthStateChange()`, and managed its own `useState` for `isAuthenticated` and `userProfile`
- **After**: Navbar now uses the centralized `useCurrentUser` hook which provides consistent authentication state across the entire application

**Solution Applied**:
1. **Updated navbar to use `useCurrentUser` hook**:
   - Removed separate authentication state management (`useState` for `isAuthenticated`, `userProfile`, `isLoading`)
   - Replaced with `const { user, profile: userProfile, loading: isLoading } = useCurrentUser()`
   - Derived `isAuthenticated` from `!!user`

2. **Simplified logout handling**:
   - Updated to use `supabase.auth.signOut()` directly instead of `auth.signOut()`
   - Removed manual state cleanup since `useCurrentUser` hook handles state changes automatically

3. **Maintained full navbar functionality**:
   - Preserved all dropdown menus (Sell Your Business, Buy a Business, Company)
   - Kept both desktop and mobile navigation structures
   - Maintained proper TypeScript types for user profile data

**Files Modified**:
- `src/components/layout/navbar.tsx`: Complete refactor to use centralized authentication state

**Expected Results**:
- Navbar should now automatically update when users log in/out without requiring page reload
- Authentication state should be consistent across navbar and dashboard components
- Real-time auth state changes should be reflected immediately in the UI

**Testing Required**: User should test logging in and confirm that the navbar immediately shows authenticated state (user profile dropdown, dashboard button) without requiring a page refresh.

### ✅ COMPLETED - Fixed Dashboard Authentication Redirect Loop (June 1, 2025)

**Issue**: Users could log in successfully but were immediately redirected back to `/auth/login` when accessing dashboard pages. The pattern observed was:
1. Dashboard loads (200 status)
2. `/api/auth/current-user` returns 401 (Unauthorized)
3. User gets redirected back to login page

**Root Cause**: Mismatch between frontend and backend authentication methods:
- Backend API routes were updated to expect Authorization headers with JWT tokens
- Frontend was still using `credentials: 'include'` (cookie-based) without sending Authorization headers
- This caused all `/api/auth/current-user` calls to return 401, triggering the dashboard redirect logic

**Solution Applied**:
1. **Updated `useCurrentUser` hook** (`src/hooks/use-current-user.ts`):
   - Get current session and access token using `supabase.auth.getSession()`
   - Send Authorization header with Bearer token instead of using credentials: 'include'
   - Handle cases where no valid session exists gracefully

2. **Updated `updateUserProfile` function**:
   - Same pattern - get session token and send in Authorization header
   - Proper error handling for unauthenticated states

**Files Modified**:
- `src/hooks/use-current-user.ts`: Fixed authentication method to match API expectations

**Technical Details**:
- Frontend now calls `supabase.auth.getSession()` to get the JWT access token
- Sends `Authorization: Bearer ${session.access_token}` header in API requests
- Removed `credentials: 'include'` approach that was incompatible with server-side JWT verification

**Expected Results**:
- Dashboard pages should now load properly after login
- Authentication state should be maintained correctly
- Role-based dashboard routing should work (buyer → `/dashboard`, seller → `/seller-dashboard`)

**Testing Required**: User should test logging in and accessing dashboard to confirm the redirect loop is resolved.

### ✅ COMPLETED - Fixed Supabase Auth-Helpers Dependency Issue (June 1, 2025)

**Issue**: Build error with missing `@supabase/auth-helpers-nextjs` module in API routes:
- `./src/app/api/auth/current-user/route.ts`
- `./src/app/api/auth/update-profile/route.ts`

**Root Cause**: The code was using the deprecated `@supabase/auth-helpers-nextjs` package which is not installed and has been superseded by the main `@supabase/supabase-js` package.

**Solution Applied**:
1. Updated both API routes to use `createClient` from `@supabase/supabase-js` instead of `createRouteHandlerClient`
2. Implemented proper server-side JWT authentication by:
   - Reading the Authorization header from incoming requests
   - Verifying JWT tokens using `supabase.auth.getUser(token)`
   - Creating authenticated clients with the verified token for database operations
3. Maintained RLS compliance by using authenticated clients rather than service role clients

**Files Modified**:
- `src/app/api/auth/current-user/route.ts`: Fixed import and implemented JWT verification
- `src/app/api/auth/update-profile/route.ts`: Fixed import and implemented JWT verification

**Testing Results**:
- ✅ Development server starts without build errors
- ✅ Server responds with HTTP 200 status
- ✅ No more module resolution errors

**Next Steps**: The build system is now functional. These API endpoints will need to be tested with actual authentication tokens from the frontend to ensure end-to-end functionality.

---

## Lessons

### Supabase Auth Dependencies (June 1, 2025)
- The `@supabase/auth-helpers-nextjs` package is deprecated in favor of using the main `@supabase/supabase-js` package directly
- For server-side API routes, use JWT token verification with `supabase.auth.getUser(token)` rather than cookie-based session handling
- Create authenticated clients by passing the JWT token in the Authorization header for RLS-compliant database operations
- Always check if dependencies exist in package.json before using imports

# Project: Nobridge - Onboarding Flow Implementation

## Background and Motivation

**User Request**: Implement an onboarding flow with document verification requirements before users can access the dashboard. Currently, after registration, users are immediately authenticated and given dashboard access, which shouldn't be the case. There should be a database flag to prevent dashboard access until documents are submitted.

**Context**: The onboarding UI is already built but backend implementation and logic is needed.

## Key Challenges and Analysis

1. **Current Flow Issue**: Register → Authenticated → Dashboard Access (immediate)
2. **Desired Flow**: Register → Authenticated → Onboarding (document submission) → Dashboard Access
3. **Database Schema**: Need to add onboarding completion tracking to `user_profiles` table
4. **Authentication Flow**: Need middleware to enforce onboarding completion before dashboard access
5. **API Integration**: Onboarding UI needs to connect to real backend APIs

## High-level Task Breakdown

### ✅ Task 1: Database Schema Updates
- [x] Create migration script for onboarding fields
- [ ] **PENDING MANUAL ACTION**: Apply database migration to production
- [x] Add fields: `is_onboarding_completed`, `onboarding_completed_at`, `onboarding_step_completed`, `submitted_documents`
- [x] Create `onboarding_documents` table for file tracking

### ✅ Task 2: API Endpoints
- [x] Create `/api/onboarding/status` endpoint (GET/POST)
- [x] Create `/api/onboarding/upload` endpoint for document uploads
- [x] Integrate with Supabase Storage for file handling

### ✅ Task 3: Authentication & Middleware
- [x] Update middleware to check onboarding completion status
- [x] Redirect incomplete users to appropriate onboarding step
- [x] Protect dashboard routes from unverified users
- [x] Install and configure @supabase/ssr package

### ✅ Task 4: Frontend Integration
- [x] Update `useCurrentUser` hook with onboarding fields
- [x] Add onboarding utility functions (checkOnboardingStatus, updateOnboardingStatus, uploadOnboardingDocument)
- [x] Update buyer onboarding flow to call real APIs
- [x] Update seller onboarding flow to call real APIs

### ✅ Task 5: Storage Setup
- [x] Create storage bucket SQL setup for document uploads
- [x] Define RLS policies for secure document access

### Task 6: Registration Flow Updates
- [x] Buyer registration already redirects to `/onboarding/buyer/1`
- [x] Seller registration already redirects to `/onboarding/seller/1`
- [x] Verified existing redirect logic is correct

## Current Status / Progress Tracking

### ✅ Completed
- Database migration script created
- API endpoints implemented
- Middleware security implemented
- Frontend hooks updated
- Buyer onboarding integration completed
- **NEW**: Seller onboarding integration completed
- **NEW**: Storage bucket setup created

### 🔄 In Progress
- Database migration needs manual application
- Storage bucket needs manual setup

### ⏳ Pending
- Testing complete flow end-to-end
- Onboarding success pages integration

## Project Status Board

- [ ] **URGENT**: Apply database migration manually via Supabase SQL Editor
- [ ] **URGENT**: Apply storage bucket setup via Supabase SQL Editor
- [ ] Test registration → onboarding → dashboard flow for buyers
- [ ] Test registration → onboarding → dashboard flow for sellers
- [ ] Create onboarding success pages integration
- [ ] Test document upload functionality

## Executor's Feedback or Assistance Requests

### 🎯 Ready for Testing Phase!

**Current Status**: All onboarding implementation is complete! Both buyer and seller flows are now integrated with real APIs.

**Next Critical Steps**:

1. **Apply Database Migrations** (User Action Required):
   ```sql
   -- First, apply the main migration:
   -- Copy and run: database-migrations/01-add-onboarding-fields.sql

   -- Then, apply the storage setup:
   -- Copy and run: database-migrations/02-create-storage-bucket.sql
   ```

2. **Test Complete Flow**:
   - Register as buyer → Should redirect to `/onboarding/buyer/1`
   - Complete onboarding steps → Should redirect to `/dashboard`
   - Register as seller → Should redirect to `/onboarding/seller/1`
   - Complete onboarding steps → Should redirect to `/seller-dashboard`

**What's Been Implemented**:

✅ **Buyer Onboarding (2 steps)**:
- Step 1: Profile completion (name, country, investment focus)
- Step 2: Identity document upload

✅ **Seller Onboarding (5 steps)**:
- Step 1: Business overview (company name, website, country, summary)
- Step 2: Identity document upload
- Step 3: Business registration & ownership documents
- Step 4: Financial documents (P&L, balance sheet)
- Step 5: Review & confirmation

✅ **Security & Flow Control**:
- Middleware blocks dashboard access until onboarding complete
- Documents stored securely in Supabase Storage with RLS
- Onboarding state persisted across browser sessions
- Real-time API integration with proper error handling

### Architecture Summary

**Complete Flow**:
```
Registration →
  ↓ (automatic redirect)
Onboarding Steps (2 for buyers, 5 for sellers) →
  ↓ (middleware enforces completion)
Dashboard Access (role-based routing)
```

**Key Features**:
- ✅ Document upload with 5MB limit and file type validation
- ✅ Session storage maintains form state across steps
- ✅ Real-time onboarding progress tracking
- ✅ Automatic dashboard routing after completion
- ✅ Secure file storage with user-only access

## Lessons

- Use @supabase/ssr instead of deprecated auth-helpers packages
- Always check networking connectivity before running remote database commands
- Include manual fallback steps for critical migrations
- Session storage in onboarding flow maintains form state across steps
- **NEW**: Supabase Storage RLS policies require careful folder structure matching user IDs
- **NEW**: File upload APIs need proper error handling for size and type validation
