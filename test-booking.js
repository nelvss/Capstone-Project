// Test booking submission with custom booking ID
const testBooking = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
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
            })
        });

        const result = await response.json();
        console.log('✅ Booking test result:', result);
        
        if (result.success) {
            console.log('🎉 SUCCESS: Custom booking ID is working!');
            console.log('📋 Booking ID:', result.booking.booking_id);
        } else {
            console.log('❌ FAILED:', result.message);
        }
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
};

testBooking();
