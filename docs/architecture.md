
# Project Architecture

This document outlines the technical architecture of the BizMatch Asia platform.

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
    *   Database interactions (CRUD operations for users, listings, inquiries).
    *   Form submissions from the frontend.
    *   Integration with third-party services.
*   **Current State:** The frontend forms (e.g., registration, login, listing creation) are built with the *intention* of submitting data to these API routes. However, the routes themselves are placeholders that need full backend implementation.

## 4. Intended Backend Services (Future Integrations)

The project is designed with the following backend services in mind for future integration:

*   **Authentication:** Clerk (Version 6.19.5)
    *   Intended to handle user registration, login, session management, email verification, and password reset flows.
    *   The frontend was prototyped with Clerk's components and middleware concepts, although this has been temporarily reverted in the UI to basic placeholders.
*   **Database & Storage:** Supabase
    *   Intended to serve as the primary PostgreSQL database for storing user profiles, business listings, inquiries, and other application data.
    *   Supabase Storage is planned for handling uploaded documents (e.g., verification documents, financial statements).
*   **AI Functionality (Genkit):** Genkit (Version 1.8.0)
    *   Integrated for potential AI-driven features. Configuration is in `src/ai/genkit.ts`.
    *   Development server script for Genkit is in `src/ai/dev.ts`.

## 5. State Management (Frontend)

*   **Local Component State:** Primarily uses React's built-in `useState` and `useEffect` hooks for managing local component state and side effects (e.g., in form components, dynamic UI updates).
*   **Context API:** React's `useContext` hook is used for some global state management, such as the sidebar state in `src/components/ui/sidebar.tsx`.
*   **Forms:** `react-hook-form` is used for managing form state, validation (with Zod), and submissions across various parts of the application (registration, profile editing, listing creation).

## 6. Data Fetching Strategy (Frontend to API)

*   **Current (Prototyping):**
    *   Most data is currently sourced from placeholder data files (e.g., `src/lib/placeholder-data.ts`).
    *   Server Components in Next.js (e.g., in `page.tsx` files for static content or initial data loads) directly import and use this placeholder data through async functions that simulate data fetching.
    *   Client components like `/app/marketplace/page.tsx` use `useState` and `useEffect` to simulate fetching and paginating data from `sampleListings`.
*   **Intended (Post-Backend Implementation):**
    *   Frontend components (both Client and Server Components) will use the `fetch` API or a dedicated data fetching library (like TanStack Query, if integrated later) to make requests to the Next.js API routes.
    *   Server Actions (a Next.js App Router feature) are also a planned method for form submissions and data mutations, simplifying API endpoint creation for these cases.
    *   Client Components that need to fetch data on the client-side (e.g., for dynamic filtering or user-specific data after login) will use `useEffect` in conjunction with `fetch`.
