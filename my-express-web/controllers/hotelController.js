const supabase = require('../config/supabase');

const getHotels = async (req, res) => {
  try {
    console.log('📊 Fetching hotels...');
    
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching hotels:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch hotels', 
        error: error.message 
      });
    }
    
    console.log('✅ Hotels fetched successfully:', data?.length || 0, 'hotels');
    
    res.json({ 
      success: true, 
      hotels: data || []
    });
    
  } catch (error) {
    console.error('❌ Hotels fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

module.exports = { getHotels };

