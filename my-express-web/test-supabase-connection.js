const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://vjeykmpzwxqonkfnzbjw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZXlrbXB6d3hxb25rZm56Ymp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDM0NzAsImV4cCI6MjA3NjA3OTQ3MH0.qDBNgf1Ot3mmQrIBkPGXoPRC1J00Vy6r8iaPGDjQKec';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('🔍 Testing Supabase connection...');
    
    try {
        // Test basic connection
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .limit(5);
        
        console.log('📊 Connection result:', { data, error });
        
        if (error) {
            console.log('❌ Connection failed:', error.message);
            console.log('Error details:', error);
        } else {
            console.log('✅ Connection successful!');
            console.log('Users found:', data.length);
            if (data.length > 0) {
                console.log('First user:', data[0]);
            }
        }
    } catch (err) {
        console.log('❌ Connection error:', err.message);
    }
}

testConnection();
