# API Design: RESTful Endpoints for Nobridge

## API Overview

This document defines the REST API endpoints that will connect the existing Next.js frontend to the Supabase backend. All endpoints follow RESTful conventions and return JSON responses.

## Base URL & Authentication

```
Base URL: https://your-app.vercel.app/api
Authentication: Bearer JWT token in Authorization header
```

## Authentication Endpoints

### POST /api/auth/register/buyer
**Register a new buyer account**
```typescript
// Request Body
{
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  country: string;
  buyerPersonaType: BuyerPersona;
  buyerPersonaOther?: string;
  investmentFocusDescription?: string;
  preferredInvestmentSize?: PreferredInvestmentSize;
  keyIndustriesOfInterest?: string;
}

// Response (201 Created)
{
  success: true;
  message: "Registration successful. Please check your email for verification.";
  email: string;
}
```

### POST /api/auth/register/seller
**Register a new seller account**
```typescript
// Request Body
{
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  country: string;
  initialCompanyName?: string;
}

// Response (201 Created)
{
  success: true;
  message: "Registration successful. Please check your email for verification.";
  email: string;
}
```

### POST /api/auth/login
**Initiate login process**
```typescript
// Request Body
{
  email: string;
  password: string;
}

// Response (200 OK)
{
  success: true;
  message: "Credentials verified. Please check your email for OTP.";
  email: string;
}
```

### POST /api/auth/verify-otp
**Verify OTP and complete authentication**
```typescript
// Request Body
{
  email: string;
  otp: string;
  type: 'registration' | 'login' | 'password_reset';
}

// Response (200 OK)
{
  success: true;
  message: string;
  token?: string; // For login type
  user?: User; // For login type
}
```

### POST /api/auth/logout
**Logout user**
```typescript
// Response (200 OK)
{
  success: true;
  message: "Logged out successfully";
}
```

### POST /api/auth/forgot-password
**Request password reset**
```typescript
// Request Body
{
  email: string;
}

// Response (200 OK)
{
  success: true;
  message: "If email exists, reset instructions have been sent.";
}
```

### POST /api/auth/reset-password
**Complete password reset**
```typescript
// Request Body
{
  email: string;
  otp: string;
  newPassword: string;
}

// Response (200 OK)
{
  success: true;
  message: "Password reset successfully";
}
```

## User Management Endpoints

### GET /api/users/profile
**Get current user profile**
```typescript
// Response (200 OK)
{
  success: true;
  user: User;
}
```

### PUT /api/users/profile
**Update user profile**
```typescript
// Request Body (partial User object)
{
  fullName?: string;
  phoneNumber?: string;
  country?: string;
  // ... other updateable fields
}

// Response (200 OK)
{
  success: true;
  user: User;
}
```

### POST /api/users/change-password
**Change user password**
```typescript
// Request Body
{
  currentPassword: string;
  newPassword: string;
}

// Response (200 OK)
{
  success: true;
  message: "Password changed successfully";
}
```

## Listing Endpoints

### GET /api/listings
**Get listings with filtering and pagination**
```typescript
// Query Parameters
{
  page?: number; // Default: 1
  limit?: number; // Default: 12
  industry?: string;
  country?: string;
  revenueRange?: string;
  minAskingPrice?: number;
  maxAskingPrice?: number;
  keywords?: string[]; // Array of keywords
  sortBy?: 'created_at' | 'asking_price' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  search?: string; // Full-text search
}

// Response (200 OK)
{
  success: true;
  data: {
    listings: Listing[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    filters: {
      appliedFilters: object;
      availableFilters: {
        industries: string[];
        countries: string[];
        revenueRanges: string[];
      };
    };
  };
}
```

### GET /api/listings/[listingId]
**Get single listing details**
```typescript
// Response (200 OK)
{
  success: true;
  listing: Listing; // With conditional verified info based on user permissions
  seller: {
    verificationStatus: VerificationStatus;
    // Other safe seller info
  };
}
```

### POST /api/listings
**Create new listing (Sellers only)**
```typescript
// Request Body
{
  // All fields from ListingSchema
  listingTitleAnonymous: string;
  industry: string;
  // ... all other listing fields
}

// Response (201 Created)
{
  success: true;
  listing: Listing;
  message: "Listing created successfully";
}
```

### PUT /api/listings/[listingId]
**Update listing (Owner only)**
```typescript
// Request Body (partial listing)
{
  // Any updateable listing fields
}

// Response (200 OK)
{
  success: true;
  listing: Listing;
  message: "Listing updated successfully";
}
```

### PUT /api/listings/[listingId]/status
**Update listing status**
```typescript
// Request Body
{
  status: ListingStatus;
}

// Response (200 OK)
{
  success: true;
  listing: Listing;
}
```

### GET /api/listings/my-listings
**Get current seller's listings**
```typescript
// Response (200 OK)
{
  success: true;
  listings: Listing[];
}
```

## Inquiry Endpoints

### POST /api/inquiries
**Create new inquiry (Buyers only)**
```typescript
// Request Body
{
  listingId: string;
}

// Response (201 Created)
{
  success: true;
  inquiry: Inquiry;
  message: "Inquiry sent successfully";
}
```

### GET /api/inquiries
**Get user's inquiries (filtered by role)**
```typescript
// Response (200 OK)
{
  success: true;
  inquiries: Inquiry[]; // Different perspective based on buyer/seller role
}
```

### POST /api/inquiries/[inquiryId]/engage
**Seller engages with inquiry**
```typescript
// Response (200 OK)
{
  success: true;
  inquiry: Inquiry;
  message: "Engagement recorded. Status updated.";
}
```

## Conversation & Messaging Endpoints

### GET /api/conversations
**Get user's conversations**
```typescript
// Response (200 OK)
{
  success: true;
  conversations: Conversation[];
}
```

### GET /api/conversations/[conversationId]/messages
**Get messages in conversation**
```typescript
// Query Parameters
{
  page?: number;
  limit?: number;
}

// Response (200 OK)
{
  success: true;
  messages: Message[];
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
  };
}
```

### POST /api/conversations/[conversationId]/messages
**Send new message**
```typescript
// Request Body
{
  contentText: string;
  attachmentUrl?: string;
  attachmentType?: string;
}

// Response (201 Created)
{
  success: true;
  message: Message;
}
```

### PUT /api/conversations/[conversationId]/read
**Mark messages as read**
```typescript
// Response (200 OK)
{
  success: true;
  unreadCount: number;
}
```

## Verification Endpoints

### POST /api/verification/request
**Request user/listing verification**
```typescript
// Request Body
{
  type: 'user_verification' | 'listing_verification';
  listingId?: string; // Required for listing verification
  reason?: string;
}

// Response (201 Created)
{
  success: true;
  verificationRequest: VerificationRequestItem;
}
```

### GET /api/verification/status
**Get verification status**
```typescript
// Response (200 OK)
{
  success: true;
  userVerification: {
    status: VerificationStatus;
    requestDate?: Date;
  };
  listingVerifications: {
    [listingId: string]: {
      status: VerificationStatus;
      requestDate?: Date;
    };
  };
}
```

## Admin Endpoints

### GET /api/admin/users
**Get all users (Admin only)**
```typescript
// Query Parameters
{
  page?: number;
  limit?: number;
  role?: UserRole;
  verificationStatus?: VerificationStatus;
  search?: string;
}

// Response (200 OK)
{
  success: true;
  users: User[];
  pagination: PaginationInfo;
}
```

### PUT /api/admin/users/[userId]/verification
**Update user verification status**
```typescript
// Request Body
{
  verificationStatus: VerificationStatus;
  adminNotes?: string;
}

// Response (200 OK)
{
  success: true;
  user: User;
}
```

### GET /api/admin/listings
**Get all listings for admin**
```typescript
// Similar to public listings but includes all statuses and admin fields
```

### GET /api/admin/verification-queue
**Get verification requests**
```typescript
// Query Parameters
{
  type?: 'user_verification' | 'listing_verification';
  status?: VerificationQueueStatus;
}

// Response (200 OK)
{
  success: true;
  requests: VerificationRequestItem[];
}
```

### GET /api/admin/engagement-queue
**Get inquiries ready for admin facilitation**
```typescript
// Response (200 OK)
{
  success: true;
  engagements: Inquiry[]; // Where status = 'ready_for_admin_connection'
}
```

### POST /api/admin/engagements/[inquiryId]/facilitate
**Admin facilitates connection and creates conversation**
```typescript
// Response (200 OK)
{
  success: true;
  conversation: Conversation;
  inquiry: Inquiry; // Updated status
}
```

### GET /api/admin/conversations
**Get all conversations for oversight**
```typescript
// Response (200 OK)
{
  success: true;
  conversations: Conversation[];
}
```

### GET /api/admin/analytics
**Get platform metrics**
```typescript
// Response (200 OK)
{
  success: true;
  metrics: AdminDashboardMetrics;
}
```

## File Upload Endpoints

### POST /api/upload/listing-images
**Upload listing images**
```typescript
// Request Body (multipart/form-data)
{
  files: File[]; // Up to 5 images
  listingId: string;
}

// Response (200 OK)
{
  success: true;
  imageUrls: string[];
}
```

### POST /api/upload/verification-documents
**Upload verification documents**
```typescript
// Request Body (multipart/form-data)
{
  file: File;
  documentType: 'id_proof' | 'business_reg' | 'financials';
  requestId: string;
}

// Response (200 OK)
{
  success: true;
  documentUrl: string;
}
```

## Notification Endpoints

### GET /api/notifications
**Get user notifications**
```typescript
// Query Parameters
{
  unreadOnly?: boolean;
  limit?: number;
}

// Response (200 OK)
{
  success: true;
  notifications: NotificationItem[];
  unreadCount: number;
}
```

### PUT /api/notifications/[notificationId]/read
**Mark notification as read**
```typescript
// Response (200 OK)
{
  success: true;
}
```

### PUT /api/notifications/mark-all-read
**Mark all notifications as read**
```typescript
// Response (200 OK)
{
  success: true;
  markedCount: number;
}
```

## Error Response Format

All endpoints return errors in this format:
```typescript
{
  success: false;
  error: {
    code: string; // e.g., 'VALIDATION_ERROR', 'UNAUTHORIZED'
    message: string; // Human-readable error message
    details?: any; // Additional error context
  };
}
```

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute per IP
- **General API**: 100 requests per minute per authenticated user
- **Upload endpoints**: 10 requests per minute per user
- **Admin endpoints**: 200 requests per minute per admin user

## Realtime Subscriptions (Supabase Realtime)

### Message Updates
```typescript
// Subscribe to new messages in conversations user participates in
supabase
  .channel('messages')
  .on('postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    },
    payload => {
      // Handle new message
    }
  )
  .subscribe()
```

### Inquiry Updates
```typescript
// Subscribe to inquiry status changes
supabase
  .channel('inquiries')
  .on('postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'inquiries',
      filter: `buyer_id=eq.${userId}` // or seller_id
    },
    payload => {
      // Handle inquiry status change
    }
  )
  .subscribe()
```

This API design provides comprehensive coverage of all frontend functionality while maintaining RESTful principles and leveraging Supabase's real-time capabilities for enhanced user experience.
