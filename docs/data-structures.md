
# Data Structures, Types, and Schemas

This document outlines the core TypeScript types and Zod validation schemas used in the BizMatch Asia project.

## 1. Core TypeScript Types

These types are primarily defined in `src/lib/types.ts`.

### `UserRole`
```typescript
export type UserRole = 'seller' | 'buyer' | 'admin';
```
Defines the possible roles a user can have in the system.

### `VerificationStatus`
```typescript
export type VerificationStatus = 'anonymous' | 'pending_verification' | 'verified' | 'rejected';
```
Defines the verification lifecycle status for users and listings.

### `BuyerPersonaTypes` (Array of Const)
```typescript
export const BuyerPersonaTypes = [
  "Individual Investor / Entrepreneur",
  "Private Equity Firm",
  "Strategic Acquirer / Corporate Representative",
  "Family Office Representative",
  "Search Fund Principal",
  "Angel Investor",
  "Company Executive (MBI/MBO)",
  "Other"
] as const;
export type BuyerPersona = typeof BuyerPersonaTypes[number];
```
Defines the types of buyer personas for more detailed user profiling.

### `PreferredInvestmentSizes` (Array of Const)
```typescript
export const PreferredInvestmentSizes = [
  "Up to $100,000 USD",
  "$100,000 - $500,000 USD",
  "$500,000 - $2,000,000 USD",
  "$2,000,000 - $10,000,000 USD",
  "$10,000,000+ USD",
  "Flexible / Varies"
] as const;
export type PreferredInvestmentSize = typeof PreferredInvestmentSizes[number];
```
Defines preferred investment size ranges for buyers.

### `User` Interface
```typescript
export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  country: string;
  role: UserRole;
  isEmailVerified: boolean;
  verificationStatus: VerificationStatus;
  isPaid: boolean;
  initialCompanyName?: string; // For sellers
  // Buyer Persona Fields
  buyerPersonaType?: BuyerPersona;
  buyerPersonaOther?: string;
  investmentFocusDescription?: string;
  preferredInvestmentSize?: PreferredInvestmentSize;
  keyIndustriesOfInterest?: string;
  // Timestamps & Counts
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  listingCount?: number; // For sellers
  inquiryCount?: number; // For buyers
}
```
Represents a user in the system, accommodating both buyers and sellers with role-specific and persona fields.

### `ListingStatus`
```typescript
export type ListingStatus = 'active' | 'inactive' | 'pending_verification' | 'verified_anonymous' | 'verified_public';
```
Defines the status of a business listing (e.g., is it live on the marketplace, undergoing verification).

### `EmployeeCountRange` & `employeeCountRanges`
```typescript
export type EmployeeCountRange = "Sole Operator" | "1-5" | "6-10" | "11-25" | "26-50" | "50+";
export const employeeCountRanges: EmployeeCountRange[] = ["Sole Operator", "1-5", "6-10", "11-25", "26-50", "50+"];
```
Defines ranges for the number of employees in a business, used in listing forms.

### `Listing` Interface
```typescript
export interface Listing {
  id: string;
  sellerId: string;
  // Anonymous Info
  listingTitleAnonymous: string;
  industry: string;
  locationCountry: string;
  locationCityRegionGeneral: string;
  anonymousBusinessDescription: string;
  keyStrengthsAnonymous: string[];
  annualRevenueRange: string;
  netProfitMarginRange?: string;
  askingPriceRange: string;
  dealStructureLookingFor?: DealStructure[]; // DealStructure is an array of strings
  reasonForSellingAnonymous?: string;
  // Detailed Info (for verified view / admin)
  businessModel?: string;
  yearEstablished?: number;
  registeredBusinessName?: string;
  actualCompanyName?: string;
  fullBusinessAddress?: string;
  businessWebsiteUrl?: string;
  socialMediaLinks?: string;
  numberOfEmployees?: EmployeeCountRange;
  technologyStack?: string;
  specificAnnualRevenueLastYear?: number;
  specificNetProfitLastYear?: number;
  financialsExplanation?: string;
  detailedReasonForSelling?: string;
  sellerRoleAndTimeCommitment?: string;
  postSaleTransitionSupport?: string;
  growthPotentialNarrative?: string;
  specificGrowthOpportunities?: string; // Could be string[] or formatted string
  // Document Links (placeholders for URLs from Supabase Storage)
  financialDocumentsUrl?: string;
  keyMetricsReportUrl?: string;
  ownershipDocumentsUrl?: string;
  // Status & Timestamps
  status: ListingStatus;
  isSellerVerified: boolean; // Reflects if the seller (and by extension, this listing if verified) is trustworthy
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
  inquiryCount?: number;
  // Other document link fields (may consolidate or keep as needed)
  financialSnapshotUrl?: string;
  ownershipDetailsUrl?: string;
  locationRealEstateInfoUrl?: string;
  webPresenceInfoUrl?: string;
  secureDataRoomLink?: string;
}
```
Represents a business listing with both anonymous and detailed (potentially verified) information.

### `Inquiry` System Types
```typescript
export type InquiryStatusBuyerPerspective =
  | 'Inquiry Sent'
  | 'Seller Engaged - Your Verification Required'
  | 'Seller Engaged - Seller Verification Pending'
  | 'Ready for Admin Connection'
  | 'Connection Facilitated by Admin'
  | 'Archived';

export type InquiryStatusSellerPerspective =
  | 'New Inquiry'
  | 'You Engaged - Buyer Verification Pending'
  | 'You Engaged - Your Listing Verification Pending'
  | 'Ready for Admin Connection'
  | 'Connection Facilitated by Admin'
  | 'Archived';

export type InquiryStatusSystem = // Internal state
  | 'new_inquiry'
  | 'seller_engaged_buyer_pending_verification'
  | 'seller_engaged_seller_pending_verification'
  | 'ready_for_admin_connection'
  | 'connection_facilitated'
  | 'archived';

export interface Inquiry {
  id: string;
  listingId: string;
  listingTitleAnonymous: string;
  sellerStatus?: 'Anonymous Seller' | 'Platform Verified Seller'; // Seller's status at time of inquiry
  buyerId: string;
  buyerName?: string; // Buyer's name (visible to seller)
  buyerVerificationStatus?: VerificationStatus; // Buyer's verification status (visible to seller)
  sellerId: string;
  inquiryTimestamp: Date;
  engagementTimestamp?: Date; // When seller clicks "Engage"
  status: InquiryStatusSystem; // Internal system status
  statusBuyerPerspective?: InquiryStatusBuyerPerspective; // Status shown to buyer
  statusSellerPerspective?: InquiryStatusSellerPerspective; // Status shown to seller
  createdAt: Date;
  updatedAt: Date;
}
```
Represents an inquiry made by a buyer on a listing, including various status perspectives.

### `AdminDashboardMetrics` Interface
```typescript
export interface AdminDashboardMetrics {
  newUserRegistrations24hSellers: number;
  newUserRegistrations24hBuyers: number;
  newUserRegistrations7dSellers: number;
  newUserRegistrations7dBuyers: number;
  newListingsCreated24h: number;
  newListingsCreated7d: number;
  totalActiveSellers: number;
  totalPaidSellers: number;
  totalFreeSellers: number;
  totalActiveBuyers: number;
  totalPaidBuyers: number;
  totalFreeBuyers: number;
  totalActiveListingsAnonymous: number;
  totalActiveListingsVerified: number;
  buyerVerificationQueueCount: number;
  sellerVerificationQueueCount: number;
  readyToEngageQueueCount: number;
  successfulConnectionsMTD: number; // Total: active + closed
  activeSuccessfulConnections: number;
  closedSuccessfulConnections: number; // Or "Deals Closed MTD"
  dealsClosedMTD?: number; // Potentially same as closedSuccessfulConnections
  totalRevenueMTD?: number; // Sum of buyer and seller revenue
  revenueFromBuyers: number;
  revenueFromSellers: number;
}
```
Structure for data displayed on the Admin Dashboard overview and Analytics page.

### `VerificationRequestItem` Interface
```typescript
export type VerificationQueueStatus = "New Request" | "Contacted" | "Docs Under Review" | "More Info Requested" | "Approved" | "Rejected";

export interface VerificationRequestItem {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: UserRole;
  listingId?: string; // If it's a listing verification request
  listingTitle?: string; // Title of the listing being verified
  triggeringUserId?: string; // e.g., if an engagement triggered a verification prompt
  reason: string; // e.g., "New buyer registration", "Seller submitted new listing"
  status: VerificationQueueStatus;
  documentsSubmitted?: { name: string, type: 'id_proof' | 'business_reg' | 'financials' }[]; // Placeholder
}
```
Represents an item in the admin verification queues (for buyers or sellers/listings).

### `ReadyToEngageItem` Interface
```typescript
export interface ReadyToEngageItem {
  id: string; // Typically corresponds to an Inquiry ID
  timestamp: Date; // When it became "ready to engage"
  buyerId: string;
  buyerName: string;
  buyerVerificationStatus: VerificationStatus;
  sellerId: string;
  sellerName: string;
  sellerVerificationStatus: VerificationStatus;
  listingId: string;
  listingTitle: string;
  listingVerificationStatus: ListingStatus; // Or specifically seller's verification status for the listing
}
```
Represents an engagement where both buyer and seller are verified and have agreed to connect, now awaiting admin facilitation.

### `NotificationType` and `NotificationItem` Interface
```typescript
export type NotificationType = 'inquiry' | 'verification' | 'system' | 'engagement' | 'listing_update';

export interface NotificationItem {
  id: string;
  timestamp: Date;
  message: string;
  link?: string; // Optional link to relevant page
  isRead: boolean;
  userId: string; // The user to whom this notification belongs
  type: NotificationType;
}
```
Represents a notification for a user (buyer or seller).

## 2. Zod Validation Schemas

Zod schemas are primarily defined inline within their respective form page components (e.g., in `src/app/auth/...`, `src/app/dashboard/...`, `src/app/seller-dashboard/...`).

### Buyer Registration Schema
*   **Location:** `/app/auth/register/buyer/page.tsx` (`BuyerRegisterSchema`)
*   **Fields:** `fullName`, `email`, `password`, `confirmPassword`, `phoneNumber`, `country`, `buyerPersonaType`, `buyerPersonaOther` (conditional), `investmentFocusDescription`, `preferredInvestmentSize`, `keyIndustriesOfInterest`.
*   **Rules:** Includes email format, password minimum length (8 chars), password confirmation match. `buyerPersonaOther` is required if `buyerPersonaType` is "Other". Other persona fields are optional strings.

### Seller Registration Schema
*   **Location:** `/app/auth/register/seller/page.tsx` (`SellerRegisterSchema`)
*   **Fields:** `fullName`, `email`, `password`, `confirmPassword`, `phoneNumber`, `country`, `initialCompanyName` (optional).
*   **Rules:** Email format, password minimum length (8 chars), password confirmation match.

### Login Schema
*   **Location:** `/app/auth/login/page.tsx` (`LoginSchema`)
*   **Fields:** `email`, `password`.
*   **Rules:** Email format, password required (min 1 char).

### Forgot Password Schema
*   **Location:** `/app/auth/forgot-password/page.tsx` (`ForgotPasswordSchema`)
*   **Fields:** `email`.
*   **Rules:** Email format.

### Profile Update Schema
*   **Location:** `/app/dashboard/profile/page.tsx` (Buyer context) and `/app/seller-dashboard/profile/page.tsx` (Seller context). The schema `ProfileSchema` is defined in `/app/dashboard/profile/page.tsx` and is structured to handle both, but the seller profile page would implicitly have `role: 'seller'`.
*   **Fields:** `fullName`, `phoneNumber`, `country`, `role` (used by `superRefine`), `initialCompanyName` (optional, but required for sellers by `superRefine`), `buyerPersonaType`, `buyerPersonaOther`, `investmentFocusDescription`, `preferredInvestmentSize`, `keyIndustriesOfInterest`.
*   **Rules:** `superRefine` enforces `initialCompanyName` for sellers and `buyerPersonaType` for buyers (with conditional `buyerPersonaOther`).

### Password Change Schema
*   **Location:** `/app/dashboard/profile/page.tsx` and `/app/seller-dashboard/profile/page.tsx` (`PasswordChangeSchema`)
*   **Fields:** `currentPassword`, `newPassword`, `confirmNewPassword`.
*   **Rules:** `newPassword` min 8 chars, `newPassword` must match `confirmNewPassword`.

### Listing Creation/Edit Schema
*   **Location:** `/app/seller-dashboard/listings/create/page.tsx` and `/app/seller-dashboard/listings/[listingId]/edit/page.tsx` (`ListingSchema`)
*   **Fields:**
    *   Anonymous: `listingTitleAnonymous`, `industry`, `locationCountry`, `locationCityRegionGeneral`, `anonymousBusinessDescription`, `keyStrengthsAnonymous` (array of strings, min 1, max 5), `annualRevenueRange`, `netProfitMarginRange` (optional), `askingPriceRange`, `dealStructureLookingFor` (optional array), `reasonForSellingAnonymous` (optional).
    *   Detailed/Verified: `businessModel` (optional), `yearEstablished` (optional number, constrained), `registeredBusinessName` (optional), `businessWebsiteUrl` (optional URL), `socialMediaLinks` (optional), `numberOfEmployees` (optional enum), `technologyStack` (optional), `specificAnnualRevenueLastYear` (optional number), `specificNetProfitLastYear` (optional number), `financialsExplanation` (optional), `detailedReasonForSelling` (optional), `sellerRoleAndTimeCommitment` (optional), `postSaleTransitionSupport` (optional), `growthPotentialNarrative` (optional), `specificGrowthOpportunities` (optional).
*   **Rules:** Min/max lengths, array validation, URL validation, number constraints.

### Admin Login Schema
*   **Location:** `/app/admin/login/page.tsx` (`AdminLoginSchema`)
*   **Fields:** `email`, `password`.
*   **Rules:** Email format, password required (min 1 char).

These types and schemas are fundamental to maintaining data integrity and consistency throughout the application, both on the frontend for forms and for intended backend API validation.
