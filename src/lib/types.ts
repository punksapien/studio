
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
// Asking price ranges can reuse revenueRanges or have their own set
export const askingPriceRanges = revenueRanges; 

export const industries = ["Software", "Retail", "Manufacturing", "Services - Marketing", "E-commerce", "Healthcare", "Finance", "Education", "Real Estate", "Other"];
export const asianCountries = ["Singapore", "Malaysia", "Indonesia", "Thailand", "Vietnam", "Philippines", "Hong Kong", "Japan", "South Korea", "India", "China", "Other"];


export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  country: string;
  role: UserRole;
  isEmailVerified: boolean;
  verificationStatus: VerificationStatus;
  isPaid: boolean; // New field
  // Seller specific
  initialCompanyName?: string;
  // Buyer specific
  buyerType?: BuyerType;
  createdAt: Date;
  updatedAt: Date;
}

export interface Listing {
  id: string;
  sellerId: string;
  listingTitleAnonymous: string;
  industry: string; 
  locationCountry: string;
  locationCityRegionGeneral: string;
  anonymousBusinessDescription: string;
  keyStrengthsAnonymous: string[];
  annualRevenueRange: string; 
  netProfitMarginRange?: string;
  askingPriceRange: string; 
  dealStructureLookingFor?: DealStructure[];
  reasonForSellingAnonymous?: string;
  status: 'active' | 'inactive' | 'pending_verification';
  isSellerVerified: boolean; 
  // Fields visible to Verified Buyers if Seller is Verified
  actualCompanyName?: string;
  fullBusinessAddress?: string;
  specificAnnualRevenueLastYear?: number;
  specificNetProfitLastYear?: number;
  secureDataRoomLink?: string;
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string; // For placeholder or actual image
  
  // New fields for listing page enhancements
  potentialForGrowthNarrative?: string;
  financialSnapshotUrl?: string; 
  ownershipDetailsUrl?: string;
  locationRealEstateInfoUrl?: string;
  webPresenceInfoUrl?: string; 
}

export type InquiryStatusBuyerPerspective =
  | 'Inquiry Sent' // Buyer has inquired, seller not yet engaged
  | 'Seller Engaged - Your Verification Required' // Buyer is anonymous, seller engaged
  | 'Seller Engaged - Seller Verification Pending' // Seller is anonymous, buyer engaged (and presumably verified or willing to be)
  | 'Ready for Admin Connection' // Both verified and engaged
  | 'Connection Facilitated by Admin'
  | 'Archived';

// Keeping original InquiryStatus for potential admin/seller views, or if system uses it internally
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
  listingTitleAnonymous: string; // Added for easier display on buyer's dashboard
  sellerStatus: 'Anonymous Seller' | 'Platform Verified Seller'; // Added for buyer's view
  buyerId: string;
  sellerId: string;
  inquiryTimestamp: Date;
  engagementTimestamp?: Date;
  status: InquiryStatusSystem; // System's internal status
  statusBuyerPerspective: InquiryStatusBuyerPerspective; // Status as seen by the buyer
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminDashboardMetrics {
  newUserRegistrations24h: number;
  newUserRegistrations7d: number;
  newListingsCreated24h: number;
  newListingsCreated7d: number;
  totalActiveSellers: number;
  totalActiveBuyers: number;
  totalActiveListingsAnonymous: number;
  totalActiveListingsVerified: number;
  
  // Updated/New verification queue counts
  buyerVerificationQueueCount: number;
  sellerVerificationQueueCount: number;
  readyToEngageQueueCount: number;

  // New analytics metrics
  paidBuyersCount: number;
  freeBuyersCount: number;
  paidSellersCount: number;
  freeSellersCount: number;
  totalRevenue: number; // Represented as a number, formatting handled in UI
  successfulConnectionsCount: number;
  closedDealsCount: number;
}

export interface VerificationRequestItem {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: UserRole; // 'buyer' or 'seller'
  listingId?: string; // Only relevant for seller verification related to a listing
  listingTitle?: string; // Only relevant for seller verification
  triggeringUserId?: string;
  reason: string; 
}

export interface ReadyToEngageItem {
  id: string;
  timestamp: Date;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  listingId: string;
  listingTitle: string;
}

export interface NotificationItem {
  id: string;
  timestamp: Date;
  message: string;
  link?: string;
  isRead: boolean;
  userId: string; // To associate notification with a user
}
