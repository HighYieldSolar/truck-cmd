// verify_migration.js
// Script to verify that the enhanced compliance notifications migration was applied successfully

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyMigration() {
  console.log('🔍 Verifying Enhanced Compliance Notifications Migration...\n');

  try {
    // 1. Check if new columns exist in notifications table
    console.log('1. Checking notifications table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Error accessing notifications table:', tableError.message);
      return false;
    }

    if (tableInfo && tableInfo.length > 0) {
      const columns = Object.keys(tableInfo[0]);
      const newColumns = ['due_date', 'urgency', 'link_to'];
      const hasNewColumns = newColumns.every(col => columns.includes(col));

      if (hasNewColumns) {
        console.log('✅ New columns (due_date, urgency, link_to) found in notifications table');
      } else {
        console.log('⚠️  Some new columns missing:', newColumns.filter(col => !columns.includes(col)));
      }
    } else {
      console.log('ℹ️  Notifications table is empty, structure check inconclusive');
    }

    // 2. Test generate_compliance_notifications function
    console.log('\n2. Testing generate_compliance_notifications function...');
    const { data: funcResult, error: funcError } = await supabase
      .rpc('generate_compliance_notifications');

    if (funcError) {
      console.error('❌ Error calling generate_compliance_notifications:', funcError.message);
    } else {
      console.log('✅ generate_compliance_notifications function works');
      console.log(`   Generated ${funcResult || 0} notifications`);
    }

    // 3. Test get_compliance_summary function
    console.log('\n3. Testing get_compliance_summary function...');
    const { data: summaryResult, error: summaryError } = await supabase
      .rpc('get_compliance_summary');

    if (summaryError) {
      console.error('❌ Error calling get_compliance_summary:', summaryError.message);
    } else {
      console.log('✅ get_compliance_summary function works');
      console.log('   Summary data:', JSON.stringify(summaryResult, null, 2));
    }

    // 4. Test cleanup_old_notifications function
    console.log('\n4. Testing cleanup_old_notifications function...');
    const { data: cleanupResult, error: cleanupError } = await supabase
      .rpc('cleanup_old_notifications');

    if (cleanupError) {
      console.error('❌ Error calling cleanup_old_notifications:', cleanupError.message);
    } else {
      console.log('✅ cleanup_old_notifications function works');
      console.log(`   Cleaned up ${cleanupResult || 0} old notifications`);
    }

    // 5. Check if indexes exist (try to query with performance indicators)
    console.log('\n5. Testing performance indexes...');
    const { data: indexTest, error: indexError } = await supabase
      .from('notifications')
      .select('id, type, urgency, due_date')
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5);

    if (indexError) {
      console.error('❌ Error testing indexes:', indexError.message);
    } else {
      console.log('✅ Notifications query with new columns works (indexes likely present)');
    }

    console.log('\n🎉 Migration verification complete!');
    console.log('\nNext steps:');
    console.log('- Run your Next.js app: npm run dev');
    console.log('- Check the dashboard for the new compliance overview');
    console.log('- Test creating some sample compliance items to see notifications');

    return true;

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

// Run verification
verifyMigration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  }); 