-- Create storage buckets for the application
-- This migration creates the necessary storage buckets for receipts and documents

-- Enable the storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert storage buckets if they don't exist
DO $$
BEGIN
    -- Create receipts bucket
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'receipts'
    ) THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'receipts',
            'receipts', 
            true,  -- Public bucket for receipt images
            10485760,  -- 10MB file size limit
            ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']::text[]
        );
    END IF;

    -- Create documents bucket (for backwards compatibility)
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'documents'
    ) THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'documents',
            'documents',
            true,  -- Public bucket for documents
            10485760,  -- 10MB file size limit
            ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
        );
    END IF;
END $$;

-- Create RLS policies for receipts bucket
CREATE POLICY "Enable read access for all users" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'receipts');

CREATE POLICY "Enable insert for authenticated users only" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Enable update for users based on user_id" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Enable delete for users based on user_id" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create RLS policies for documents bucket
CREATE POLICY "Enable read access for all users on documents" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'documents');

CREATE POLICY "Enable insert for authenticated users only on documents" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Enable update for users based on user_id on documents" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Enable delete for users based on user_id on documents" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);