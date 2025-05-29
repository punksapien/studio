# nobridge - firebase backend implementation plan

## stack migration & architecture

replacing cloudflare with firebase ecosystem:

- **cloudflare workers** → **firebase cloud functions** (node.js/typescript)
- **cloudflare d1** → **firestore** (nosql document db) 
- **cloudflare r2** → **firebase storage** (gcs bucket)
- **next.js api routes** → **firebase callable functions** (better dx, built-in auth)

## optimizations made

1. **firestore data modeling** - denormalized for reads, batch writes for consistency
2. **security rules** - client-side filtering instead of server-side auth checks where possible  
3. **cloud functions** - callable functions > http endpoints (less boilerplate)
4. **real-time messaging** - firestore real-time listeners (way simpler than workers + websockets)
5. **file uploads** - direct client → storage with signed urls (skip server proxy)

---

## i. authentication flow

### firebase auth setup
- **email/password provider** enabled
- **custom claims** for roles (`seller`, `buyer`, `admin`)
- **email verification** required before profile completion

### a. user registration flow

**seller registration:**
```typescript
// callable function: registerSeller
export const registerSeller = functions.https.onCall(async (data, context) => {
  const { email, password, fullName, phoneNumber, country, initialCompanyName } = data;
  
  // 1. create firebase auth user
  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: fullName,
    emailVerified: false
  });
  
  // 2. create firestore profile (incomplete until email verified)
  await admin.firestore().collection('users').doc(userRecord.uid).set({
    email,
    fullName,
    phoneNumber,
    country,
    initialCompanyName,
    role: 'seller',
    verificationStatus: 'anonymous',
    emailVerified: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // 3. send email verification (firebase handles otp)
  await admin.auth().generateEmailVerificationLink(email);
  
  return { success: true, uid: userRecord.uid };
});
```

**buyer registration:** similar but with persona fields in firestore doc

### b. email verification
firebase auth handles this automatically. on verification:
```typescript
// cloud function trigger: onEmailVerified
export const onEmailVerified = functions.auth.user().onCreate(async (user) => {
  if (user.emailVerified) {
    // update firestore profile
    await admin.firestore().collection('users').doc(user.uid).update({
      emailVerified: true,
      emailVerifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // set custom claims for role
    const userDoc = await admin.firestore().collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    await admin.auth().setCustomUserClaims(user.uid, { role: userData.role });
  }
});
```

### c. login flow
firebase auth handles this client-side. no server otp needed - just email/password → jwt token with custom claims.

### d. password reset
firebase auth's built-in password reset flow. no custom otp logic needed.

---

## ii. firestore data model

### users collection
```typescript
interface User {
  uid: string; // document id
  email: string;
  fullName: string;
  phoneNumber?: string;
  country: string;
  role: 'buyer' | 'seller' | 'admin';
  verificationStatus: 'anonymous' | 'pending_verification' | 'verified';
  emailVerified: boolean;
  emailVerifiedAt?: Timestamp;
  lastLogin?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // buyer-specific fields
  buyerPersona?: {
    interestedIndustries: string[];
    budgetRange: string;
    timeFrameToAcquire: string;
    experienceLevel: string;
    primaryMotivation: string;
  };
  
  // seller-specific fields  
  initialCompanyName?: string;
}
```

### listings collection
```typescript
interface Listing {
  id: string; // document id
  sellerId: string;
  sellerName: string; // denormalized for queries
  isSellerVerified: boolean; // denormalized
  
  // basic info
  listingTitleAnonymous: string;
  anonymousBusinessDescription: string;
  industry: string;
  country: string;
  
  // financials
  monthlyRevenue: number;
  monthlyNetProfit: number;
  askingPrice: number;
  adjustedCashFlow?: number;
  adjustedCashFlowExplanation?: string;
  
  // details
  businessAge: number;
  businessModel: string;
  specificGrowthOpportunities: string;
  dealStructureLookingFor: string[];
  
  // media
  imageUrls: string[]; // max 5
  
  // metadata
  status: 'active' | 'inactive' | 'pending_verification' | 'verified' | 'closed';
  inquiryCount: number; // denormalized counter
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### inquiries collection
```typescript
interface Inquiry {
  id: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
  buyerName: string; // denormalized
  
  message: string;
  status: 'new' | 'seller_engaged' | 'ready_for_connection' | 'chat_opened';
  
  conversationId?: string; // set when chat created
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  engagedAt?: Timestamp;
}
```

### conversations collection
```typescript
interface Conversation {
  id: string;
  inquiryId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  
  // participants info (denormalized)
  buyerName: string;
  sellerName: string;
  listingTitle: string;
  
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Timestamp;
  };
  
  unreadCounts: {
    buyer: number;
    seller: number;
  };
  
  status: 'active' | 'archived';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### messages subcollection
```typescript
// path: conversations/{conversationId}/messages/{messageId}
interface Message {
  id: string;
  senderId: string;
  senderName: string; // denormalized
  text: string;
  timestamp: Timestamp;
  readBy: string[]; // array of user ids who read this
}
```

---

## iii. business listing management

### a. create listing
```typescript
export const createListing = functions.https.onCall(async (data, context) => {
  // auth check via context.auth (firebase handles jwt validation)
  if (!context.auth || context.auth.token.role !== 'seller') {
    throw new functions.https.HttpsError('permission-denied', 'seller role required');
  }
  
  const sellerId = context.auth.uid;
  
  // get seller info for denormalization
  const sellerDoc = await admin.firestore().collection('users').doc(sellerId).get();
  const seller = sellerDoc.data();
  
  const listingData = {
    ...data,
    sellerId,
    sellerName: seller.fullName,
    isSellerVerified: seller.verificationStatus === 'verified',
    status: 'active',
    inquiryCount: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  const docRef = await admin.firestore().collection('listings').add(listingData);
  
  return { success: true, listingId: docRef.id };
});
```

### b. firestore security rules for listings
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // public read for active listings
    match /listings/{listingId} {
      allow read: if resource.data.status in ['active', 'verified'];
      allow write: if request.auth != null 
        && request.auth.token.role == 'seller'
        && request.auth.uid == resource.data.sellerId;
    }
    
    // users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## iv. marketplace & search

### a. listings query (client-side with firestore)
```typescript
// client-side code (no cloud function needed)
const getListings = async (filters: ListingFilters) => {
  let query = db.collection('listings')
    .where('status', 'in', ['active', 'verified'])
    .orderBy('createdAt', 'desc');
  
  // apply filters
  if (filters.industry) {
    query = query.where('industry', '==', filters.industry);
  }
  
  if (filters.country) {
    query = query.where('country', '==', filters.country);
  }
  
  if (filters.minPrice) {
    query = query.where('askingPrice', '>=', filters.minPrice);
  }
  
  // pagination
  if (filters.lastDoc) {
    query = query.startAfter(filters.lastDoc);
  }
  
  const snapshot = await query.limit(20).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

**note:** firestore doesn't support full-text search well. for keyword search, either:
1. use algolia/elasticsearch integration
2. implement client-side filtering on fetched results  
3. use firestore's array-contains for tag-based search

### b. single listing details
client reads directly from firestore. security rules handle access control.

---

## v. inquiry & messaging system

### a. create inquiry
```typescript
export const createInquiry = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'buyer') {
    throw new functions.https.HttpsError('permission-denied', 'buyer role required');
  }
  
  const { listingId, message } = data;
  const buyerId = context.auth.uid;
  
  // get listing info
  const listingDoc = await admin.firestore().collection('listings').doc(listingId).get();
  const listing = listingDoc.data();
  
  // get buyer info
  const buyerDoc = await admin.firestore().collection('users').doc(buyerId).get();
  const buyer = buyerDoc.data();
  
  // batch write for atomicity
  const batch = admin.firestore().batch();
  
  // create inquiry
  const inquiryRef = admin.firestore().collection('inquiries').doc();
  batch.set(inquiryRef, {
    listingId,
    sellerId: listing.sellerId,
    buyerId,
    buyerName: buyer.fullName,
    message,
    status: 'new',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // increment inquiry count on listing
  const listingRef = admin.firestore().collection('listings').doc(listingId);
  batch.update(listingRef, {
    inquiryCount: admin.firestore.FieldValue.increment(1)
  });
  
  await batch.commit();
  
  // trigger notification (separate function)
  await sendNotification(listing.sellerId, 'new_inquiry', {
    buyerName: buyer.fullName,
    listingTitle: listing.listingTitleAnonymous
  });
  
  return { success: true, inquiryId: inquiryRef.id };
});
```

### b. seller engages with inquiry
```typescript
export const engageWithInquiry = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'seller') {
    throw new functions.https.HttpsError('permission-denied', 'seller role required');
  }
  
  const { inquiryId } = data;
  const sellerId = context.auth.uid;
  
  // get inquiry and verify ownership
  const inquiryDoc = await admin.firestore().collection('inquiries').doc(inquiryId).get();
  const inquiry = inquiryDoc.data();
  
  if (inquiry.sellerId !== sellerId) {
    throw new functions.https.HttpsError('permission-denied', 'not your inquiry');
  }
  
  // check verification statuses to determine next status
  const [buyerDoc, sellerDoc] = await Promise.all([
    admin.firestore().collection('users').doc(inquiry.buyerId).get(),
    admin.firestore().collection('users').doc(sellerId).get()
  ]);
  
  const buyer = buyerDoc.data();
  const seller = sellerDoc.data();
  
  let nextStatus: string;
  if (buyer.verificationStatus !== 'verified') {
    nextStatus = 'buyer_pending_verification';
  } else if (seller.verificationStatus !== 'verified') {
    nextStatus = 'seller_pending_verification';  
  } else {
    nextStatus = 'ready_for_connection';
  }
  
  await admin.firestore().collection('inquiries').doc(inquiryId).update({
    status: nextStatus,
    engagedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { success: true, nextStatus };
});
```

### c. admin facilitates connection
```typescript
export const facilitateConnection = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'admin role required');
  }
  
  const { inquiryId } = data;
  
  const inquiryDoc = await admin.firestore().collection('inquiries').doc(inquiryId).get();
  const inquiry = inquiryDoc.data();
  
  if (inquiry.status !== 'ready_for_connection') {
    throw new functions.https.HttpsError('failed-precondition', 'inquiry not ready');
  }
  
  // get additional data for denormalization
  const [buyerDoc, sellerDoc, listingDoc] = await Promise.all([
    admin.firestore().collection('users').doc(inquiry.buyerId).get(),
    admin.firestore().collection('users').doc(inquiry.sellerId).get(),
    admin.firestore().collection('listings').doc(inquiry.listingId).get()
  ]);
  
  const buyer = buyerDoc.data();
  const seller = sellerDoc.data();  
  const listing = listingDoc.data();
  
  // create conversation
  const conversationRef = admin.firestore().collection('conversations').doc();
  const conversationData = {
    inquiryId,
    listingId: inquiry.listingId,
    buyerId: inquiry.buyerId,
    sellerId: inquiry.sellerId,
    buyerName: buyer.fullName,
    sellerName: seller.fullName,
    listingTitle: listing.listingTitleAnonymous,
    unreadCounts: { buyer: 0, seller: 0 },
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  // batch write
  const batch = admin.firestore().batch();
  batch.set(conversationRef, conversationData);
  batch.update(admin.firestore().collection('inquiries').doc(inquiryId), {
    status: 'chat_opened',
    conversationId: conversationRef.id
  });
  
  await batch.commit();
  
  return { success: true, conversationId: conversationRef.id };
});
```

---

## vi. real-time messaging

### a. send message (optimistic ui)
```typescript
export const sendMessage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'auth required');
  }
  
  const { conversationId, text } = data;
  const senderId = context.auth.uid;
  
  // verify user is participant
  const convDoc = await admin.firestore().collection('conversations').doc(conversationId).get();
  const conversation = convDoc.data();
  
  if (![conversation.buyerId, conversation.sellerId].includes(senderId)) {
    throw new functions.https.HttpsError('permission-denied', 'not a participant');
  }
  
  const senderDoc = await admin.firestore().collection('users').doc(senderId).get();
  const sender = senderDoc.data();
  
  const receiverId = senderId === conversation.buyerId ? conversation.sellerId : conversation.buyerId;
  const receiverField = senderId === conversation.buyerId ? 'seller' : 'buyer';
  
  // batch write for atomicity
  const batch = admin.firestore().batch();
  
  // add message to subcollection
  const messageRef = admin.firestore()
    .collection('conversations').doc(conversationId)
    .collection('messages').doc();
  
  batch.set(messageRef, {
    senderId,
    senderName: sender.fullName,
    text,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    readBy: [senderId] // sender has read their own message
  });
  
  // update conversation metadata
  const conversationRef = admin.firestore().collection('conversations').doc(conversationId);
  batch.update(conversationRef, {
    lastMessage: {
      text: text.substring(0, 100), // truncate for preview
      senderId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    },
    [`unreadCounts.${receiverField}`]: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  await batch.commit();
  
  return { success: true, messageId: messageRef.id };
});
```

### b. real-time listeners (client-side)
```typescript
// client-side real-time message listener
const listenToMessages = (conversationId: string, callback: (messages: Message[]) => void) => {
  return db.collection('conversations')
    .doc(conversationId)
    .collection('messages')
    .orderBy('timestamp', 'asc')
    .onSnapshot(snapshot => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    });
};

// mark messages as read
const markMessagesAsRead = async (conversationId: string, userId: string) => {
  const messagesQuery = db.collection('conversations')
    .doc(conversationId)
    .collection('messages')
    .where('readBy', 'not-in', [userId]);
  
  const snapshot = await messagesQuery.get();
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      readBy: admin.firestore.FieldValue.arrayUnion(userId)
    });
  });
  
  // reset unread count
  const userField = userId === conversation.buyerId ? 'buyer' : 'seller';
  batch.update(db.collection('conversations').doc(conversationId), {
    [`unreadCounts.${userField}`]: 0
  });
  
  await batch.commit();
};
```

---

## vii. file uploads (direct client → storage)

### a. get signed upload url
```typescript
export const getUploadUrl = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'auth required');
  }
  
  const { fileName, fileType, uploadType } = data; // uploadType: 'listing-image' | 'document'
  const userId = context.auth.uid;
  
  // validate file type
  const allowedTypes = uploadType === 'listing-image' 
    ? ['image/jpeg', 'image/png', 'image/webp']
    : ['application/pdf', 'application/msword'];
  
  if (!allowedTypes.includes(fileType)) {
    throw new functions.https.HttpsError('invalid-argument', 'invalid file type');
  }
  
  const bucket = admin.storage().bucket();
  const filePath = `${uploadType}s/${userId}/${Date.now()}_${fileName}`;
  const file = bucket.file(filePath);
  
  // generate signed url for upload (expires in 15 mins)
  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000,
    contentType: fileType,
  });
  
  return { 
    uploadUrl: signedUrl, 
    filePath,
    publicUrl: `https://storage.googleapis.com/${bucket.name}/${filePath}`
  };
});
```

### b. client-side upload
```typescript
// client uploads directly to storage, then saves url to firestore
const uploadFile = async (file: File, uploadType: string) => {
  // 1. get signed url
  const { data } = await functions.httpsCallable('getUploadUrl')({
    fileName: file.name,
    fileType: file.type,
    uploadType
  });
  
  // 2. upload directly to storage
  await fetch(data.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type }
  });
  
  // 3. return public url for firestore
  return data.publicUrl;
};
```

---

## viii. optimizations & considerations

### a. cost optimization
- **minimize cloud function calls** - use client-side firestore queries where possible
- **batch writes** - atomic operations, fewer function invocations  
- **denormalization** - avoid joins, faster reads at cost of storage
- **firestore caching** - client-side caching reduces reads

### b. performance
- **composite indexes** - for complex queries (industry + country + price range)
- **pagination** - use firestore cursors, not offset/limit
- **real-time listeners** - more efficient than polling apis

### c. security
- **security rules** - client access control, reduces server load
- **custom claims** - role-based auth without db lookups
- **signed urls** - direct file uploads, no proxy through functions

### d. scaling considerations
- **firestore limits** - 1mb doc size, 1 write/sec per doc (use subcollections for high-write scenarios)
- **cloud functions** - 9min timeout, consider cloud run for long processes
- **storage** - unlimited but watch bandwidth costs

### e. monitoring & debugging
- **firebase crashlytics** - client error tracking
- **cloud functions logs** - structured logging with winston
- **firestore usage dashboard** - monitor read/write patterns

---

## ix. deployment & ci/cd

```json
// firebase.json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

**deployment:**
```bash
# install firebase cli
npm install -g firebase-tools

# deploy functions
firebase deploy --only functions

# deploy security rules  
firebase deploy --only firestore:rules,storage

# deploy everything
firebase deploy
```

afaict this firebase approach is way cleaner than the cloudflare setup. less moving parts, better real-time capabilities, and the auth flow is built-in instead of rolling your own otp system. plus the client-side firestore queries with security rules paradigm scales better than going through cloud functions for everything.

lmk if you want me to elaborate on any specific part or if there are other optimizations you're thinking about.