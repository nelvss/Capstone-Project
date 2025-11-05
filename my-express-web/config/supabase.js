const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const rawSupabaseUrl = process.env.SUPABASE_URL || '';
const supabaseUrl = rawSupabaseUrl.trim().replace(/^['"]|['"]$/g, '');
const supabaseKey = (process.env.SUPABASE_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ CRITICAL ERROR: Missing Supabase configuration!');
  console.error('Please set SUPABASE_URL and SUPABASE_KEY environment variables.');
  process.exit(1);
}

try {
  const parsed = new URL(supabaseUrl);
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error('URL must start with http:// or https://');
  }
} catch (e) {
  console.error('❌ Invalid SUPABASE_URL value.');
  console.error('Received:', JSON.stringify(supabaseUrl));
  console.error('Hint: It should look like https://your-project-ref.supabase.co');
  console.error('Details:', e.message);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test Supabase connection on startup
console.log('🔗 Testing Supabase connection...');
supabase
  .from('users')
  .select('count')
  .limit(1)
  .then(() => {
    console.log('✅ Supabase connection successful');
  })
  .catch((error) => {
    console.error('❌ Supabase connection failed:', error.message);
    console.error('⚠️ Server will continue but database operations may fail');
  });

module.exports = supabase;

