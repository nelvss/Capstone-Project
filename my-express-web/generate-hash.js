const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔐 Password Hash Generator');
console.log('========================\n');

rl.question('Enter the password to hash: ', (password) => {
    if (!password) {
        console.log('❌ Password cannot be empty!');
        rl.close();
        return;
    }
    
    console.log('\n🔄 Generating hash...');
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    console.log('\n✅ Hash generated successfully!');
    console.log('========================');
    console.log('Original Password:', password);
    console.log('Hashed Password: ', hashedPassword);
    console.log('========================');
    console.log('\n📋 Copy the hashed password above and paste it into your Supabase users table.');
    console.log('💡 Remember to save the original password securely!');
    
    rl.close();
});
