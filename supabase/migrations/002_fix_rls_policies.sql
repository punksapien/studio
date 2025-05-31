-- Fix RLS infinite recursion issue
-- Migration: 002_fix_rls_policies.sql

-- Drop the problematic admin policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all listings" ON listings;
DROP POLICY IF EXISTS "Admins can view all inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins can view all conversations" ON conversations;
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;

-- Add a policy to allow user profile insertion during registration
CREATE POLICY "Allow user profile creation" ON user_profiles
    FOR INSERT WITH CHECK (true);

-- Add a policy for public reading of basic listing info (for anonymous users)
CREATE POLICY "Public can view verified listings" ON listings
    FOR SELECT USING (status IN ('verified_anonymous', 'verified_public'));

-- We'll add proper admin policies later using a different approach
-- For now, we'll manage admin access through application logic rather than RLS

-- Add missing policies for other tables
CREATE POLICY "Users can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update notifications they own" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert user events" ON user_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own events" ON user_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert verification requests" ON verification_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own verification requests" ON verification_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own verification requests" ON verification_requests
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert OTP verifications" ON otp_verifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own OTP verifications" ON otp_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own OTP verifications" ON otp_verifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can update conversations they're part of" ON conversations
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can update inquiries they're involved in" ON inquiries
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
