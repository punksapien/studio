
# Project Architecture

This document outlines the technical architecture of the Nobridge platform.

## 1. Frontend Technology Stack

*   **Framework:** Next.js (Version 15.2.3)
    *   Utilizes the **App Router** for routing, server components, and server actions (for future form submissions).
*   **Language:** TypeScript
    *   Ensures type safety and better code maintainability.
*   **UI Library:** React
    *   Core library for building user interfaces.

## 2. Styling Approach

*   **CSS Framework:** Tailwind CSS
    *   A utility-first CSS framework for rapid UI development. Configuration is in `tailwind.config.ts`.
*   **UI Components:** ShadCN UI
    *   A collection of beautifully designed, accessible, and customizable components built on top of Radix UI and Tailwind CSS.
    *   Core UI components are located in `src/components/ui/`.
    *   Theme customization (colors, radius) is managed in `src/app/globals.css`.

## 3. API Layer (Current Implementation: Stubs)

*   **Next.js API Routes:** The project is structured to use Next.js API Routes. These would typically reside within the `src/app/api/` directory (though currently, these are not yet implemented and are conceptual based on frontend needs).
*   **Purpose:** These routes are intended to handle all backend logic, including:
    *   User authentication and authorization.
    *   Database interactions (CRUD operations for users, listings, inquiries, conversations, messages).
    *   Form submissions from the frontend.
    *   Integration with third-party services.
    *   In-app messaging functionalities.
*   **Current State:** The frontend forms (e.g., registration, login, listing creation) and messaging UI are built with the *intention* of submitting data to these API routes. However, the routes themselves are placeholders that need full backend implementation.

## 4. Intended Backend Services (Future Integrations)

The project is designed with the following backend services in mind for future integration:

*   **Authentication:** Clerk (Version 6.19.5) or a custom OTP-based solution.
    *   Intended to handle user registration, login, session management, email verification, and password reset flows.
*   **Database & Storage:** Cloudflare D1 (SQL Database) & Cloudflare R2 (Object Storage).
    *   D1 is intended to serve as the primary SQL database for storing user profiles, business listings, inquiries, conversations, messages, and other application data.
    *   R2 is planned for handling uploaded documents (e.g., verification documents, financial statements, message attachments).
*   **AI Functionality (Genkit):** Genkit (Version 1.8.0)
    *   Integrated for potential AI-driven features. Configuration is in `src/ai/genkit.ts`.
    *   Development server script for Genkit is in `src/ai/dev.ts`.

## 5. State Management (Frontend)

*   **Local Component State:** Primarily uses React's built-in `useState` and `useEffect` hooks for managing local component state and side effects (e.g., in form components, dynamic UI updates, chat message input).
*   **Context API:** React's `useContext` hook is used for some global state management, such as the sidebar state in `src/components/ui/sidebar.tsx`.
*   **Forms:** `react-hook-form` is used for managing form state, validation (with Zod), and submissions across various parts of the application (registration, profile editing, listing creation).

## 6. Data Fetching Strategy (Frontend to API)

*   **Current (Prototyping):**
    *   Most data is currently sourced from placeholder data files (e.g., `src/lib/placeholder-data.ts`).
    *   Server Components in Next.js (e.g., in `page.tsx` files for static content or initial data loads) directly import and use this placeholder data through async functions that simulate data fetching.
    *   Client components like `/app/marketplace/page.tsx` use `useState` and `useEffect` to simulate fetching and paginating data from `sampleListings`. Chat components also use this approach for initial prototyping.
*   **Intended (Post-Backend Implementation):**
    *   Frontend components (both Client and Server Components) will use the `fetch` API or a dedicated data fetching library (like TanStack Query, if integrated later) to make requests to the Next.js API routes.
    *   Server Actions (a Next.js App Router feature) are also a planned method for form submissions and data mutations, simplifying API endpoint creation for these cases.
    *   Client Components that need to fetch data on the client-side (e.g., for dynamic filtering, chat message polling, user-specific data after login) will use `useEffect` in conjunction with `fetch`.

## 7. In-App Messaging System

### 7.1. Core Functionality
*   Allows direct text-based communication between a verified Buyer and a verified Seller.
*   Chat initiation is mediated by a Platform Admin who facilitates the connection after both parties (and potentially the listing) are appropriately verified and have expressed mutual interest (via the inquiry system).
*   Users can view a list of their active conversations and open individual chat windows.
*   Admins have oversight capabilities to view conversations for support or moderation.

### 7.2. Technical Approach (Prototyping & Intended)
*   **Prototyping:**
    *   UI built with React, ShadCN UI, and Tailwind CSS.
    *   State management for message display and input primarily uses local component state (`useState`, `useEffect`).
    *   Placeholder data (`sampleConversations`, `sampleMessages`) drives the UI.
    *   Simulated real-time updates (e.g., new messages appearing) would be handled client-side during prototyping (e.g., by updating local state).
*   **Intended Backend (Cloudflare Workers & D1):**
    *   `Conversation` and `Message` data stored in D1 tables.
    *   Next.js API routes (handled by Cloudflare Workers) for:
        *   Admin facilitating/creating conversations.
        *   Users fetching their conversation lists and message histories.
        *   Users sending new messages.
        *   Admin fetching conversation lists and message histories.
    *   Real-time updates:
        *   **MVP:** Client-side polling of message fetching API.
        *   **Advanced:** Cloudflare Workers with Durable Objects and WebSockets, or integration with third-party push notification services.

### 7.3. Alternative Approaches & Future Considerations
*   **Third-Party Chat SDKs:** For a production-ready system, using a dedicated third-party chat SDK like TalkJS, Sendbird, or Stream could be considered. These services offer pre-built UIs, real-time infrastructure, scalability, and advanced features (typing indicators, read receipts, file attachments, moderation tools) out-of-the-box, potentially reducing development time and complexity for the core chat functionality. Integration would involve their client-side SDKs and backend webhooks.

    