// setup_storage_buckets.js
// This script creates the necessary storage buckets in your Supabase instance

const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment variables.');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageBuckets() {
  console.log('🚀 Setting up storage buckets...\n');

  const buckets = [
    {
      id: 'receipts',
      name: 'receipts',
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    },
    {
      id: 'documents',
      name: 'documents',
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    }
  ];

  for (const bucket of buckets) {
    try {
      // Check if bucket exists
      const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error(`❌ Error listing buckets: ${listError.message}`);
        continue;
      }

      const bucketExists = existingBuckets?.some(b => b.id === bucket.id);

      if (bucketExists) {
        console.log(`✅ Bucket '${bucket.id}' already exists`);
      } else {
        // Create the bucket
        const { data, error } = await supabase.storage.createBucket(bucket.id, {
          public: bucket.public,
          fileSizeLimit: bucket.fileSizeLimit,
          allowedMimeTypes: bucket.allowedMimeTypes
        });

        if (error) {
          console.error(`❌ Error creating bucket '${bucket.id}': ${error.message}`);
        } else {
          console.log(`✅ Successfully created bucket '${bucket.id}'`);
        }
      }
    } catch (error) {
      console.error(`❌ Unexpected error with bucket '${bucket.id}':`, error);
    }
  }

  console.log('\n✨ Storage bucket setup complete!');
  console.log('\nNote: If you\'re using Supabase CLI locally, you may need to run:');
  console.log('  supabase db reset');
  console.log('  supabase migration up');
  console.log('\nThis will apply all migrations including the storage bucket setup.');
}

// Run the setup
setupStorageBuckets().catch(console.error);