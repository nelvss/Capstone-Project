// Test booking submission with custom booking ID
const testBooking = async () => {
    try {
        console.log('🧪 Testing booking submission with custom booking ID...');
        
        const bookingData = {
            booking_id: "25-000",
            customer_first_name: "Test",
            customer_last_name: "User",
            customer_email: "test@example.com",
            customer_contact: "1234567890",
            booking_type: "package_only",
            booking_preferences: "Package Only: Package 1",
            arrival_date: "2025-01-01",
            departure_date: "2025-01-02",
            number_of_tourist: 1,
            status: "pending"
        };
        
        console.log('📤 Sending booking data:', bookingData);
        
        const response = await fetch('http://localhost:3000/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        });

        const result = await response.json();
        console.log('📥 Server response:', result);
        
        if (result.success) {
            console.log('🎉 SUCCESS: Custom booking ID is working!');
            console.log('📋 Booking ID:', result.booking.booking_id);
            console.log('✅ Database schema update was successful!');
        } else {
            console.log('❌ FAILED:', result.message);
            console.log('🔍 Error details:', result.error);
            
            if (result.error && result.error.includes('null value in column "booking_id"')) {
                console.log('💡 The database schema still needs to be updated.');
                console.log('📋 Run this SQL in Supabase:');
                console.log('   ALTER TABLE bookings ALTER COLUMN booking_id DROP DEFAULT;');
                console.log('   ALTER TABLE bookings ALTER COLUMN booking_id TYPE VARCHAR(50);');
            }
        }
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
};

testBooking();
