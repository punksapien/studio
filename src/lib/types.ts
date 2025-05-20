
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
  isPaid: boolean; 
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
  actualCompanyName?: string;
  fullBusinessAddress?: string;
  specificAnnualRevenueLastYear?: number;
  specificNetProfitLastYear?: number;
  secureDataRoomLink?: string;
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string; 
  potentialForGrowthNarrative?: string;
  financialSnapshotUrl?: string; 
  ownershipDetailsUrl?: string;
  locationRealEstateInfoUrl?: string;
  webPresenceInfoUrl?: string; 
  // New field to track inquiries for Seller Dashboard Overview
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
  sellerStatus?: 'Anonymous Seller' | 'Platform Verified Seller'; // For buyer's view
  buyerId: string;
  buyerName?: string; // For seller's view
  buyerVerificationStatus?: VerificationStatus; // For seller's view
  sellerId: string;
  inquiryTimestamp: Date;
  engagementTimestamp?: Date;
  status: InquiryStatusSystem; 
  statusBuyerPerspective?: InquiryStatusBuyerPerspective; 
  statusSellerPerspective?: InquiryStatusSellerPerspective; // New for seller
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
  buyerVerificationQueueCount: number;
  sellerVerificationQueueCount: number;
  readyToEngageQueueCount: number;
  paidBuyersCount: number;
  freeBuyersCount: number;
  paidSellersCount: number;
  freeSellersCount: number;
  totalRevenue: number; 
  successfulConnectionsCount: number;
  closedDealsCount: number;
}

export interface VerificationRequestItem {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: UserRole; 
  listingId?: string; 
  listingTitle?: string; 
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

export type NotificationType = 'inquiry' | 'verification' | 'system' | 'engagement';

export interface NotificationItem {
  id: string;
  timestamp: Date;
  message: string;
  link?: string;
  isRead: boolean;
  userId: string;
  type: NotificationType; // Added for better categorization
}
