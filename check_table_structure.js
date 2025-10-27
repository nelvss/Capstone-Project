// Check the actual structure of bookings_van_rental table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://vjeykmpzwxqonkfnzbjw.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZXlrbXB6d3hxb25rZm56Ymp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDM0NzAsImV4cCI6MjA3NjA3OTQ3MH0.qDBNgf1Ot3mmQrIBkPGXoPRC1J00Vy6r8iaPGDjQKec';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
    try {
        console.log('🔍 Checking bookings_van_rental table structure...');
        
        // Try to get one record to see the actual columns
        const { data, error } = await supabase
            .from('bookings_van_rental')
            .select('*')
            .limit(1);
        
        if (error) {
            console.log('❌ Error accessing table:', error.message);
            return;
        }
        
        if (data && data.length > 0) {
            console.log('✅ Table structure found:');
            console.log('📊 Columns:', Object.keys(data[0]));
            console.log('📊 Sample record:', data[0]);
        } else {
            console.log('⚠️ Table is empty, but accessible');
            console.log('💡 This means the table exists but has no data');
        }
        
    } catch (error) {
        console.error('❌ Check failed:', error.message);
    }
}

checkTableStructure();
