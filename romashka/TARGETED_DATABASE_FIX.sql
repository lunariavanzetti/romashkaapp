-- ROMASHKA TARGETED DATABASE FIX
-- Version: 1.0.0 - Targeted Fix for Specific Issues
-- Date: 2025-01-13
-- Purpose: Fix only the specific missing pieces identified in your schema

-- This script addresses ONLY the actual missing pieces:
-- 1. Missing customer_name column in conversations table
-- 2. Missing branding columns in system_settings table  
-- 3. Missing storage buckets
-- 4. Storage bucket policies

-- ================================
-- STEP 1: ADD MISSING COLUMN TO CONVERSATIONS TABLE
-- ================================

-- Add the missing customer_name column that's causing 404 errors
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

-- Add an index for the new column
CREATE INDEX IF NOT EXISTS idx_conversations_customer_name ON conversations(customer_name);

-- ================================
-- STEP 2: ADD MISSING BRANDING COLUMNS TO SYSTEM_SETTINGS
-- ================================

-- Add all the missing branding columns to system_settings table
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS custom_accent_color TEXT DEFAULT '#F59E0B';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS custom_company_name TEXT DEFAULT 'ROMASHKA';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS custom_tagline TEXT DEFAULT 'AI-Powered Customer Service';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS custom_logo_url TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS custom_favicon_url TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS custom_primary_color TEXT DEFAULT '#3B82F6';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS custom_secondary_color TEXT DEFAULT '#10B981';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS custom_background_color TEXT DEFAULT '#F9FAFB';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS custom_text_color TEXT DEFAULT '#1F2937';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS custom_css TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS white_label_enabled BOOLEAN DEFAULT false;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS brand_guidelines JSONB DEFAULT '{}';

-- ================================
-- STEP 3: CREATE MISSING STORAGE BUCKETS
-- ================================

-- Create storage buckets for file uploads with proper limits and MIME types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
    ('logos', 'logos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']),
    ('brand-assets', 'brand-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']),
    ('personality-avatars', 'personality-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
    ('chat-attachments', 'chat-attachments', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
    ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/csv', 'application/json']),
    ('training-data', 'training-data', false, 104857600, ARRAY['application/json', 'text/plain', 'text/csv', 'application/xml']),
    ('backups', 'backups', false, 1073741824, ARRAY['application/gzip', 'application/zip', 'application/x-tar'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ================================
-- STEP 4: CREATE STORAGE BUCKET POLICIES
-- ================================

-- Policies for avatars bucket
CREATE POLICY "Users can upload their own avatars" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view their own avatars" ON storage.objects FOR SELECT USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can update their own avatars" ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete their own avatars" ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Avatars are publicly viewable" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Policies for logos bucket
CREATE POLICY "Users can upload their own logos" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view their own logos" ON storage.objects FOR SELECT USING (
    bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can update their own logos" ON storage.objects FOR UPDATE USING (
    bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete their own logos" ON storage.objects FOR DELETE USING (
    bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Logos are publicly viewable" ON storage.objects FOR SELECT USING (bucket_id = 'logos');

-- Policies for brand-assets bucket
CREATE POLICY "Users can upload their own brand assets" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view their own brand assets" ON storage.objects FOR SELECT USING (
    bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can update their own brand assets" ON storage.objects FOR UPDATE USING (
    bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete their own brand assets" ON storage.objects FOR DELETE USING (
    bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Brand assets are publicly viewable" ON storage.objects FOR SELECT USING (bucket_id = 'brand-assets');

-- Policies for personality-avatars bucket
CREATE POLICY "Users can upload their own personality avatars" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'personality-avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view their own personality avatars" ON storage.objects FOR SELECT USING (
    bucket_id = 'personality-avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can update their own personality avatars" ON storage.objects FOR UPDATE USING (
    bucket_id = 'personality-avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete their own personality avatars" ON storage.objects FOR DELETE USING (
    bucket_id = 'personality-avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Personality avatars are publicly viewable" ON storage.objects FOR SELECT USING (bucket_id = 'personality-avatars');

-- Policies for chat-attachments bucket
CREATE POLICY "Users can upload chat attachments" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'chat-attachments' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can view chat attachments" ON storage.objects FOR SELECT USING (
    bucket_id = 'chat-attachments' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update chat attachments" ON storage.objects FOR UPDATE USING (
    bucket_id = 'chat-attachments' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can delete chat attachments" ON storage.objects FOR DELETE USING (
    bucket_id = 'chat-attachments' AND auth.role() = 'authenticated'
);

-- Policies for documents bucket
CREATE POLICY "Users can upload documents" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can view documents" ON storage.objects FOR SELECT USING (
    bucket_id = 'documents' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update documents" ON storage.objects FOR UPDATE USING (
    bucket_id = 'documents' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can delete documents" ON storage.objects FOR DELETE USING (
    bucket_id = 'documents' AND auth.role() = 'authenticated'
);

-- Policies for training-data bucket (admin only)
CREATE POLICY "Admins can manage training data" ON storage.objects FOR ALL USING (
    bucket_id = 'training-data' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for backups bucket (admin only)
CREATE POLICY "Admins can manage backups" ON storage.objects FOR ALL USING (
    bucket_id = 'backups' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ================================
-- STEP 5: INSERT DEFAULT BRANDING SETTINGS
-- ================================

-- Insert default branding settings if they don't exist
INSERT INTO system_settings (setting_key, setting_value, description, is_public, custom_accent_color, custom_company_name, custom_tagline) VALUES
('branding_accent_color', '"#F59E0B"', 'Default accent color for branding', true, '#F59E0B', 'ROMASHKA', 'AI-Powered Customer Service'),
('branding_company_name', '"ROMASHKA"', 'Default company name', true, '#F59E0B', 'ROMASHKA', 'AI-Powered Customer Service'),
('branding_tagline', '"AI-Powered Customer Service"', 'Default company tagline', true, '#F59E0B', 'ROMASHKA', 'AI-Powered Customer Service'),
('white_label_enabled', 'false', 'Enable white-label mode', false, '#F59E0B', 'ROMASHKA', 'AI-Powered Customer Service'),
('file_upload_enabled', 'true', 'Enable file uploads', false, '#F59E0B', 'ROMASHKA', 'AI-Powered Customer Service')
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description,
    is_public = EXCLUDED.is_public,
    custom_accent_color = EXCLUDED.custom_accent_color,
    custom_company_name = EXCLUDED.custom_company_name,
    custom_tagline = EXCLUDED.custom_tagline;

-- ================================
-- STEP 6: VERIFICATION QUERIES
-- ================================

-- Verify the targeted fixes
SELECT 'TARGETED FIX VERIFICATION' as section;

-- Check if customer_name column was added
SELECT 
    'Customer Name Column Check' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'customer_name') 
        THEN 'PASS - Column Added' 
        ELSE 'FAIL - Column Missing' 
    END as status;

-- Check if branding columns were added
SELECT 
    'Branding Columns Check' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'custom_accent_color') 
        THEN 'PASS - Branding Columns Added' 
        ELSE 'FAIL - Branding Columns Missing' 
    END as status;

-- Check if storage buckets were created
SELECT 
    'Storage Buckets Check' as check_name,
    COUNT(*) as buckets_created,
    CASE 
        WHEN COUNT(*) >= 8 THEN 'PASS - All Buckets Created' 
        ELSE 'FAIL - Missing Buckets' 
    END as status
FROM storage.buckets 
WHERE id IN ('avatars', 'logos', 'brand-assets', 'personality-avatars', 'chat-attachments', 'documents', 'training-data', 'backups');

-- Check if storage policies were created
SELECT 
    'Storage Policies Check' as check_name,
    COUNT(*) as policies_created,
    CASE 
        WHEN COUNT(*) >= 20 THEN 'PASS - Storage Policies Created' 
        ELSE 'FAIL - Missing Storage Policies' 
    END as status
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- List all your storage buckets
SELECT 
    'Storage Buckets Created' as info,
    id as bucket_id,
    name as bucket_name,
    public as is_public,
    file_size_limit as size_limit_bytes,
    ROUND(file_size_limit / 1024.0 / 1024.0, 2) as size_limit_mb
FROM storage.buckets 
ORDER BY name;

-- Success message
SELECT 
    'TARGETED FIX COMPLETED SUCCESSFULLY!' as message,
    'Only the specific missing pieces were fixed:' as details,
    '✅ customer_name column added to conversations table' as fix_1,
    '✅ Branding columns added to system_settings table' as fix_2,
    '✅ Storage buckets created with proper policies' as fix_3,
    'Your existing comprehensive database schema was preserved!' as note;