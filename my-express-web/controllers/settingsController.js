const supabase = require('../config/supabase');

const getSiteContent = async (req, res) => {
  try {
    console.log('📊 Fetching site content...');
    
    const { data, error } = await supabase
      .from('site_content')
      .select('section_key, content')
      .order('section_key');
    
    if (error) {
      if (error.code === 'PGRST116' || error.code === 'PGRST205' || 
          error.message?.includes('does not exist') || 
          error.message?.includes('Could not find the table') ||
          (error.message?.includes('relation') && error.message?.includes('does not exist'))) {
        console.warn('⚠️ site_content table does not exist. Returning empty array. Please run database_settings_schema.sql in Supabase.');
        return res.json({ 
          success: true, 
          content: []
        });
      }
      
      console.error('❌ Error fetching site content:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch site content', 
        error: error.message 
      });
    }
    
    console.log('✅ Site content fetched successfully:', data?.length || 0, 'sections');
    
    res.json({ 
      success: true, 
      content: data || []
    });
    
  } catch (error) {
    console.error('❌ Site content fetch error:', error);
    res.json({ 
      success: true, 
      content: []
    });
  }
};

module.exports = {
  getSiteContent
};

