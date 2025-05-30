
# Backend Development - Order of Operations

This document outlines a recommended sequence for developing the backend functionalities for the Nobridge platform. This is a general guide and can be adapted based on specific priorities and team structure.

## Phase 1: Foundation & Core Entities

1.  **Database Schema Design (Cloudflare D1):**
    *   Finalize and implement D1 schemas for all core entities:
        *   `user_profiles` (including roles, verification status, buyer/seller specific fields)
        *   `listings` (including all anonymous and verified fields, status)
        *   `otp_verifications` (for email verification and password resets)
        *   `verification_requests` (for tracking admin verification tasks)
        *   `inquiries` (linking buyers, sellers, listings)
        *   `conversations` (for in-app messaging)
        *   `messages` (for individual chat messages)
        *   `notifications` (for user alerts)
        *   `audit_logs` (for admin actions - conceptual)
    *   Define primary keys, foreign keys, relationships, and necessary indexes.

2.  **Authentication Setup (Conceptual: OTP-based or Clerk Integration):**
    *   Implement user registration (buyer & seller) with password hashing.
    *   Implement email verification (OTP sending and verification logic).
    *   Implement user login (credential validation, session/token generation - OTP for login if part of the design).
    *   Implement password reset (OTP request and completion).
    *   Set up role-based access control mechanisms (e.g., checking user roles for protected actions).

3.  **Middleware - Initial Layer (Next.js Middleware):**
    *   **Basic Request Logging:** Implement simple middleware for logging incoming requests (path, method) for debugging during development.
    *   **Authentication Middleware (Conceptual):** Start planning or stubbing out middleware to protect API routes. This would initially check for a valid session/token. Specific route protection can be refined later.
    *   **(Future) Rate Limiting Stubs:** Consider where rate limiting might be applied, even if not fully implemented initially.

## Phase 2: Core Feature APIs - User & Listing Management

1.  **User Profile Management API (`/api/profile/*`):**
    *   Endpoint for updating user profile information (PUT `/api/profile`).
    *   Endpoint for changing password (from settings page) (PUT `/api/auth/change-password`).

2.  **Business Listing Management API (`/api/listings/*`):**
    *   Create new listing (POST `/api/listings`) - for sellers.
    *   Get all listings (GET `/api/listings`) - for marketplace, with filtering (industry, country, asking price numeric range, keywords array), sorting, and pagination.
    *   Get single listing details (GET `/api/listings/[listingId]`) - public view, with conditional display of verified info.
    *   Update existing listing (PUT `/api/listings/[listingId]`) - for sellers.
    *   Deactivate/Reactivate listing (PUT `/api/listings/[listingId]/status`) - for sellers.
    *   **File Upload Handling (Cloudflare R2 - Conceptual):** While the API receives image URLs as strings for now, plan the backend logic for how documents (financials, ownership proofs) associated with listings would be handled (e.g., if direct uploads to R2 with signed URLs are used, or if files are proxied through a Worker).

## Phase 3: Interaction & Workflow APIs

1.  **Inquiry System API (`/api/inquiries/*`):**
    *   Create inquiry (POST `/api/inquiries`) - for buyers.
    *   Get inquiries (GET `/api/inquiries`) - for user dashboards (buyer/seller perspective), including `conversationId`.
    *   Seller engages with inquiry (POST `/api/inquiries/[inquiryId]/engage`) - updates inquiry status.

2.  **Verification System API (`/api/verification-requests/*`):**
    *   Create verification request (POST `/api/verification-requests`) - for users requesting profile/listing verification. Triggers admin notification.

3.  **Middleware - Route-Specific Auth:**
    *   Refine authentication middleware to apply specific role checks for routes (e.g., only 'seller' can create listings, only 'admin' can access admin APIs).

## Phase 4: Admin Panel Backend Logic

1.  **Admin User Management API (`/api/admin/users/*`):**
    *   Endpoints for fetching users, viewing details, updating status (verification, paid), sending reset OTPs.
2.  **Admin Listing Management API (`/api/admin/listings/*`):**
    *   Endpoints for fetching listings, viewing details, updating status.
3.  **Admin Verification Queue API (`/api/admin/verification-requests/*`):**
    *   Endpoints for fetching verification requests, updating request status and related entity status.
4.  **Admin Engagement Queue API (`/api/admin/engagements/*`):**
    *   Endpoint for fetching inquiries `READY_FOR_ADMIN_CONNECTION`.
    *   Endpoint (`POST /api/admin/engagements/[inquiryId]/facilitate-connection`) to:
        *   Create a `Conversation` record in D1.
        *   Update `inquiries.status` to `CONNECTION_FACILITATED_IN_APP_CHAT_OPENED`.
        *   Link `inquiries.conversationId`.
        *   Notify buyer and seller.
5.  **Admin Conversation Oversight API (`/api/admin/conversations/*`):**
    *   `GET /api/admin/conversations`: List all conversations.
    *   `GET /api/admin/conversations/[conversationId]/messages`: Get messages for a specific conversation.
    *   `PUT /api/admin/conversations/[conversationId]/status`: Update conversation status (e.g., archive).
6.  **Admin Analytics API (`/api/admin/analytics/*`):**
    *   Endpoints to provide aggregated data for the admin dashboard metrics.

## Phase 5: In-App Messaging System Backend

1.  **Conversation & Message APIs (`/api/conversations/*`):**
    *   Get user's conversations (GET `/api/conversations`).
    *   Get messages for a conversation (GET `/api/conversations/[conversationId]/messages`), including logic to mark messages as read and update unread counts.
    *   Send message in conversation (POST `/api/conversations/[conversationId]/messages`), including updating conversation metadata and unread counts for the receiver.
2.  **Real-time Notifications (Conceptual - Cloudflare Workers):**
    *   Implement chosen strategy (polling, WebSockets with Durable Objects, or third-party push) for notifying users of new messages.

## Phase 6: Cross-Cutting Concerns & Refinements

1.  **Comprehensive Error Handling:** Ensure consistent error responses across all APIs.
2.  **Logging:** Implement more robust logging for critical actions and errors.
3.  **Security Hardening:**
    *   Input validation for all API endpoints (already started with Zod schemas).
    *   SQL injection prevention (D1 typically uses prepared statements which help).
    *   Ensure proper authorization checks for all actions.
    *   Implement CSRF protection if using cookie-based sessions.
4.  **Performance Optimization:**
    *   Review D1 queries for efficiency, add indexes as needed.
    *   Cache frequently accessed, non-dynamic data where appropriate.
5.  **Notification System:**
    *   Flesh out the `notifications` table and logic for generating various in-app/email notifications (new inquiry, verification status change, new message, etc.).

## Phase 7: Testing & Deployment

1.  **Unit & Integration Tests:** Write tests for critical backend logic and API endpoints.
2.  **End-to-End Testing:** Test full user flows.
3.  **Deployment Preparation:**
    *   Configure environment variables for production (API keys, database credentials for Cloudflare Workers).
    *   Set up CI/CD pipeline for deploying Cloudflare Workers.
4.  **Monitoring & Alerting:** Set up monitoring for API performance and errors in production.

This order provides a logical progression, building foundational elements first and then layering more complex features and interactions. Middleware is introduced early for basic needs and refined as more specific route protections are required.
