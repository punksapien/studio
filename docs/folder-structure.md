
# Detailed Folder Structure

This document outlines the main folder structure of the `src` directory in the Nobridge project.

```
src/
├── ai/                     # Genkit AI integration
│   ├── dev.ts              # Genkit development server entry point
│   └── genkit.ts           # Genkit configuration and core AI object
├── app/                    # Next.js App Router: Pages, Layouts, API Routes
│   ├── (auth)/             # Route group for authentication pages
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   ├── layout.tsx      # Layout specific to auth pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       ├── buyer/
│   │       │   └── page.tsx
│   │       ├── page.tsx    # Main registration choice page
│   │       └── seller/
│   │           └── page.tsx
│   │   └── verify-otp/     # OTP Verification Page
│   │       └── page.tsx
│   ├── admin/              # Admin Panel routes
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── conversations/    # NEW: Admin conversation oversight
│   │   │   ├── [conversationId]/
│   │   │   │   └── page.tsx # Admin view of a specific conversation
│   │   │   └── page.tsx     # Admin conversation list
│   │   ├── engagement-queue/
│   │   │   └── page.tsx
│   │   ├── layout.tsx      # Layout for the admin panel
│   │   ├── listings/
│   │   │   ├── [listingId]/
│   │   │   │   └── page.tsx # Admin view of a specific listing
│   │   │   └── page.tsx     # Admin listing management table
│   │   ├── login/
│   │   │   └── page.tsx     # Admin login page
│   │   ├── page.tsx         # Admin dashboard overview
│   │   ├── users/
│   │   │   ├── [userId]/
│   │   │   │   └── page.tsx # Admin view of a specific user
│   │   │   └── page.tsx     # Admin user management table
│   │   └── verification-queue/
│   │       ├── buyers/
│   │       │   └── page.tsx # Buyer verification queue
│   │       ├── page.tsx     # (Redirect page, can be removed)
│   │       └── sellers/
│   │           └── page.tsx # Seller/listing verification queue
│   ├── api/                  # Next.js API routes (intended for backend logic)
│   │   └── (Conceptual placeholders for future development)
│   ├── dashboard/            # Buyer Dashboard routes
│   │   ├── inquiries/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── listings/         # (This was for seller-focused listings, now distinct)
│   │   │   ├── [listingId]/
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── messages/         # NEW: Buyer messages
│   │   │   ├── [conversationId]/
│   │   │   │   └── page.tsx # Buyer specific conversation view
│   │   │   └── page.tsx     # Buyer conversation list
│   │   ├── notifications/
│   │   │   └── page.tsx
│   │   ├── page.tsx         # Buyer dashboard overview
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── verification/
│   │       └── page.tsx
│   ├── seller-dashboard/     # Seller Dashboard routes
│   │   ├── inquiries/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── listings/
│   │   │   ├── [listingId]/
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── messages/         # NEW: Seller messages
│   │   │   ├── [conversationId]/
│   │   │   │   └── page.tsx # Seller specific conversation view
│   │   │   └── page.tsx     # Seller conversation list
│   │   ├── notifications/
│   │   │   └── page.tsx
│   │   ├── page.tsx         # Seller dashboard overview
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── verification/
│   │       └── page.tsx
│   ├── about/
│   │   └── page.tsx
│   ├── contact/
│   │   └── page.tsx
│   ├── listings/
│   │   └── [listingId]/
│   │       └── page.tsx     # Public detail page for a specific listing
│   ├── marketplace/
│   │   └── page.tsx         # Main filterable marketplace page
│   ├── pricing/
│   │   └── page.tsx         # Pricing page
│   ├── privacy/
│   │   └── page.tsx
│   ├── terms/
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css         # Global styles and Tailwind CSS theme configuration
│   ├── layout.tsx          # Root layout for the entire application
│   └── page.tsx            # Landing page of the application
├── components/             # Reusable UI components
│   ├── admin/
│   │   └── metric-card.tsx   # Card component for displaying metrics in admin
│   ├── auth/
│   │   ├── auth-card-wrapper.tsx # Wrapper for auth forms (login, register)
│   │   └── common-registration-fields.tsx # Shared fields for registration forms
│   ├── layout/
│   │   ├── footer.tsx
│   │   ├── GlobalLayoutWrapper.tsx # Decides if global nav/footer apply
│   │   └── navbar.tsx
│   ├── marketplace/
│   │   ├── filters.tsx
│   │   ├── listing-card.tsx
│   │   └── sort-dropdown.tsx
│   ├── shared/
│   │   ├── logo.tsx
│   │   └── pagination-controls.tsx
│   └── ui/                   # ShadCN UI components (primitives)
│       ├── (accordion.tsx, alert.tsx, ..., toast.tsx, toaster.tsx)
│       └── sidebar.tsx       # Sidebar system component
├── hooks/                  # Custom React hooks
│   ├── use-mobile.tsx      # Hook to detect mobile screen sizes
│   └── use-toast.ts        # Hook for managing toast notifications
├── lib/                    # Utility functions, type definitions, placeholder data
│   ├── placeholder-data.ts # Sample data for development
│   ├── types.ts            # Core TypeScript type definitions for the application
│   └── utils.ts            # Utility functions (e.g., `cn` for Tailwind class merging)
├── middleware.ts           # Next.js middleware
└── (Other root files: next.config.ts, package.json, etc.)
```

## Key Directory Explanations:

*   **`src/ai/`**: Contains all Genkit related code for AI features.
*   **`src/app/`**: The heart of the Next.js application using the App Router.
    *   **Route Groups (`(auth)`, `admin`, `dashboard`, `seller-dashboard` etc.)**: Used to organize routes.
    *   **Dynamic Routes (`[listingId]`, `[userId]`, `[conversationId]`):** Used for pages that display content based on a parameter in the URL.
    *   **`layout.tsx` files:** Define UI shells. `src/app/layout.tsx` is the root layout.
    *   **`page.tsx` files:** The main UI component for a specific route.
    *   **`src/app/api/`**: Intended location for backend API route handlers.
*   **`src/components/`**: Contains all reusable React components.
    *   `ui/`: Base components provided by ShadCN UI.
    *   `layout/`: Global layout components like Navbar, Footer, and the `GlobalLayoutWrapper`.
    *   Other subdirectories (`admin/`, `auth/`, `marketplace/`, `shared/`) contain custom components.
*   **`src/hooks/`**: Custom React hooks.
*   **`src/lib/`**: Utility functions, type definitions, and placeholder data.
*   **`src/middleware.ts`**: Handles Next.js middleware.

This structure aims for clarity and separation of concerns.

    