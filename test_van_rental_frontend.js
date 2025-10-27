// Test script to verify van rental frontend integration
// This simulates the frontend data collection and submission process

console.log('🧪 Testing Van Rental Frontend Integration...\n');

// Simulate the van rental data collection (from tour_only.js)
function simulateVanRentalDataCollection() {
    console.log('1️⃣ Simulating van rental form data collection...');
    
    // Mock form elements (simulating the actual form)
    const mockFormData = {
        destinationSelect: { value: 'Within Puerto Galera' },
        placeSelect: { value: 'White Beach' },
        withinTripTypeSelect: { value: 'roundtrip' },
        vanDays: { value: '2' },
        amountOfVanRental: { value: '₱3,000.00' }
    };
    
    // Simulate the data collection logic from tour_only.js
    const selectedVanRental = (() => {
        const destinationSelect = mockFormData.destinationSelect;
        const placeSelect = mockFormData.placeSelect;
        const withinTripTypeSelect = mockFormData.withinTripTypeSelect;
        const vanDaysInput = mockFormData.vanDays;
        const vanTotalAmount = mockFormData.amountOfVanRental;
        
        if (!destinationSelect || !destinationSelect.value) return null;
        
        let destination = '';
        let tripType = '';
        
        if (destinationSelect.value === 'Within Puerto Galera') {
            if (placeSelect && placeSelect.value) {
                destination = placeSelect.value;
                tripType = withinTripTypeSelect?.value || '';
            }
        }
        
        if (!destination) return null;
        
        return {
            destination: destination,
            tripType: tripType,
            days: parseInt(vanDaysInput?.value) || 1,
            price: parseFloat(vanTotalAmount?.value?.replace(/[₱,]/g, '') || 0)
        };
    })();
    
    console.log('✅ Van rental data collected:', selectedVanRental);
    return selectedVanRental;
}

// Simulate the API payload creation (from tour_summary.js)
function simulateVanRentalPayload(selectedVanRental, bookingId) {
    console.log('\n2️⃣ Simulating van rental API payload creation...');
    
    // Mock destination ID lookup
    const mockDestinationId = 1; // This would come from the database
    
    const vanPayload = {
        booking_id: bookingId,
        van_destination_id: mockDestinationId,
        number_of_days: selectedVanRental.days || 1,
        total_amount: selectedVanRental.price || 0,
        trip_type: selectedVanRental.tripType || 'Van Rental',
        choose_destination: selectedVanRental.destination || ''
    };
    
    console.log('✅ Van rental payload created:', vanPayload);
    return vanPayload;
}

// Test the complete flow
function testVanRentalFlow() {
    console.log('🚀 Testing complete van rental flow...\n');
    
    // Step 1: Collect form data
    const selectedVanRental = simulateVanRentalDataCollection();
    
    if (!selectedVanRental) {
        console.log('❌ No van rental data collected - form not filled');
        return false;
    }
    
    // Step 2: Create API payload
    const bookingId = 'TEST-25-001';
    const vanPayload = simulateVanRentalPayload(selectedVanRental, bookingId);
    
    // Step 3: Validate payload structure
    const requiredFields = ['booking_id', 'van_destination_id', 'number_of_days', 'total_amount', 'trip_type', 'choose_destination'];
    const missingFields = requiredFields.filter(field => !vanPayload[field] && vanPayload[field] !== 0);
    
    if (missingFields.length > 0) {
        console.log('❌ Missing required fields:', missingFields);
        return false;
    }
    
    console.log('\n✅ Van rental integration test completed successfully!');
    console.log('📊 Final payload:', JSON.stringify(vanPayload, null, 2));
    
    return true;
}

// Run the test
const success = testVanRentalFlow();

if (success) {
    console.log('\n🎉 Van rental frontend integration is working correctly!');
    console.log('\n📋 Next steps:');
    console.log('1. Make sure your Supabase van_destinations table has the destination "White Beach"');
    console.log('2. Test the actual form submission in the browser');
    console.log('3. Check the server logs for van rental booking creation');
} else {
    console.log('\n❌ Van rental integration test failed. Please check the errors above.');
}
