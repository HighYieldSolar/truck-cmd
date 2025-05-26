// simple_test.js
// Simple test to verify the migration worked

const { createClient } = require('@supabase/supabase-js');

// Use environment variables from your Next.js app
// Check if you have a .env.local file with these values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mkqtcrbthmwqmdtrxjtc.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials');
  console.log('Please check your environment variables or .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFunctions() {
  console.log('🔍 Testing Enhanced Compliance Notifications...\n');

  try {
    console.log('1. Testing generate_compliance_notifications function...');
    const { data: generateResult, error: generateError } = await supabase
      .rpc('generate_compliance_notifications');

    if (generateError) {
      console.log('❌ generate_compliance_notifications error:', generateError.message);
    } else {
      console.log('✅ generate_compliance_notifications works - generated', generateResult, 'notifications');
    }

    console.log('\n2. Testing get_compliance_summary function...');
    // Use a dummy UUID for testing
    const testUserId = 'e95b4799-4dbe-45d0-988b-06d7c819fbda'; // Your user ID from the logs

    const { data: summaryResult, error: summaryError } = await supabase
      .rpc('get_compliance_summary', { p_user_id: testUserId });

    if (summaryError) {
      console.log('❌ get_compliance_summary error:', summaryError.message);
    } else {
      console.log('✅ get_compliance_summary works');
      console.log('   Summary data:', JSON.stringify(summaryResult, null, 2));
    }

    console.log('\n3. Testing cleanup_old_notifications function...');
    const { data: cleanupResult, error: cleanupError } = await supabase
      .rpc('cleanup_old_notifications');

    if (cleanupError) {
      console.log('❌ cleanup_old_notifications error:', cleanupError.message);
    } else {
      console.log('✅ cleanup_old_notifications works - cleaned up', cleanupResult, 'notifications');
    }

    console.log('\n🎉 Test complete!');

    if (!generateError && !summaryError && !cleanupError) {
      console.log('\n✅ All functions working correctly!');
      console.log('Your compliance notifications system is ready to use.');
      console.log('\nNext steps:');
      console.log('- Refresh your dashboard page');
      console.log('- Look for the new Compliance Overview section');
      console.log('- Create some test compliance items to see notifications in action');
    } else {
      console.log('\n⚠️  Some functions had errors. Check the error messages above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFunctions(); 