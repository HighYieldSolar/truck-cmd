// check_connection.js
// Quick script to check which Supabase environment your app connects to

console.log('🔍 Checking Supabase Connection Configuration...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '[REDACTED - Present]' : 'Not set');

// Check if connecting to local or remote
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (supabaseUrl) {
  if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
    console.log('\n🏠 LOCAL DEVELOPMENT MODE');
    console.log('Your app connects to: LOCAL Supabase instance');
    console.log('This requires: npx supabase start');
  } else if (supabaseUrl.includes('.supabase.co')) {
    console.log('\n☁️  REMOTE DEVELOPMENT MODE');
    console.log('Your app connects to: REMOTE Supabase project');
    console.log('This is your live/production database');
  } else {
    console.log('\n❓ CUSTOM SETUP');
    console.log('Your app connects to:', supabaseUrl);
  }
} else {
  console.log('\n❌ NO CONNECTION CONFIGURED');
  console.log('Missing environment variables!');
  console.log('Create a .env.local file with:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
}

console.log('\n---');
console.log('Migration Status:');
console.log('- Your recent migration (20250124000001) was applied to the REMOTE database');
console.log('- When you run npm run dev, you connect to whichever URL is in your env vars');
console.log('- The Supabase CLI manages migrations but doesn\'t affect your dev server connection'); 