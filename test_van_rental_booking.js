// Test van rental booking creation
const testData = {
    booking_id: "test-123",
    destination_id: "cd9b01a4-9409-46c0-b4a6-9e5ce858039f",
    rental_days: 2,
    total_price: 3000
};

async function testVanRentalBooking() {
    try {
        console.log('🧪 Testing van rental booking creation...');
        console.log('📝 Test data:', testData);
        
        const response = await fetch('http://localhost:3000/api/booking-van-rental', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Van rental booking created successfully!');
            console.log('📊 Response:', result);
        } else {
            console.log('❌ Van rental booking failed:');
            console.log('📊 Error:', result);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testVanRentalBooking();
