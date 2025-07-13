-- Add brand customization columns to system_settings table
-- These columns may already exist, so we use IF NOT EXISTS or handle errors gracefully

-- Add brand customization columns
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS custom_accent_color TEXT DEFAULT '#F59E0B',
ADD COLUMN IF NOT EXISTS custom_company_name TEXT DEFAULT 'ROMASHKA',
ADD COLUMN IF NOT EXISTS custom_tagline TEXT DEFAULT 'AI-Powered Customer Service';

-- Update the updated_at timestamp when brand settings change
CREATE OR REPLACE FUNCTION update_brand_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for brand settings updates (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'brand_settings_update_timestamp'
  ) THEN
    CREATE TRIGGER brand_settings_update_timestamp
      BEFORE UPDATE ON system_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_brand_settings_timestamp();
  END IF;
END $$;

-- Create storage bucket for brand assets (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for brand assets
CREATE POLICY IF NOT EXISTS "Users can upload their own brand assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'brand-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can view their own brand assets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'brand-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can update their own brand assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'brand-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can delete their own brand assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'brand-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to brand assets (for logos)
CREATE POLICY IF NOT EXISTS "Brand assets are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-assets');

COMMENT ON TABLE system_settings IS 'System settings including brand customization options';
COMMENT ON COLUMN system_settings.custom_accent_color IS 'Custom accent color for brand theme';
COMMENT ON COLUMN system_settings.custom_company_name IS 'Custom company name for white-labeling';
COMMENT ON COLUMN system_settings.custom_tagline IS 'Custom company tagline for branding';