// Test script to check van destinations API
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://vjeykmpzwxqonkfnzbjw.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZXlrbXB6d3hxb25rZm56Ymp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDM0NzAsImV4cCI6MjA3NjA3OTQ3MH0.qDBNgf1Ot3mmQrIBkPGXoPRC1J00Vy6r8iaPGDjQKec';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testVanDestinationsAPI() {
    console.log('🧪 Testing Van Destinations API...\n');
    
    try {
        // Test 1: Check table structure
        console.log('1️⃣ Checking van_destinations table structure...');
        const { data: columns, error: columnsError } = await supabase
            .from('van_destinations')
            .select('*')
            .limit(1);
        
        if (columnsError) {
            console.log('❌ Table access failed:', columnsError.message);
            return false;
        }
        
        if (!columns || columns.length === 0) {
            console.log('⚠️ No data in van_destinations table');
            return false;
        }
        
        console.log('✅ Table accessible');
        console.log('📊 Sample record structure:', Object.keys(columns[0]));
        console.log('📊 Sample data:', columns[0]);
        
        // Test 2: Check all records
        console.log('\n2️⃣ Fetching all van destinations...');
        const { data: allDestinations, error: allError } = await supabase
            .from('van_destinations')
            .select('*');
        
        if (allError) {
            console.log('❌ Failed to fetch all destinations:', allError.message);
            return false;
        }
        
        console.log(`✅ Found ${allDestinations.length} destinations`);
        
        if (allDestinations.length > 0) {
            console.log('📊 All destinations:');
            allDestinations.forEach((dest, index) => {
                console.log(`  ${index + 1}. ID: ${dest.id || dest.van_destination_id || dest.destination_id}, Name: ${dest.destination_name || dest.name || dest.destination || dest.place || 'Unknown'}`);
            });
        }
        
        console.log('\n🎉 Van destinations API test completed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        return false;
    }
}

// Run the test
testVanDestinationsAPI()
    .then(success => {
        if (success) {
            console.log('\n✅ Van destinations table is accessible and working!');
        } else {
            console.log('\n❌ Van destinations test failed. Please check the errors above.');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });
