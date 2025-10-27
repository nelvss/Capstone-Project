// Debug van rental API
const testData = {
    booking_id: "debug-test-456",
    destination_id: "cd9b01a4-9409-46c0-b4a6-9e5ce858039f",
    rental_days: 1,
    total_price: 1500
};

async function debugVanRental() {
    try {
        console.log('🧪 Testing van rental API...');
        console.log('📝 Test data:', testData);
        
        const response = await fetch('http://localhost:3000/api/booking-van-rental', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response:', result);
        
        if (response.ok) {
            console.log('✅ Van rental booking created successfully!');
        } else {
            console.log('❌ Van rental booking failed');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

debugVanRental();
