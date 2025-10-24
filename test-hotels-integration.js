// Test script to verify hotels integration
// Run this in browser console or as a Node.js script

console.log('🧪 Testing Hotels Integration...');

// Test 1: Check if hotels API endpoint is accessible
async function testHotelsAPI() {
    try {
        console.log('📡 Testing hotels API endpoint...');
        const response = await fetch('http://localhost:3000/api/hotels');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.hotels) {
            console.log('✅ Hotels API working correctly');
            console.log('📊 Found hotels:', data.hotels.length);
            data.hotels.forEach(hotel => {
                console.log(`  - ${hotel.name} (ID: ${hotel.hotel_id})`);
            });
            return data.hotels;
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('❌ Hotels API test failed:', error.message);
        return null;
    }
}

// Test 2: Check if package_only.js can fetch hotels
async function testPackageOnlyIntegration() {
    try {
        console.log('📦 Testing package_only.js integration...');
        
        // Simulate the fetchHotels function from package_only.js
        const response = await fetch('http://localhost:3000/api/hotels');
        const data = await response.json();
        
        if (data.success && data.hotels) {
            console.log('✅ Package only page can fetch hotels');
            return data.hotels;
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('❌ Package only integration test failed:', error.message);
        return null;
    }
}

// Test 3: Check if package_summary.js can get hotel IDs
async function testPackageSummaryIntegration() {
    try {
        console.log('📋 Testing package_summary.js integration...');
        
        // Simulate the fetchHotels function from package_summary.js
        const response = await fetch('http://localhost:3000/api/hotels');
        const data = await response.json();
        
        if (data.success && data.hotels) {
            const hotelsData = data.hotels;
            
            // Test getHotelIdByName function
            function getHotelIdByName(hotelName) {
                const hotel = hotelsData.find(h => h.name === hotelName);
                return hotel ? hotel.hotel_id : null;
            }
            
            // Test with known hotel names
            const testHotels = [
                'Ilaya Resort',
                'Bliss Beach Resort', 
                'The Mangyan Grand Hotel',
                'Mindoro Transient House',
                'Southview Lodge'
            ];
            
            console.log('🔍 Testing hotel ID lookup...');
            testHotels.forEach(hotelName => {
                const hotelId = getHotelIdByName(hotelName);
                if (hotelId) {
                    console.log(`✅ Found ID for "${hotelName}": ${hotelId}`);
                } else {
                    console.log(`❌ No ID found for "${hotelName}"`);
                }
            });
            
            return true;
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('❌ Package summary integration test failed:', error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Hotels Integration Tests...\n');
    
    const apiTest = await testHotelsAPI();
    if (!apiTest) {
        console.log('❌ API test failed - stopping tests');
        return;
    }
    
    const packageOnlyTest = await testPackageOnlyIntegration();
    if (!packageOnlyTest) {
        console.log('❌ Package only test failed');
    }
    
    const packageSummaryTest = await testPackageSummaryIntegration();
    if (!packageSummaryTest) {
        console.log('❌ Package summary test failed');
    }
    
    console.log('\n🎯 Test Summary:');
    console.log(`API Endpoint: ${apiTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Package Only: ${packageOnlyTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Package Summary: ${packageSummaryTest ? '✅ PASS' : '❌ FAIL'}`);
    
    if (apiTest && packageOnlyTest && packageSummaryTest) {
        console.log('\n🎉 All tests passed! Hotels integration is working correctly.');
    } else {
        console.log('\n⚠️ Some tests failed. Check the errors above.');
    }
}

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
    // Node.js environment
    const fetch = require('node-fetch');
    runAllTests();
} else {
    // Browser environment
    runAllTests();
}
