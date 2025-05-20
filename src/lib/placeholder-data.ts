
import type { Listing, User, AdminDashboardMetrics, VerificationRequestItem, ReadyToEngageItem } from './types';

export const sampleUsers: User[] = [
  {
    id: 'user1',
    fullName: 'John Doe (Seller)',
    email: 'john.seller@example.com',
    phoneNumber: '+6591234567',
    country: 'Singapore',
    role: 'seller',
    isEmailVerified: true,
    verificationStatus: 'verified',
    isPaid: true, // New field
    initialCompanyName: 'JD Web Solutions',
    createdAt: new Date('2023-01-10T09:00:00Z'),
    updatedAt: new Date('2023-01-15T14:30:00Z'),
  },
  {
    id: 'user2',
    fullName: 'Jane Smith (Buyer)',
    email: 'jane.buyer@example.com',
    phoneNumber: '+60123456789',
    country: 'Malaysia',
    role: 'buyer',
    isEmailVerified: true,
    verificationStatus: 'verified',
    isPaid: true, // New field
    buyerType: 'Individual Investor',
    createdAt: new Date('2023-02-05T11:00:00Z'),
    updatedAt: new Date('2023-02-05T11:00:00Z'),
  },
  {
    id: 'user3',
    fullName: 'Alex Tan (Seller - Anonymous)',
    email: 'alex.seller.anon@example.com',
    phoneNumber: '+84987654321',
    country: 'Vietnam',
    role: 'seller',
    isEmailVerified: true,
    verificationStatus: 'anonymous',
    isPaid: false, // New field
    createdAt: new Date('2023-03-20T16:00:00Z'),
    updatedAt: new Date('2023-03-20T16:00:00Z'),
  },
   {
    id: 'user4',
    fullName: 'Sarah Chen (Buyer - Pending)',
    email: 'sarah.buyer.pending@example.com',
    phoneNumber: '+1234567890',
    country: 'Thailand',
    role: 'buyer',
    isEmailVerified: true,
    verificationStatus: 'pending_verification',
    isPaid: false, // New field
    buyerType: 'Investment Firm',
    createdAt: new Date('2023-04-10T10:00:00Z'),
    updatedAt: new Date('2023-04-10T10:00:00Z'),
  },
  {
    id: 'user5',
    fullName: 'Michael Lee (Buyer - Free)',
    email: 'michael.freebuyer@example.com',
    phoneNumber: '+6281234567890',
    country: 'Indonesia',
    role: 'buyer',
    isEmailVerified: true,
    verificationStatus: 'verified', // Can be verified but free
    isPaid: false,
    buyerType: 'Strategic Acquirer',
    createdAt: new Date('2023-05-01T11:00:00Z'),
    updatedAt: new Date('2023-05-01T11:00:00Z'),
  },
];

export const sampleListings: Listing[] = [
  {
    id: '1',
    sellerId: 'user1',
    listingTitleAnonymous: 'Profitable E-commerce Store in SEA',
    industry: 'E-commerce',
    locationCountry: 'Singapore',
    locationCityRegionGeneral: 'Nationwide',
    anonymousBusinessDescription: 'Thriving online retail business with a strong brand presence and loyal customer base. Specializes in eco-friendly products. Consistent growth year-over-year. Huge potential for expansion into new markets and product lines.',
    keyStrengthsAnonymous: ['Strong Brand Recognition', 'High Customer Retention', 'Scalable Operations'],
    annualRevenueRange: '$500K - $1M USD',
    netProfitMarginRange: '20% - 30%',
    askingPriceRange: '$1M - $2.5M USD',
    dealStructureLookingFor: ['Full Acquisition'],
    reasonForSellingAnonymous: 'Owner retiring.',
    status: 'active',
    isSellerVerified: true,
    actualCompanyName: 'GreenEarth Goods Pte. Ltd.',
    fullBusinessAddress: '123 Orchard Road, Singapore',
    specificAnnualRevenueLastYear: 750000,
    specificNetProfitLastYear: 180000,
    createdAt: new Date('2023-10-15T10:00:00Z'),
    updatedAt: new Date('2023-10-15T10:00:00Z'),
    imageUrl: 'https://placehold.co/600x400.png',
    potentialForGrowthNarrative: 'Significant growth potential by expanding product catalog to adjacent niches and targeting new customer segments in neighboring ASEAN countries. Current marketing efforts are minimal, offering substantial upside with a dedicated marketing strategy.',
    financialSnapshotUrl: '/documents/placeholder-financials.pdf',
    ownershipDetailsUrl: '/documents/placeholder-ownership.pdf',
    locationRealEstateInfoUrl: '/documents/placeholder-lease.pdf',
    webPresenceInfoUrl: '/documents/placeholder-web-analytics.pdf',
  },
  {
    id: '2',
    sellerId: 'user3',
    listingTitleAnonymous: 'Established SaaS Platform - B2B Niche',
    industry: 'Software',
    locationCountry: 'Vietnam',
    locationCityRegionGeneral: 'Ho Chi Minh City Area',
    anonymousBusinessDescription: 'Innovative SaaS solution catering to a specific B2B vertical. Growing subscriber base with high MRR. Lean operations, ready for scaling with marketing investment. Solid tech stack.',
    keyStrengthsAnonymous: ['Unique Market Position', 'Recurring Revenue Model', 'High Growth Potential'],
    annualRevenueRange: '$100K - $250K USD',
    askingPriceRange: '$250K - $500K USD',
    dealStructureLookingFor: ['Full Acquisition', 'Partial Sale/Investment'],
    status: 'active',
    isSellerVerified: false,
    createdAt: new Date('2023-11-01T14:30:00Z'),
    updatedAt: new Date('2023-11-01T14:30:00Z'),
    imageUrl: 'https://placehold.co/600x400.png',
    potentialForGrowthNarrative: 'The platform is poised for rapid expansion with further development of enterprise features and targeted sales efforts in the APAC region. Untapped potential in complementary service integrations.',
    // No document URLs as seller is not verified / details not filled
  },
  {
    id: '3',
    sellerId: 'user1', // Also by John Doe (Paid Seller)
    listingTitleAnonymous: 'Boutique Marketing Agency',
    industry: 'Services - Marketing',
    locationCountry: 'Malaysia',
    locationCityRegionGeneral: 'Kuala Lumpur',
    anonymousBusinessDescription: 'Creative marketing agency with a portfolio of SME clients. Specializes in digital marketing and content creation. Strong local reputation. Team of 5 experienced professionals.',
    keyStrengthsAnonymous: ['Strong Client Relationships', 'Creative Team', 'Diverse Service Offering'],
    annualRevenueRange: '$250K - $500K USD',
    netProfitMarginRange: '10% - 20%',
    askingPriceRange: '$500K - $1M USD',
    status: 'active',
    isSellerVerified: true,
    actualCompanyName: 'Creative Spark Solutions Sdn. Bhd.',
    createdAt: new Date('2023-09-20T08:00:00Z'),
    updatedAt: new Date('2023-09-20T08:00:00Z'),
    imageUrl: 'https://placehold.co/600x400.png',
    potentialForGrowthNarrative: 'Opportunity to scale by expanding service offerings to larger corporate clients and developing proprietary marketing tools. Strong referral network provides a solid base for growth.',
    financialSnapshotUrl: '/documents/placeholder-agency-financials.pdf',
    webPresenceInfoUrl: 'https://example-agency.com',
  },
];

export const sampleAdminDashboardMetrics: AdminDashboardMetrics = {
  newUserRegistrations24h: 5,
  newUserRegistrations7d: 23,
  newListingsCreated24h: 2,
  newListingsCreated7d: 10,
  totalActiveSellers: 58, // All sellers, paid or free
  totalActiveBuyers: 120,  // All buyers, paid or free
  totalActiveListingsAnonymous: 35, // Listings from non-verified sellers or not yet fully public
  totalActiveListingsVerified: 15, // Listings from verified sellers with full details potentially available
  
  // New/Updated queue counts
  buyerVerificationQueueCount: 3, // Example
  sellerVerificationQueueCount: 4, // Example
  readyToEngageQueueCount: 3,

  // New analytics metrics
  paidBuyersCount: 40,
  freeBuyersCount: 80,
  paidSellersCount: 25,
  freeSellersCount: 33,
  totalRevenue: 12500, // Example amount in USD
  successfulConnectionsCount: 12, // from existing "Successful Connections (Est.)"
  closedDealsCount: 4,
};

export const sampleVerificationRequests: VerificationRequestItem[] = [
  {
    id: 'vr1',
    timestamp: new Date('2023-11-10T10:00:00Z'),
    userId: 'user4', // Sarah Chen (Buyer - Pending)
    userName: 'Sarah Chen (Buyer - Pending)',
    userRole: 'buyer',
    reason: 'New buyer registration, requires profile verification.',
  },
  {
    id: 'vr2',
    timestamp: new Date('2023-11-09T15:30:00Z'),
    userId: 'user3', // Alex Tan (Seller - Anonymous)
    userName: 'Alex Tan (Seller - Anonymous)',
    userRole: 'seller',
    listingId: '2',
    listingTitle: 'Established SaaS Platform - B2B Niche',
    reason: 'Seller submitted new listing, requires seller and listing verification.',
  },
  {
    id: 'vr3',
    timestamp: new Date('2023-11-11T11:00:00Z'),
    userId: 'user5', // Michael Lee (Buyer - Free, but wants to verify for some reason)
    userName: 'Michael Lee (Buyer - Free)',
    userRole: 'buyer',
    reason: 'Buyer requested manual verification upgrade.',
  },
   {
    id: 'vr4',
    timestamp: new Date('2023-11-12T09:00:00Z'),
    userId: 'newSellerUser123', 
    userName: 'Pending Seller Alpha',
    userRole: 'seller',
    reason: 'New seller account created.',
  },
];

export const sampleReadyToEngageItems: ReadyToEngageItem[] = [
  {
    id: 'rte1',
    timestamp: new Date('2023-11-08T12:00:00Z'),
    buyerId: 'user2', // Jane Smith
    buyerName: 'Jane Smith (Buyer)',
    sellerId: 'user1', // John Doe
    sellerName: 'John Doe (Seller)',
    listingId: '1',
    listingTitle: 'Profitable E-commerce Store in SEA',
  },
];

