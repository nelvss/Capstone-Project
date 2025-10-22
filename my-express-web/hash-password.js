const bcrypt = require('bcryptjs');

// Simple script to hash passwords for your Supabase users table
const password = 'test123'; // Change this to your desired password
const hashedPassword = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hashed Password:', hashedPassword);
console.log('\nCopy the hashed password above and paste it into your Supabase users table in the password_hash column.');
