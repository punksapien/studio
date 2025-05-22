
# Key Reusable UI Components

This document highlights significant custom reusable UI components created for the BizMatch Asia project, beyond the base ShadCN UI primitives.

## 1. General Shared Components

*   **`src/components/shared/logo.tsx` (`<Logo />`)**
    *   **Purpose:** Displays the BizMatch Asia logo with a link to the homepage.
    *   **Key Props:**
        *   `size?: 'xl' | '2xl' | 'lg'`: Controls the text size of the logo. (Default: 'xl')
    *   **Data Handled:** None, purely presentational.

*   **`src/components/shared/pagination-controls.tsx` (`<PaginationControls />`)**
    *   **Purpose:** Renders previous/next buttons and page information for paginated lists.
    *   **Key Props:**
        *   `currentPage: number`: The current active page.
        *   `totalPages: number`: The total number of pages.
        *   `onPageChange: (page: number) => void`: Callback function triggered when a page navigation button is clicked.
    *   **Data Handled:** Pagination state.

## 2. Authentication Components

*   **`src/components/auth/auth-card-wrapper.tsx` (`<AuthCardWrapper />`)**
    *   **Purpose:** Provides a consistent styled card wrapper for authentication forms (Login, Register, Forgot Password). Includes the site logo and a link to an alternative auth action (e.g., "Don't have an account? Register").
    *   **Key Props:**
        *   `children: React.ReactNode`: The form content itself.
        *   `headerLabel: string`: Text displayed below the logo in the card header.
        *   `backButtonLabel: string`: Text for the link at the bottom.
        *   `backButtonHref: string`: The URL for the back button link.
        *   `showSocial?: boolean`: Placeholder for future social login integration (currently displays "Or continue with social..." text if true).
    *   **Data Handled:** Wraps authentication form elements.

*   **`src/components/auth/common-registration-fields.tsx` (`<CommonRegistrationFields />`)**
    *   **Purpose:** Encapsulates the common input fields used in both Buyer and Seller registration forms: Full Name, Email Address, Password, Confirm Password, Phone Number, and Country.
    *   **Key Props:**
        *   `control: Control<any>`: The `control` object from `react-hook-form` for field registration and validation state.
        *   `isPending: boolean`: Boolean to disable fields during form submission.
    *   **Data Handled:** Manages form state and validation for these common fields using `react-hook-form`.

## 3. Marketplace Components

*   **`src/components/marketplace/listing-card.tsx` (`<ListingCard />`)**
    *   **Purpose:** Displays a summary of a business listing in a card format, typically used in marketplace grids (e.g., on the landing page preview and the main `/marketplace` page).
    *   **Key Props:**
        *   `listing: Listing`: The `Listing` object (from `src/lib/types.ts`) containing data to display.
    *   **Data Handled:** Shows anonymous listing details: image (`listing.imageUrl` or placeholder), title (`listing.listingTitleAnonymous`), industry, location, annual revenue range, a snippet of the description, and a "Verified" badge if `listing.isSellerVerified` is true. Includes a "View Details" button linking to `/listings/[listing.id]`.

*   **`src/components/marketplace/filters.tsx` (`<Filters />`)**
    *   **Purpose:** Renders the filter sidebar for the `/marketplace` page. Allows users to filter listings by Industry, Country, Annual Revenue Range, Asking Price Range, and Keywords.
    *   **Key Props:** None (state is managed internally for UI purposes; actual filtering would involve updating URL query parameters or a shared state).
    *   **Data Handled:** Filter criteria. (Currently, the UI elements are present, but they don't perform actual filtering on the `sampleListings` data; this would be a backend/API driven feature).

*   **`src/components/marketplace/sort-dropdown.tsx` (`<SortDropdown />`)**
    *   **Purpose:** Provides a dropdown menu to select sorting options for marketplace listings (e.g., Newest, Price Low-High).
    *   **Key Props:** None.
    *   **Data Handled:** Sort criteria. (Currently UI only; sorting would be a backend/API feature).

## 4. Admin Panel Components

*   **`src/components/admin/metric-card.tsx` (`<MetricCard />`)**
    *   **Purpose:** A reusable card component designed to display key metrics on the Admin Dashboard overview page.
    *   **Key Props:**
        *   `title: string`: The title of the metric (e.g., "New Users (24h)").
        *   `value: string | number`: The value of the metric.
        *   `icon: LucideIcon`: An icon component from `lucide-react` to display.
        *   `description?: string`: Optional additional descriptive text below the value.
        *   `trend?: string`: Optional text indicating a trend (e.g., "+5.2% from last month").
        *   `trendDirection?: 'up' | 'down' | 'neutral'`: Controls the color of the trend text.
    *   **Data Handled:** Displays a single metric and its associated information.

## 5. Layout Components

*   **`src/components/layout/navbar.tsx` (`<Navbar />`)**
    *   **Purpose:** The main top navigation bar for the application.
    *   **Key Props:** None.
    *   **Data Handled:** Displays navigation links (Marketplace, For Sellers, For Buyers, About Us), the site logo. It includes a placeholder `isAuthenticated` state (currently `false`) to conditionally show "Login" and "Register" buttons or a "Dashboard" link. Provides a mobile-responsive sheet menu.

*   **`src/components/layout/footer.tsx` (`<Footer />`)**
    *   **Purpose:** The main application footer.
    *   **Key Props:** None.
    *   **Data Handled:** Displays copyright information and links to key pages like About, Contact, Terms, and Privacy.

*   **`src/components/ui/sidebar.tsx` (`<SidebarProvider />`, `<Sidebar />`, `<SidebarMenuButton />`, etc.)**
    *   **Purpose:** A comprehensive and highly flexible sidebar system (adapted from ShadCN UI examples). It's used to create the main navigation structure for the Admin Panel (`/app/admin/layout.tsx`), Buyer Dashboard (`/app/dashboard/layout.tsx`), and Seller Dashboard (`/app/seller-dashboard/layout.tsx`).
    *   **Key Props:** Numerous props to control appearance (`variant`, `collapsible`), behavior (`defaultOpen`, `side`), and content. `SidebarMenuButton` takes `isActive` to highlight the current route and `tooltip` for collapsed view.
    *   **Data Handled:** Manages sidebar state (open/closed, mobile state) and renders navigation items (links with icons and text) passed as children. Active state is determined by comparing `pathname` with item `href`.

This list covers the most significant custom components. Many other UI elements are directly composed using primitives from `src/components/ui/` (ShadCN UI components like `<Button />`, `<Card />`, `<Input />`, `<Select />`, `<Table />`, `<Tabs />`, etc.).
