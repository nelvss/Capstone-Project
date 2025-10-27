// Fix script for van destinations error
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://vjeykmpzwxqonkfnzbjw.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZXlrbXB6d3hxb25rZm56Ymp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDM0NzAsImV4cCI6MjA3NjA3OTQ3MH0.qDBNgf1Ot3mmQrIBkPGXoPRC1J00Vy6r8iaPGDjQKec';
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseVanDestinationsError() {
    console.log('🔍 Diagnosing van destinations error...\n');
    
    try {
        // Step 1: Check if table exists
        console.log('1️⃣ Checking if van_destinations table exists...');
        const { data: tableCheck, error: tableError } = await supabase
            .from('van_destinations')
            .select('*')
            .limit(1);
        
        if (tableError) {
            console.log('❌ Table access error:', tableError.message);
            
            if (tableError.message.includes('does not exist')) {
                console.log('💡 Solution: The van_destinations table does not exist.');
                console.log('   You need to create it in your Supabase database.');
                console.log('   Here\'s the SQL to create it:');
                console.log(`
CREATE TABLE van_destinations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert some sample destinations
INSERT INTO van_destinations (name, description) VALUES
('White Beach', 'Popular beach destination'),
('Sabang', 'Main tourist area'),
('Muelle', 'Port area'),
('Balatero', 'Beach area'),
('Aninuan', 'Beach area'),
('Ponderosa', 'Mountain area'),
('Tabinay', 'Beach area'),
('Dulangan', 'Beach area'),
('Tamaraw Falls', 'Waterfall destination'),
('Windfarm', 'Wind farm area'),
('Calapan', 'City destination'),
('Roxas', 'City destination');
                `);
                return false;
            }
        }
        
        console.log('✅ Table exists and is accessible');
        
        // Step 2: Check table structure
        console.log('\n2️⃣ Checking table structure...');
        if (tableCheck && tableCheck.length > 0) {
            console.log('📊 Table columns:', Object.keys(tableCheck[0]));
            console.log('📊 Sample record:', tableCheck[0]);
        } else {
            console.log('⚠️ Table is empty - no records found');
        }
        
        // Step 3: Test the API endpoint
        console.log('\n3️⃣ Testing API endpoint...');
        const { data: allData, error: allError } = await supabase
            .from('van_destinations')
            .select('*');
        
        if (allError) {
            console.log('❌ Error fetching all data:', allError.message);
            return false;
        }
        
        console.log(`✅ Successfully fetched ${allData.length} destinations`);
        
        if (allData.length > 0) {
            console.log('📊 Available destinations:');
            allData.forEach((dest, index) => {
                const name = dest.name || dest.destination_name || dest.destination || dest.place || 'Unknown';
                const id = dest.id || dest.van_destination_id || dest.destination_id;
                console.log(`  ${index + 1}. ID: ${id}, Name: ${name}`);
            });
        }
        
        console.log('\n🎉 Van destinations are working correctly!');
        return true;
        
    } catch (error) {
        console.error('❌ Diagnosis failed:', error.message);
        return false;
    }
}

// Run the diagnosis
diagnoseVanDestinationsError()
    .then(success => {
        if (success) {
            console.log('\n✅ Van destinations are working! The error might be from server cache.');
            console.log('💡 Try restarting your server: Ctrl+C then node server.js');
        } else {
            console.log('\n❌ Van destinations need to be set up. See the SQL above.');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Diagnosis failed:', error);
        process.exit(1);
    });
