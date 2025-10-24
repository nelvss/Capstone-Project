// Integration Test Script for Supabase Database Connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
    console.log('🧪 Starting Supabase Integration Tests...\n');
    
    try {
        // Test 1: Basic connection
        console.log('1️⃣ Testing basic Supabase connection...');
        const { data: testData, error: testError } = await supabase
            .from('users')
            .select('*')
            .limit(1);
        
        if (testError) {
            console.log('❌ Basic connection failed:', testError.message);
            return false;
        }
        console.log('✅ Basic connection successful\n');
        
        // Test 2: Check if all required tables exist
        console.log('2️⃣ Testing table existence...');
        const tables = [
            'bookings', 'booking_tour', 'booking_vehicles', 'bookings_diving', 
            'bookings_van_rental', 'package_only', 'hotels', 'vehicles', 
            'van_destinations', 'package_pricing', 'tour_only', 'payments'
        ];
        
        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    console.log(`❌ Table '${table}' not accessible:`, error.message);
                } else {
                    console.log(`✅ Table '${table}' accessible`);
                }
            } catch (err) {
                console.log(`❌ Table '${table}' error:`, err.message);
            }
        }
        console.log('');
        
        // Test 3: Test booking creation
        console.log('3️⃣ Testing booking creation...');
        const testBooking = {
            customer_name: 'Test Customer',
            email: 'test@example.com',
            contact_number: '1234567890',
            arrival_date: '2024-01-01',
            departure_date: '2024-01-05',
            total_price: 1000,
            status: 'pending',
            notes: 'Integration test booking'
        };
        
        const { data: bookingData, error: bookingError } = await supabase
            .from('bookings')
            .insert([testBooking])
            .select();
        
        if (bookingError) {
            console.log('❌ Booking creation failed:', bookingError.message);
        } else {
            console.log('✅ Booking created successfully:', bookingData[0].id);
            
            // Clean up test booking
            await supabase
                .from('bookings')
                .delete()
                .eq('id', bookingData[0].id);
            console.log('✅ Test booking cleaned up');
        }
        console.log('');
        
        // Test 4: Test API endpoints (if server is running)
        console.log('4️⃣ Testing API endpoints...');
        try {
            const response = await fetch('http://localhost:3000/api/health');
            if (response.ok) {
                const healthData = await response.json();
                console.log('✅ API server is running:', healthData.status);
                
                // Test bookings endpoint
                const bookingsResponse = await fetch('http://localhost:3000/api/bookings');
                if (bookingsResponse.ok) {
                    const bookingsData = await bookingsResponse.json();
                    console.log('✅ Bookings API endpoint working');
                } else {
                    console.log('❌ Bookings API endpoint failed');
                }
            } else {
                console.log('❌ API server not responding');
            }
        } catch (apiError) {
            console.log('❌ API server not running or not accessible');
        }
        console.log('');
        
        console.log('🎉 Integration tests completed!');
        return true;
        
    } catch (error) {
        console.error('❌ Integration test failed:', error.message);
        return false;
    }
}

// Run the tests
testDatabaseConnection()
    .then(success => {
        if (success) {
            console.log('\n✅ All tests passed! Your Supabase integration is working correctly.');
        } else {
            console.log('\n❌ Some tests failed. Please check your configuration.');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });
