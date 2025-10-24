const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://vjeykmpzwxqonkfnzbjw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZXlrbXB6d3hxb25rZm56Ymp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDM0NzAsImV4cCI6MjA3NjA3OTQ3MH0.qDBNgf1Ot3mmQrIBkPGXoPRC1J00Vy6r8iaPGDjQKec';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addUser() {
    // Change these values for new users
    const email = 'staff@example.com';
    const password = 'staff123';
    const role = 'staff'; // or 'owner'
    
    console.log(`🔐 Adding user: ${email}`);
    console.log(`🔐 Password: ${password}`);
    console.log(`🔐 Role: ${role}`);
    
    // Hash the password
    const passwordHash = bcrypt.hashSync(password, 10);
    console.log(`🔐 Hashed password: ${passwordHash}`);
    
    try {
        // Add user to database
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    email: email,
                    password_hash: passwordHash,
                    role: role
                }
            ]);
        
        if (error) {
            console.log('❌ Error adding user:', error.message);
        } else {
            console.log('✅ User added successfully!');
            console.log('📧 Email:', email);
            console.log('🔑 Password:', password);
            console.log('👤 Role:', role);
        }
    } catch (err) {
        console.log('❌ Error:', err.message);
    }
}

addUser();
