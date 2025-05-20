
export type UserRole = 'seller' | 'buyer' | 'admin';

export type VerificationStatus = 'anonymous' | 'pending_verification' | 'verified' | 'rejected';

export type BuyerType = 'Individual Investor' | 'Investment Firm' | 'Strategic Acquirer';
export const buyerTypes: BuyerType[] = ['Individual Investor', 'Investment Firm', 'Strategic Acquirer'];

export type DealStructure = 'Full Acquisition' | 'Partial Sale/Investment' | 'Open to Offers';
export const dealStructures: DealStructure[] = ['Full Acquisition', 'Partial Sale/Investment', 'Open to Offers'];

export const revenueRanges = [
  "< $50K USD", "$50K - $100K USD", "$100K - $250K USD", 
  "$250K - $500K USD", "$500K - $1M USD", "$1M+ USD"
];
export const profitMarginRanges = [
  "< 0% (Loss-making)", "0% - 10%", "10% - 20%", 
  "20% - 30%", "30%+"
];
export const askingPriceRanges = revenueRanges; 

export const industries = ["Software", "Retail", "Manufacturing", "Services - Marketing", "E-commerce", "Healthcare", "Finance", "Education", "Real Estate", "Other"];
export const asianCountries = ["Singapore", "Malaysia", "Indonesia", "Thailand", "Vietnam", "Philippines", "Hong Kong", "Japan", "South Korea", "India", "China", "Other"];

export type EmployeeCountRange = "Sole Operator" | "1-5" | "6-10" | "11-25" | "26-50" | "50+";
export const employeeCountRanges: EmployeeCountRange[] = ["Sole Operator", "1-5", "6-10", "11-25", "26-50", "50+"];

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
  buyerType?: BuyerType; // For buyers
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date; // New for Admin Panel
  listingCount?: number; // New for Admin Panel (sellers)
  inquiryCount?: number; // New for Admin Panel (buyers)
}

export type ListingStatus = 'active' | 'inactive' | 'pending_verification' | 'verified_anonymous' | 'verified_public'; // More detailed status

export interface Listing {
  id: string;
  sellerId: string;
  listingTitleAnonymous: string;
  industry: string; 
  locationCountry: string;
  locationCityRegionGeneral: string;
  anonymousBusinessDescription: string;
  keyStrengthsAnonymous: string[];
  businessModel?: string;
  yearEstablished?: number;
  registeredBusinessName?: string;
  businessWebsiteUrl?: string;
  socialMediaLinks?: string; 
  numberOfEmployees?: EmployeeCountRange;
  technologyStack?: string;

  annualRevenueRange: string; 
  netProfitMarginRange?: string;
  askingPriceRange: string; 
  specificAnnualRevenueLastYear?: number;
  specificNetProfitLastYear?: number;
  financialsExplanation?: string;
  
  dealStructureLookingFor?: DealStructure[];
  reasonForSellingAnonymous?: string;
  detailedReasonForSelling?: string;
  sellerRoleAndTimeCommitment?: string;
  postSaleTransitionSupport?: string;

  growthPotentialNarrative?: string;
  specificGrowthOpportunities?: string;

  status: ListingStatus; // Updated status type
  isSellerVerified: boolean; 
  
  actualCompanyName?: string;
  fullBusinessAddress?: string;
  
  financialDocumentsUrl?: string; 
  keyMetricsReportUrl?: string;
  ownershipDocumentsUrl?: string;
  
  secureDataRoomLink?: string;
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string; 
  potentialForGrowthNarrative?: string; 
  financialSnapshotUrl?: string; 
  ownershipDetailsUrl?: string;
  locationRealEstateInfoUrl?: string;
  webPresenceInfoUrl?: string; 
  inquiryCount?: number; 
}

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

export type InquiryStatusSystem =
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

export interface AdminDashboardMetrics {
  newUserRegistrations24hSellers: number; // Breakdown
  newUserRegistrations24hBuyers: number;  // Breakdown
  newUserRegistrations7dSellers: number;  // Breakdown
  newUserRegistrations7dBuyers: number;   // Breakdown
  newListingsCreated24h: number;
  newListingsCreated7d: number;
  totalActiveSellers: number;
  totalPaidSellers: number; // New
  totalFreeSellers: number; // New
  totalActiveBuyers: number;
  totalPaidBuyers: number;  // New
  totalFreeBuyers: number;  // New
  totalActiveListingsAnonymous: number;
  totalActiveListingsVerified: number;
  buyerVerificationQueueCount: number;
  sellerVerificationQueueCount: number; 
  readyToEngageQueueCount: number;
  successfulConnectionsMTD: number; // New
  dealsClosedMTD?: number; // New, optional
  totalRevenueMTD?: number; // New, optional
}


export type VerificationQueueStatus = "New Request" | "Contacted" | "Docs Under Review" | "More Info Requested" | "Approved" | "Rejected";

export interface VerificationRequestItem {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: UserRole; 
  listingId?: string; 
  listingTitle?: string; 
  triggeringUserId?: string; // User who initiated the action that led to verification request
  reason: string; 
  status: VerificationQueueStatus; // New
  documentsSubmitted?: { name: string, type: 'id_proof' | 'business_reg' | 'financials' }[]; // Placeholder
}

export interface ReadyToEngageItem {
  id: string;
  timestamp: Date;
  buyerId: string;
  buyerName: string;
  buyerVerificationStatus: VerificationStatus; // New
  sellerId: string;
  sellerName: string;
  sellerVerificationStatus: VerificationStatus; // New
  listingId: string;
  listingTitle: string;
  listingVerificationStatus: ListingStatus; // New (or derived)
}

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
