// Test script for van rental integration
// Run this after updating the Supabase schema

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://vjeykmpzwxqonkfnzbjw.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZXlrbXB6d3hxb25rZm56Ymp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDM0NzAsImV4cCI6MjA3NjA3OTQ3MH0.qDBNgf1Ot3mmQrIBkPGXoPRC1J00Vy6r8iaPGDjQKec';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testVanRentalIntegration() {
    console.log('🧪 Testing Van Rental Integration...\n');
    
    try {
        // Test 1: Check table structure
        console.log('1️⃣ Checking bookings_van_rental table structure...');
        const { data: columns, error: columnsError } = await supabase
            .from('bookings_van_rental')
            .select('*')
            .limit(1);
        
        if (columnsError) {
            console.log('❌ Table structure check failed:', columnsError.message);
            return false;
        }
        console.log('✅ Table structure check passed\n');
        
        // Test 2: Test API endpoint (simulate the request)
        console.log('2️⃣ Testing van rental booking creation...');
        
        // First, get a valid booking_id from the bookings table
        const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('booking_id')
            .limit(1);
        
        if (bookingsError || !bookings || bookings.length === 0) {
            console.log('⚠️ No bookings found. Creating a test booking first...');
            
            // Create a test booking
            const testBooking = {
                booking_id: 'TEST-VAN-001',
                customer_first_name: 'Test',
                customer_last_name: 'User',
                customer_email: 'test@example.com',
                customer_contact: '1234567890',
                booking_type: 'tour_only',
                booking_preferences: 'Test booking for van rental',
                arrival_date: '2025-01-01',
                departure_date: '2025-01-02',
                number_of_tourist: 1,
                status: 'pending'
            };
            
            const { data: newBooking, error: newBookingError } = await supabase
                .from('bookings')
                .insert([testBooking])
                .select();
            
            if (newBookingError) {
                console.log('❌ Failed to create test booking:', newBookingError.message);
                return false;
            }
            
            console.log('✅ Test booking created');
        }
        
        // Get a valid van_destination_id
        const { data: destinations, error: destinationsError } = await supabase
            .from('van_destinations')
            .select('id')
            .limit(1);
        
        if (destinationsError || !destinations || destinations.length === 0) {
            console.log('❌ No van destinations found. Please add destinations to van_destinations table.');
            return false;
        }
        
        // Test van rental booking creation
        const testVanRental = {
            booking_id: bookings?.[0]?.booking_id || 'TEST-VAN-001',
            van_destination_id: destinations[0].id,
            number_of_days: 2,
            total_amount: 5000.00,
            trip_type: 'Test Van Rental',
            choose_destination: 'Test Destination'
        };
        
        const { data: vanRental, error: vanRentalError } = await supabase
            .from('bookings_van_rental')
            .insert([testVanRental])
            .select();
        
        if (vanRentalError) {
            console.log('❌ Van rental booking creation failed:', vanRentalError.message);
            return false;
        }
        
        console.log('✅ Van rental booking created successfully:', vanRental[0]);
        
        // Test 3: Verify foreign key relationships
        console.log('\n3️⃣ Testing foreign key relationships...');
        
        const { data: vanRentalWithJoins, error: joinError } = await supabase
            .from('bookings_van_rental')
            .select(`
                *,
                bookings:booking_id (
                    customer_first_name,
                    customer_last_name
                ),
                van_destinations:van_destination_id (
                    destination_name
                )
            `)
            .eq('booking_van_rentals_id', vanRental[0].booking_van_rentals_id);
        
        if (joinError) {
            console.log('❌ Foreign key relationship test failed:', joinError.message);
            return false;
        }
        
        console.log('✅ Foreign key relationships working correctly');
        console.log('📊 Van rental with related data:', vanRentalWithJoins[0]);
        
        console.log('\n🎉 Van rental integration test completed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        return false;
    }
}

// Run the test
testVanRentalIntegration()
    .then(success => {
        if (success) {
            console.log('\n✅ All tests passed! Van rental integration is working correctly.');
        } else {
            console.log('\n❌ Some tests failed. Please check the errors above.');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });
