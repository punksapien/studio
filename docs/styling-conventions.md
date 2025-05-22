
# Styling and UI Conventions

This document outlines the primary styling approaches and UI conventions used in the BizMatch Asia project.

## 1. Core Styling Technologies

*   **Tailwind CSS:**
    *   The project heavily relies on Tailwind CSS, a utility-first CSS framework. This allows for rapid UI development directly within the HTML/JSX markup by composing utility classes.
    *   Customizations to the default Tailwind theme (colors, spacing, fonts) are managed in `tailwind.config.ts`.
*   **ShadCN UI:**
    *   A collection of reusable UI components built on top of Radix UI (for accessibility and unstyled primitives) and styled with Tailwind CSS.
    *   These components (e.g., Button, Card, Input, Select) are located in `src/components/ui/`.
    *   They are designed to be easily customizable and adhere to good design and accessibility practices.
    *   The base color scheme for ShadCN components (primary, secondary, accent, destructive, etc.) is defined using CSS variables in `src/app/globals.css`.

## 2. Global Styles and Theme

*   **`src/app/globals.css`:**
    *   This file contains:
        *   Base Tailwind CSS directives (`@tailwind base; @tailwind components; @tailwind utilities;`).
        *   Root CSS variable definitions for the application's color palette (light and dark themes). These variables control the colors for background, foreground, primary, secondary, accent, destructive, borders, inputs, etc., aligning with the ShadCN UI theming system.
        *   The color palette is designed around the project's style guidelines:
            *   Primary: Deep sky blue (`#3498db` -> `hsl(207 68% 53%)`)
            *   Background: Light gray (`#ecf0f1` -> `hsl(200 17% 94%)`)
            *   Accent: Emerald green (`#2ecc71` -> `hsl(145 63% 49%)`)
        *   Sidebar-specific color variables are also defined here to allow for distinct sidebar theming if needed.
        *   Chart color variables (`--chart-1` to `--chart-5`).
    *   Basic global styles like border defaults and body background/text color.
*   **`tailwind.config.ts`:**
    *   Extends the default Tailwind theme with the custom color palette defined in `globals.css` via CSS variables.
    *   Configures the `container` class for consistent centering and padding (`padding: { DEFAULT: '1rem', sm: '1.5rem', md: '2rem', lg: '2.5rem' }`).
    *   Defines custom `borderRadius` values based on the `--radius` CSS variable.
    *   Includes Tailwind CSS animation keyframes for components like accordions.
    *   The `tailwindcss-animate` plugin is enabled.

## 3. Font Management

*   **Fonts:**
    *   Geist Sans (variable: `--font-geist-sans`) for general text.
    *   Geist Mono (variable: `--font-geist-mono`) for monospaced text (e.g., code snippets if any).
*   **Implementation:** These fonts are imported and configured in `src/app/layout.tsx` using `next/font/google`. The font variables are then applied to the `<body>` tag, making them available throughout the application via Tailwind's font utility classes (e.g., `font-sans`, `font-mono`).

## 4. Layout Conventions

*   **Responsive Design:** The application is built with responsiveness in mind.
    *   Tailwind's responsive prefixes (e.g., `md:`, `lg:`) are used extensively for styling adjustments across different screen sizes.
    *   Flexbox and Grid are the primary layout tools for arranging elements.
    *   Components like sidebars (`src/components/ui/sidebar.tsx`) and navigation menus (`src/components/layout/navbar.tsx` using `Sheet` from ShadCN) adapt for mobile screens (e.g., collapsing into sheet menus).
*   **Container Class:** The `.container` class (customized in `tailwind.config.ts`) is used on top-level page wrappers (e.g., in `/app/page.tsx`, `/app/about/page.tsx`) to center content and provide consistent horizontal padding.
*   **Spacing:** Tailwind's spacing utility classes (margin `m-`, `mx-`, `my-`, `mt-`, etc., and padding `p-`, `px-`, `py-`, `pt-`, etc.) are used for consistent spacing between elements.
*   **Shadows and Borders:** Rounded corners (`rounded-md`, `rounded-lg`), shadows (`shadow-sm`, `shadow-lg`, `shadow-xl`), and borders (`border`) are applied to elements like cards and buttons to give them a professional feel, primarily through Tailwind utility classes and ShadCN component defaults.

## 5. Component Structure

*   **ShadCN UI Primitives:** Forms the base for most interactive UI elements (buttons, inputs, dialogs, cards, etc.). These are found in `src/components/ui/`.
*   **Custom Components:** Built by composing ShadCN UI primitives and Tailwind CSS utilities.
    *   Located in `src/components/` and organized by feature area (e.g., `auth/`, `marketplace/`, `admin/`, `dashboard/`, `seller-dashboard/`) or shared usage (`shared/`, `layout/`).
*   **Server Components & Client Components:** The Next.js App Router paradigm is followed.
    *   Many pages and layouts are Server Components by default for performance benefits.
    *   Interactive components requiring client-side JavaScript (e.g., forms with `react-hook-form` and event handlers, components using `useState` or `useEffect` for dynamic client-side behavior) are explicitly marked with the `'use client';` directive at the top of the file.

## 6. Accessibility (ARIA)

*   ShadCN UI components are built with accessibility in mind, often leveraging Radix UI primitives which follow ARIA (Accessible Rich Internet Applications) patterns and provide keyboard navigation.
*   Where custom interactive elements are built, ARIA attributes (e.g., `aria-label`, `role`) should be considered and added as needed to ensure accessibility.

By adhering to these conventions, the project aims for a consistent, modern, responsive, and accessible user interface.
