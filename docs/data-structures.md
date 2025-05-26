
# Data Structures, Types, and Schemas

This document outlines the core TypeScript types and Zod validation schemas used in the Nobridge project.

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
export type ListingStatus = 'active' | 'inactive' | 'pending_verification' | 'verified_anonymous' | 'verified_public' | 'rejected_by_admin' | 'closed_deal';
```
Defines the status of a business listing.

### `EmployeeCountRange` & `employeeCountRanges`
```typescript
export type EmployeeCountRange = "Sole Operator" | "1-5" | "6-10" | "11-25" | "26-50" | "50+";
export const employeeCountRanges: EmployeeCountRange[] = ["Sole Operator", "1-5", "6-10", "11-25", "26-50", "50+"];
```
Defines ranges for the number of employees in a business.

### `Listing` Interface (Updated)
```typescript
export interface Listing {
  id: string;
  sellerId: string;
  // Core Anonymous Info
  listingTitleAnonymous: string;
  industry: string;
  locationCountry: string;
  locationCityRegionGeneral: string;
  anonymousBusinessDescription: string;
  keyStrengthsAnonymous: string[];
  annualRevenueRange: string;
  netProfitMarginRange?: string;
  askingPrice?: number; // Changed from askingPriceRange
  dealStructureLookingFor?: DealStructure[];
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
  
  // Specific Financials (for verified view / admin)
  specificAnnualRevenueLastYear?: number;
  specificNetProfitLastYear?: number;
  adjustedCashFlow?: number; // Added
  adjustedCashFlowExplanation?: string; // Added

  // Detailed Seller & Deal Info (for verified view / admin)
  detailedReasonForSelling?: string;
  sellerRoleAndTimeCommitment?: string;
  postSaleTransitionSupport?: string;

  // Growth
  specificGrowthOpportunities?: string; // For bullet points (string with newlines)

  // Status & Timestamps
  status: ListingStatus;
  isSellerVerified: boolean; 

  // Media & Documents
  imageUrls?: string[]; // Changed from single imageUrl
  financialDocumentsUrl?: string; 
  keyMetricsReportUrl?: string; 
  ownershipDocumentsUrl?: string; 
  financialSnapshotUrl?: string; 
  ownershipDetailsUrl?: string; 
  locationRealEstateInfoUrl?: string; 
  webPresenceInfoUrl?: string; 
  secureDataRoomLink?: string; 

  createdAt: Date;
  updatedAt: Date;
  inquiryCount?: number;
}
```

### `Inquiry` System Types
(No changes to Inquiry types in this update from the user request, but ensuring they are listed)
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
  sellerStatus?: 'Anonymous Seller' | 'Platform Verified Seller';
  buyerId: string;
  buyerName?: string; 
  buyerVerificationStatus?: VerificationStatus; 
  sellerId: string;
  inquiryTimestamp: Date;
  engagementTimestamp?: Date;
  status: InquiryStatusSystem; 
  statusBuyerPerspective?: InquiryStatusBuyerPerspective; 
  statusSellerPerspective?: InquiryStatusSellerPerspective; 
  createdAt: Date;
  updatedAt: Date;
}
```

### `AdminDashboardMetrics` Interface (Updated)
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
  totalListingsAllStatuses: number; // Added
  closedOrDeactivatedListings: number; // Added
  buyerVerificationQueueCount: number;
  sellerVerificationQueueCount: number;
  readyToEngageQueueCount: number;
  successfulConnectionsMTD: number; 
  activeSuccessfulConnections: number; 
  closedSuccessfulConnections: number; 
  dealsClosedMTD?: number; 
  totalRevenueMTD?: number; 
  revenueFromBuyers: number; 
  revenueFromSellers: number; 
}
```

### `VerificationRequestItem` Interface
```typescript
export type VerificationQueueStatus = "New Request" | "Contacted" | "Docs Under Review" | "More Info Requested" | "Approved" | "Rejected";

export interface VerificationRequestItem {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: UserRole;
  listingId?: string;
  listingTitle?: string;
  triggeringUserId?: string; // ID of the user whose action triggered this request (e.g. buyer inquiring)
  reason: string; // e.g., "Buyer profile verification", "Seller listing verification for [Listing XYZ]"
  status: VerificationQueueStatus; // Status of this request in the admin queue
  documentsSubmitted?: { name: string, type: 'id_proof' | 'business_reg' | 'financials' }[]; // Placeholder for document tracking
}
```

### `ReadyToEngageItem` Interface
```typescript
export interface ReadyToEngageItem {
  id: string; // Inquiry ID
  timestamp: Date; // When it became ready
  buyerId: string;
  buyerName: string;
  buyerVerificationStatus: VerificationStatus;
  sellerId: string;
  sellerName: string;
  sellerVerificationStatus: VerificationStatus;
  listingId: string;
  listingTitle: string;
  listingVerificationStatus: ListingStatus; // The verification status OF THE LISTING itself
}
```

### `NotificationItem` Interface
```typescript
export type NotificationType = 'inquiry' | 'verification' | 'system' | 'engagement' | 'listing_update';

export interface NotificationItem {
  id: string;
  timestamp: Date;
  message: string;
  link?: string; 
  isRead: boolean;
  userId: string; 
  type: NotificationType;
}
```

### `placeholderKeywords`
```typescript
export const placeholderKeywords: string[] = ["SaaS", "E-commerce", "Retail", "Service Business", "High Growth", "Profitable", "Fintech", "Logistics", "Healthcare Tech"];
```

## 2. Zod Validation Schemas

Zod schemas are primarily defined inline within their respective form page components.

### Buyer Registration Schema (`/app/auth/register/buyer/page.tsx`)
*   Includes `fullName`, `email`, `password`, `confirmPassword`, `phoneNumber`, `country`.
*   **Updated Fields:** `buyerPersonaType` (enum `BuyerPersonaTypes`), `buyerPersonaOther` (conditional), `investmentFocusDescription` (optional), `preferredInvestmentSize` (optional enum `PreferredInvestmentSizes`), `keyIndustriesOfInterest` (optional).
*   Rules: Includes `superRefine` for conditional `buyerPersonaOther`.

### Seller Registration Schema (`/app/auth/register/seller/page.tsx`)
*   Fields: `fullName`, `email`, `password`, `confirmPassword`, `phoneNumber`, `country`, `initialCompanyName` (optional).

### Login Schema (`/app/auth/login/page.tsx`)
*   Fields: `email`, `password`.

### OTP Schema (`/app/(auth)/verify-otp/page.tsx`)
*   Fields: `otp` (6 digits).

### Forgot Password Schema (`/app/auth/forgot-password/page.tsx`)
*   Fields: `email`.

### Profile Update Schema (Buyer - `/app/dashboard/profile/page.tsx`)
*   Includes `fullName`, `phoneNumber`, `country`, `role` (fixed to 'buyer').
*   **Updated Fields:** `buyerPersonaType`, `buyerPersonaOther`, `investmentFocusDescription`, `preferredInvestmentSize`, `keyIndustriesOfInterest`.
*   Rules: `superRefine` for buyer-specific conditional fields.

### Profile Update Schema (Seller - `/app/seller-dashboard/profile/page.tsx`)
*   Fields: `fullName`, `phoneNumber`, `country`, `role` (fixed to 'seller'), `initialCompanyName` (conditionally required).

### Password Change Schema (`/app/dashboard/settings/page.tsx` and `/app/seller-dashboard/settings/page.tsx`)
*   Fields: `currentPassword`, `newPassword`, `confirmNewPassword`.

### Listing Creation/Edit Schema (`/app/seller-dashboard/listings/create/page.tsx` and `/app/seller-dashboard/listings/[listingId]/edit/page.tsx`)
*   **Updated Fields:**
    *   Anonymous: `listingTitleAnonymous`, `industry`, `locationCountry`, `locationCityRegionGeneral`, `anonymousBusinessDescription`, `keyStrengthsAnonymous` (array of strings), `annualRevenueRange`, `netProfitMarginRange` (optional), `reasonForSellingAnonymous` (optional).
    *   Detailed/Verified: `businessModel` (optional), `yearEstablished` (optional number), `registeredBusinessName` (optional), `businessWebsiteUrl` (optional URL), `socialMediaLinks` (optional), `numberOfEmployees` (optional enum), `technologyStack` (optional).
    *   Financials: `askingPrice` (optional number - **changed from range**), `adjustedCashFlow` (optional number - **added**), `adjustedCashFlowExplanation` (optional - **added**), `specificAnnualRevenueLastYear` (optional number), `specificNetProfitLastYear` (optional number).
    *   Deal & Seller: `dealStructureLookingFor` (optional array of strings - **now multi-select**), `detailedReasonForSelling` (optional), `sellerRoleAndTimeCommitment` (optional), `postSaleTransitionSupport` (optional).
    *   Growth: `specificGrowthOpportunities` (optional string for bullet points - **narrative removed**).
    *   Image URLs: `imageUrl1` through `imageUrl5` (optional URLs, combined into `imageUrls` array).
*   Rules: Includes min/max lengths, array validation, URL validation, number constraints.

These types and schemas are fundamental to maintaining data