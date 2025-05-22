
# Detailed Folder Structure

This document outlines the main folder structure of the `src` directory in the BizMatch Asia project.

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
│   ├── admin/              # Admin Panel routes
│   │   ├── analytics/
│   │   │   └── page.tsx
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
│   │       ├── page.tsx     # (Redirect page, no longer primary)
│   │       └── sellers/
│   │           └── page.tsx # Seller/listing verification queue
│   ├── api/                  # Next.js API routes (intended for backend logic)
│   │   └── (Currently empty, placeholders for future development)
│   ├── dashboard/            # Buyer Dashboard routes
│   │   ├── inquiries/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── listings/         # (Legacy or for a unified dashboard concept - currently seller-focused)
│   │   │   ├── [listingId]/
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
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
│   │   └── navbar.tsx
│   ├── marketplace/
│   │   ├── filters.tsx
│   │   ├── listing-card.tsx
│   │   └── sort-dropdown.tsx
│   ├── shared/
│   │   ├── logo.tsx
│   │   └── pagination-controls.tsx
│   └── ui/                   # ShadCN UI components (primitives)
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── chart.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── menubar.tsx
│       ├── popover.tsx
│       ├── progress.tsx
│       ├── radio-group.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       ├── slider.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── toast.tsx
│       └── toaster.tsx
├── hooks/                  # Custom React hooks
│   ├── use-mobile.tsx      # Hook to detect mobile screen sizes
│   └── use-toast.ts        # Hook for managing toast notifications
├── lib/                    # Utility functions, type definitions, placeholder data
│   ├── placeholder-data.ts # Sample data for development
│   ├── types.ts            # Core TypeScript type definitions for the application
│   └── utils.ts            # Utility functions (e.g., `cn` for Tailwind class merging)
├── middleware.ts           # Next.js middleware (basic pass-through, previously for Clerk)
└── (Other root files: next.config.ts, package.json, etc.)
```

## Key Directory Explanations:

*   **`src/ai/`**: Contains all Genkit related code for AI features.
    *   `genkit.ts`: Configures the core `ai` object with plugins (e.g., Google AI).
*   **`src/app/`**: The heart of the Next.js application using the App Router.
    *   **Route Groups (`(auth)`, `admin`, `dashboard`, `seller-dashboard` etc.)**: Used to organize routes. Parenthesized groups like `(auth)` do not affect the URL path but allow for shared layouts. Non-parenthesized groups like `admin` form part of the URL path (e.g., `/admin/users`).
    *   **Dynamic Routes (`[listingId]`, `[userId]`):** Used for pages that display content based on a parameter in the URL.
    *   **`layout.tsx` files:** Define UI shells that wrap around `page.tsx` files and nested layouts. `src/app/layout.tsx` is the root layout.
    *   **`page.tsx` files:** The main UI component for a specific route.
    *   **`src/app/api/`**: Intended location for backend API route handlers. Each subfolder would typically correspond to an API endpoint (e.g., `src/app/api/auth/register/route.ts`). *Currently, this folder is conceptual and empty, as backend logic is pending.*
*   **`src/components/`**: Contains all reusable React components.
    *   `ui/`: Base components provided by ShadCN UI (Button, Card, Input, etc.).
    *   Other subdirectories (`admin/`, `auth/`, `layout/`, `marketplace/`, `shared/`) contain custom components specific to those features or for general use.
*   **`src/hooks/`**: Custom React hooks to encapsulate reusable logic (e.g., `useToast` for notifications, `useIsMobile` for responsive checks).
*   **`src/lib/`**:
    *   `types.ts`: Central location for all TypeScript type definitions and interfaces used across the application (e.g., `User`, `Listing`, `Inquiry`).
    *   `placeholder-data.ts`: Provides mock data arrays (`sampleUsers`, `sampleListings`, etc.) used for UI development and prototyping before backend integration.
    *   `utils.ts`: General utility functions, most notably `cn` for merging Tailwind CSS classes.
*   **`src/middleware.ts`**: Handles Next.js middleware. It was previously configured for Clerk authentication and is now a basic pass-through. It would be reconfigured once a full authentication solution is integrated.

## Relationships:

*   **Layouts and Pages:** `layout.tsx` files wrap `page.tsx` files and other nested layouts, providing consistent UI structure (e.g., sidebars in `/admin/layout.tsx`, `/dashboard/layout.tsx`, `/seller-dashboard/layout.tsx`).
*   **Pages and Components:** `page.tsx` files import and use components from `src/components/` to build their UI. For example, `/app/marketplace/page.tsx` uses `ListingCard` and `Filters`.
*   **Forms and Schemas:** Page components containing forms (e.g., `/app/auth/register/buyer/page.tsx`, `/app/seller-dashboard/listings/create/page.tsx`) define Zod schemas inline for validation with `react-hook-form`. These schemas dictate the structure of data submitted (conceptually) to API routes.
*   **API Routes (Intended):** Frontend components (especially forms and data-driven pages) are designed to eventually submit data to and fetch data from API routes that would reside in `src/app/api/`.
