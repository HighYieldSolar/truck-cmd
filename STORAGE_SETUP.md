# Storage Bucket Setup Guide

This application uses Supabase Storage for file uploads (receipts, documents, etc.). If you're getting "Bucket not found" errors, follow these steps:

## Option 1: Using the Setup Script (Recommended)

Run the following command:

```bash
npm run setup-storage
```

This will automatically create the required storage buckets in your Supabase instance.

## Option 2: Using Supabase CLI

If you're using Supabase CLI locally:

```bash
# Apply all migrations including storage bucket setup
supabase migration up

# Or reset the database and apply all migrations
supabase db reset
```

## Option 3: Manual Setup via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to Storage section
3. Create two buckets:
   
   **Receipts Bucket:**
   - Name: `receipts`
   - Public: Yes
   - File size limit: 10MB
   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp, application/pdf

   **Documents Bucket:**
   - Name: `documents`
   - Public: Yes
   - File size limit: 10MB
   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

## Troubleshooting

1. **Still getting errors after setup?**
   - Check that your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correctly set
   - Ensure you're connected to the right Supabase instance (local vs production)

2. **Permission errors?**
   - The migration file includes RLS policies, but you may need to verify they're applied
   - Check the Storage policies in your Supabase dashboard

3. **Local development issues?**
   - Make sure your local Supabase instance is running: `supabase start`
   - Check the local Supabase Studio at http://localhost:54323

## Storage Structure

Files are organized as follows:
- Receipts: `{user_id}/loads/{load_number}/pod/{timestamp}-{filename}`
- Documents: `{user_id}/{timestamp}.{extension}`

This structure ensures user data isolation and easy organization.