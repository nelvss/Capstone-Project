// Test script to verify hotel lookup functionality
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function testHotelLookup() {
  console.log('🧪 Testing hotel lookup...');
  
  try {
    // Test 1: Get hotel by ID
    const hotelId = '08e190f4-60da-4188-9c8b-de535ef3fcf2';
    console.log('📊 Looking up hotel with ID:', hotelId);
    
    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .select('hotel_id, name, description, base_price_per_night')
      .eq('hotel_id', hotelId)
      .single();
    
    if (hotelError) {
      console.error('❌ Hotel lookup error:', hotelError);
      return;
    }
    
    if (hotel) {
      console.log('✅ Hotel found:', hotel);
    } else {
      console.log('❌ No hotel found with that ID');
    }
    
    // Test 2: Get all hotels
    console.log('\n📊 Fetching all hotels...');
    const { data: hotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('hotel_id, name, description, base_price_per_night');
    
    if (hotelsError) {
      console.error('❌ Hotels fetch error:', hotelsError);
      return;
    }
    
    console.log('✅ All hotels:', hotels);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testHotelLookup();
