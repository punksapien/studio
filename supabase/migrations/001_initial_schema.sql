-- Nobridge Database Schema
-- Migration: 001_initial_schema.sql

-- 1. user_profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    country VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK (role IN ('buyer', 'seller', 'admin')),
    password_hash TEXT NOT NULL,
    is_email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    verification_status VARCHAR(30) DEFAULT 'anonymous'
        CHECK (verification_status IN ('anonymous', 'pending_verification', 'verified', 'rejected')),
    is_paid BOOLEAN DEFAULT false,

    -- Seller-specific fields
    initial_company_name VARCHAR(255),

    -- Buyer-specific fields
    buyer_persona_type VARCHAR(100),
    buyer_persona_other TEXT,
    investment_focus_description TEXT,
    preferred_investment_size VARCHAR(100),
    key_industries_of_interest TEXT,

    -- Timestamps and counts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    listing_count INTEGER DEFAULT 0,
    inquiry_count INTEGER DEFAULT 0
);

-- Indexes for user_profiles
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_verification_status ON user_profiles(verification_status);

-- 2. listings table
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    -- Core Anonymous Info
    listing_title_anonymous VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    location_country VARCHAR(100) NOT NULL,
    location_city_region_general VARCHAR(255),
    anonymous_business_description TEXT NOT NULL,
    key_strengths_anonymous JSONB, -- Array of strings
    annual_revenue_range VARCHAR(100),
    net_profit_margin_range VARCHAR(100),
    asking_price DECIMAL(15,2),
    deal_structure_looking_for JSONB, -- Array of strings (multi-select)
    reason_for_selling_anonymous TEXT,

    -- Detailed Info (for verified view)
    business_model TEXT,
    year_established INTEGER,
    registered_business_name VARCHAR(255),
    actual_company_name VARCHAR(255),
    full_business_address TEXT,
    business_website_url VARCHAR(500),
    social_media_links TEXT,
    number_of_employees VARCHAR(50),
    technology_stack TEXT,

    -- Specific Financials
    specific_annual_revenue_last_year DECIMAL(15,2),
    specific_net_profit_last_year DECIMAL(15,2),
    adjusted_cash_flow DECIMAL(15,2),
    adjusted_cash_flow_explanation TEXT,

    -- Detailed Seller & Deal Info
    detailed_reason_for_selling TEXT,
    seller_role_and_time_commitment TEXT,
    post_sale_transition_support TEXT,

    -- Growth
    specific_growth_opportunities TEXT, -- Newline-separated bullet points

    -- Status & Verification
    status VARCHAR(30) DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'pending_verification', 'verified_anonymous', 'verified_public', 'rejected_by_admin', 'closed_deal')),
    is_seller_verified BOOLEAN DEFAULT false,

    -- Media & Documents
    image_urls JSONB, -- Array of image URLs (up to 5)
    financial_documents_url VARCHAR(500),
    key_metrics_report_url VARCHAR(500),
    ownership_documents_url VARCHAR(500),
    financial_snapshot_url VARCHAR(500),
    ownership_details_url VARCHAR(500),
    location_real_estate_info_url VARCHAR(500),
    web_presence_info_url VARCHAR(500),
    secure_data_room_link VARCHAR(500),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    inquiry_count INTEGER DEFAULT 0
);

-- Indexes for listings
CREATE INDEX idx_listings_seller_id ON listings(seller_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_industry ON listings(industry);
CREATE INDEX idx_listings_location_country ON listings(location_country);
CREATE INDEX idx_listings_asking_price ON listings(asking_price);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);

-- Full-text search index for listings
CREATE INDEX idx_listings_search ON listings USING GIN (
    to_tsvector('english',
        listing_title_anonymous || ' ' ||
        anonymous_business_description || ' ' ||
        COALESCE(business_model, '') || ' ' ||
        COALESCE(technology_stack, '')
    )
);

-- 3. conversations table (must be created before inquiries due to foreign key reference)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    -- Conversation metadata
    status VARCHAR(30) DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'ARCHIVED_BY_ADMIN', 'CLOSED_BY_PARTICIPANT')),
    last_message_snippet TEXT,
    buyer_unread_count INTEGER DEFAULT 0,
    seller_unread_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for conversations
CREATE INDEX idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- 4. inquiries table
CREATE TABLE inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    -- Status tracking
    status VARCHAR(50) DEFAULT 'new_inquiry'
        CHECK (status IN (
            'new_inquiry',
            'seller_engaged_buyer_pending_verification',
            'seller_engaged_seller_pending_verification',
            'ready_for_admin_connection',
            'connection_facilitated_in_app_chat_opened',
            'archived'
        )),

    -- Timestamps
    inquiry_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    engagement_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Link to conversation (once admin facilitates)
    conversation_id UUID REFERENCES conversations(id),

    UNIQUE(listing_id, buyer_id) -- One inquiry per buyer per listing
);

-- Add listing_id foreign key to conversations after inquiries table is created
ALTER TABLE conversations ADD COLUMN inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD COLUMN listing_id UUID REFERENCES listings(id) ON DELETE CASCADE;

-- Indexes for inquiries
CREATE INDEX idx_inquiries_listing_id ON inquiries(listing_id);
CREATE INDEX idx_inquiries_buyer_id ON inquiries(buyer_id);
CREATE INDEX idx_inquiries_seller_id ON inquiries(seller_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_conversation_id ON inquiries(conversation_id);

-- Additional indexes for conversations
CREATE INDEX idx_conversations_inquiry_id ON conversations(inquiry_id);
CREATE INDEX idx_conversations_listing_id ON conversations(listing_id);

-- 5. messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    -- Message content
    content_text TEXT NOT NULL,
    attachment_url VARCHAR(500),
    attachment_type VARCHAR(50),

    -- Status
    is_read BOOLEAN DEFAULT false,

    -- Timestamp
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- 6. otp_verifications table
CREATE TABLE otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    hashed_otp VARCHAR(255) NOT NULL,
    otp_type VARCHAR(30) NOT NULL CHECK (otp_type IN ('registration', 'login', 'password_reset')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for otp_verifications
CREATE INDEX idx_otp_verifications_email ON otp_verifications(email);
CREATE INDEX idx_otp_verifications_user_id ON otp_verifications(user_id);
CREATE INDEX idx_otp_verifications_expires_at ON otp_verifications(expires_at);

-- 7. verification_requests table
CREATE TABLE verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    request_type VARCHAR(30) NOT NULL CHECK (request_type IN ('user_verification', 'listing_verification')),
    status VARCHAR(30) DEFAULT 'New Request'
        CHECK (status IN ('New Request', 'Contacted', 'Docs Under Review', 'More Info Requested', 'Approved', 'Rejected')),
    reason TEXT,
    admin_notes TEXT,
    documents_submitted JSONB, -- Array of document objects
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for verification_requests
CREATE INDEX idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX idx_verification_requests_listing_id ON verification_requests(listing_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
CREATE INDEX idx_verification_requests_request_type ON verification_requests(request_type);

-- 8. notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('inquiry', 'verification', 'system', 'engagement', 'listing_update', 'new_message')),
    message TEXT NOT NULL,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 9. user_events table (for basic analytics)
CREATE TABLE user_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'listing_viewed', 'inquiry_sent', etc.
    event_data JSONB, -- Additional context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user_events
CREATE INDEX idx_user_events_user_id ON user_events(user_id);
CREATE INDEX idx_user_events_event_type ON user_events(event_type);
CREATE INDEX idx_user_events_created_at ON user_events(created_at DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies

-- Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Listings visibility based on status and user role
CREATE POLICY "Anyone can view active listings" ON listings
    FOR SELECT USING (status IN ('active', 'verified_anonymous', 'verified_public'));

CREATE POLICY "Sellers can view own listings" ON listings
    FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own listings" ON listings
    FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert own listings" ON listings
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Messages can only be seen by conversation participants
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (
        auth.uid() = sender_id OR
        auth.uid() = receiver_id
    );

CREATE POLICY "Users can insert messages they send" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Inquiries policies
CREATE POLICY "Users can view inquiries they're involved in" ON inquiries
    FOR SELECT USING (
        auth.uid() = buyer_id OR
        auth.uid() = seller_id
    );

CREATE POLICY "Buyers can create inquiries" ON inquiries
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Conversations policies
CREATE POLICY "Users can view conversations they're part of" ON conversations
    FOR SELECT USING (
        auth.uid() = buyer_id OR
        auth.uid() = seller_id
    );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Admin policies (admins can see everything)
CREATE POLICY "Admins can view all user profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all listings" ON listings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all inquiries" ON inquiries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all conversations" ON conversations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all messages" ON messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Database Functions

-- Function to update conversation on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET
        updated_at = NOW(),
        last_message_snippet = LEFT(NEW.content_text, 100),
        buyer_unread_count = CASE
            WHEN NEW.receiver_id = buyer_id THEN buyer_unread_count + 1
            ELSE buyer_unread_count
        END,
        seller_unread_count = CASE
            WHEN NEW.receiver_id = seller_id THEN seller_unread_count + 1
            ELSE seller_unread_count
        END
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation on new message
CREATE TRIGGER trigger_update_conversation_on_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();
