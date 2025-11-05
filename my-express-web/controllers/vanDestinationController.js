const supabase = require('../config/supabase');

const getVanDestinations = async (req, res) => {
  try {
    console.log('📊 Fetching van destinations...');
    
    const { data, error } = await supabase
      .from('van_destinations')
      .select('*')
      .order('destination_name');
    
    if (error) {
      console.error('❌ Error fetching van destinations:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch van destinations', 
        error: error.message 
      });
    }
    
    console.log('✅ Van destinations fetched successfully:', data?.length || 0, 'destinations');
    
    res.json({ 
      success: true, 
      destinations: data || []
    });
    
  } catch (error) {
    console.error('❌ Van destinations fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const createVanDestination = async (req, res) => {
  try {
    const { location_type, destination_name, oneway_price, roundtrip_price } = req.body;

    console.log('➕ Creating van destination:', { location_type, destination_name, oneway_price, roundtrip_price });

    if (!destination_name) {
      return res.status(400).json({
        success: false,
        message: 'Destination name is required'
      });
    }

    const insertData = {
      destination_name: destination_name.trim()
    };

    if (oneway_price !== undefined && oneway_price !== null && oneway_price !== '') {
      const parsedOnewayPrice = parseFloat(oneway_price);
      if (Number.isNaN(parsedOnewayPrice) || parsedOnewayPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'oneway_price must be a non-negative number'
        });
      }
      insertData.oneway_price = parsedOnewayPrice;
    } else {
      insertData.oneway_price = 0;
    }

    if (roundtrip_price !== undefined && roundtrip_price !== null && roundtrip_price !== '') {
      const parsedRoundtripPrice = parseFloat(roundtrip_price);
      if (Number.isNaN(parsedRoundtripPrice) || parsedRoundtripPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'roundtrip_price must be a non-negative number'
        });
      }
      insertData.roundtrip_price = parsedRoundtripPrice;
    } else {
      insertData.roundtrip_price = 0;
    }

    if (location_type !== undefined && location_type !== null) {
      insertData.location_type = location_type.trim();
    }

    const { data, error } = await supabase
      .from('van_destinations')
      .insert([insertData])
      .select('*');

    if (error) {
      console.error('❌ Error creating van destination:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create van destination',
        error: error.message
      });
    }

    console.log('✅ Van destination created successfully:', data[0]);

    res.json({
      success: true,
      message: 'Van destination created successfully',
      destination: data[0]
    });
  } catch (error) {
    console.error('❌ Van destination creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const updateVanDestination = async (req, res) => {
  try {
    const { destinationId } = req.params;

    if (!destinationId || destinationId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Invalid van destination ID'
      });
    }

    const { location_type, destination_name, oneway_price, roundtrip_price } = req.body;
    const updates = {};

    if (location_type !== undefined) {
      updates.location_type = location_type !== null ? location_type.toString().trim() : null;
    }

    if (destination_name !== undefined) {
      updates.destination_name = destination_name.toString().trim();
    }

    if (oneway_price !== undefined) {
      const parsedPrice = parseFloat(oneway_price);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'oneway_price must be a non-negative number'
        });
      }
      updates.oneway_price = parsedPrice;
    }

    if (roundtrip_price !== undefined) {
      const parsedPrice = parseFloat(roundtrip_price);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'roundtrip_price must be a non-negative number'
        });
      }
      updates.roundtrip_price = parsedPrice;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided for update'
      });
    }

    const { data, error } = await supabase
      .from('van_destinations')
      .update(updates)
      .eq('van_destination_id', destinationId.trim())
      .select('*');

    if (error) {
      console.error('❌ Error updating van destination:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update van destination',
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Van destination not found'
      });
    }

    console.log('✅ Van destination update result:', data);

    res.json({
      success: true,
      message: 'Van destination updated successfully',
      destination: data[0]
    });
  } catch (error) {
    console.error('❌ Van destination update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const deleteVanDestination = async (req, res) => {
  try {
    const { destinationId } = req.params;

    if (!destinationId || destinationId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Invalid van destination ID'
      });
    }

    console.log('🗑️ Deleting van destination:', destinationId.trim());

    const { data: existingDestination, error: fetchError } = await supabase
      .from('van_destinations')
      .select('van_destination_id, destination_name')
      .eq('van_destination_id', destinationId.trim())
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error checking van destination existence:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify van destination before deletion',
        error: fetchError.message
      });
    }

    if (!existingDestination) {
      return res.status(404).json({
        success: false,
        message: 'Van destination not found'
      });
    }

    const { error: deleteError } = await supabase
      .from('van_destinations')
      .delete()
      .eq('van_destination_id', destinationId.trim());

    if (deleteError) {
      console.error('❌ Error deleting van destination:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete van destination',
        error: deleteError.message
      });
    }

    console.log('✅ Van destination deleted successfully:', existingDestination.destination_name || destinationId);

    res.json({
      success: true,
      message: 'Van destination deleted successfully',
      deletedDestination: {
        van_destination_id: existingDestination.van_destination_id,
        destination_name: existingDestination.destination_name
      }
    });
  } catch (error) {
    console.error('❌ Van destination deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getVanDestinations,
  createVanDestination,
  updateVanDestination,
  deleteVanDestination
};

