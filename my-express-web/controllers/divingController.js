const supabase = require('../config/supabase');
const { uploadImageToStorage } = require('../utils/imageUpload');
const { normalizeDivingId, fixDivingImageUrl } = require('../utils/helpers');

const getDiving = async (req, res) => {
  try {
    console.log('📊 Fetching diving records...');
    
    const { data, error } = await supabase
      .from('diving')
      .select('*');
    
    if (error) {
      console.error('❌ Error fetching diving records:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch diving records', 
        error: error.message 
      });
    }
    
    // Fetch images for each diving record
    const divingRecords = await Promise.all((data || []).map(async (diving) => {
      const { data: images } = await supabase
        .from('diving_images')
        .select('*')
        .eq('diving_id', diving.diving_id)
        .order('created_at', { ascending: true });
      
      diving.images = images || [];
      
      // Keep backward compatibility with diving_image field
      if (diving.diving_image) {
        diving.diving_image = fixDivingImageUrl(diving.diving_image);
      }
      
      return diving;
    }));
    
    console.log('✅ Diving records fetched successfully:', divingRecords.length, 'records');
    
    res.json({ 
      success: true, 
      diving: divingRecords
    });
    
  } catch (error) {
    console.error('❌ Diving records fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const createDiving = async (req, res) => {
  try {
    const { name, price_per_head } = req.body;

    console.log('➕ Creating diving record:', { name, price_per_head });

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Diving name is required'
      });
    }

    if (price_per_head === undefined || price_per_head === null) {
      return res.status(400).json({
        success: false,
        message: 'Price per head is required'
      });
    }

    const parsedPrice = parseFloat(price_per_head);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'price_per_head must be a non-negative number'
      });
    }

    const insertData = {
      name: name.trim(),
      price_per_head: parsedPrice,
      diving_image: ''
    };

    const { data, error } = await supabase
      .from('diving')
      .insert([insertData])
      .select('*');

    if (error) {
      console.error('❌ Error creating diving record:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create diving record',
        error: error.message
      });
    }

    console.log('✅ Diving record created successfully:', data[0]);

    res.json({
      success: true,
      message: 'Diving record created successfully',
      diving: data[0]
    });
  } catch (error) {
    console.error('❌ Diving record creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const updateDiving = async (req, res) => {
  try {
    const { divingId } = req.params;
    const normalizedDivingId = normalizeDivingId(divingId);

    if (normalizedDivingId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid diving ID'
      });
    }

    const { name, price_per_head, diving_image } = req.body;
    const updates = {};

    if (name !== undefined) {
      updates.name = name.toString().trim();
    }

    if (price_per_head !== undefined) {
      const parsedPrice = parseFloat(price_per_head);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'price_per_head must be a non-negative number'
        });
      }
      updates.price_per_head = parsedPrice;
    }

    if (diving_image !== undefined) {
      updates.diving_image = diving_image;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided for update'
      });
    }

    const { data, error } = await supabase
      .from('diving')
      .update(updates)
      .eq('diving_id', normalizedDivingId)
      .select('*');

    if (error) {
      console.error('❌ Error updating diving record:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update diving record',
        error: error.message
      });
    }

    const updatedDiving = data[0];
    if (updatedDiving && updatedDiving.diving_image) {
      updatedDiving.diving_image = fixDivingImageUrl(updatedDiving.diving_image);
    }

    res.json({
      success: true,
      message: 'Diving record updated successfully',
      diving: updatedDiving
    });
  } catch (error) {
    console.error('❌ Diving record update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const uploadDivingImage = async (req, res) => {
  try {
    const { divingId } = req.params;
    const normalizedDivingId = normalizeDivingId(divingId);
    const { imageData, fileName } = req.body;

    if (normalizedDivingId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid diving ID'
      });
    }

    if (!imageData || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'Missing image data or filename'
      });
    }

    const { publicUrl, filePath } = await uploadImageToStorage({
      imageData,
      fileName,
      bucket: 'diving-image',
      keyPrefix: 'diving',
      identifier: `diving-${normalizedDivingId}`
    });

    // Insert into diving_images table
    const { data: imageData_db, error: imageError } = await supabase
      .from('diving_images')
      .insert([{
        diving_id: normalizedDivingId,
        image_url: publicUrl
      }])
      .select('*');

    if (imageError) {
      console.error('❌ Error saving diving image:', imageError);
      return res.status(500).json({
        success: false,
        message: 'Failed to store diving image',
        error: imageError.message
      });
    }

    // Also update the main diving_image field for backward compatibility
    await supabase
      .from('diving')
      .update({ diving_image: publicUrl })
      .eq('diving_id', normalizedDivingId);

    // Fetch updated diving record with all images
    const { data: divingData } = await supabase
      .from('diving')
      .select('*')
      .eq('diving_id', normalizedDivingId)
      .single();

    const { data: images } = await supabase
      .from('diving_images')
      .select('*')
      .eq('diving_id', normalizedDivingId)
      .order('created_at', { ascending: true });

    if (divingData) {
      divingData.images = images || [];
    }

    res.json({
      success: true,
      message: 'Diving image uploaded successfully',
      imageUrl: publicUrl,
      fileName: filePath,
      image: imageData_db[0],
      diving: divingData
    });
  } catch (error) {
    console.error('❌ Diving image upload error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 400 ? error.message : 'Internal server error',
      error: error.details?.message || error.message
    });
  }
};

const deleteDiving = async (req, res) => {
  try {
    const { divingId } = req.params;
    const normalizedDivingId = normalizeDivingId(divingId);

    if (normalizedDivingId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid diving ID'
      });
    }

    console.log('🗑️ Deleting diving record:', normalizedDivingId);

    const { data: existingDiving, error: fetchError } = await supabase
      .from('diving')
      .select('diving_id, diving_image, name')
      .eq('diving_id', normalizedDivingId)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error checking diving record existence:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify diving record before deletion',
        error: fetchError.message
      });
    }

    if (!existingDiving) {
      return res.status(404).json({
        success: false,
        message: 'Diving record not found'
      });
    }

    const { error: deleteError } = await supabase
      .from('diving')
      .delete()
      .eq('diving_id', normalizedDivingId);

    if (deleteError) {
      console.error('❌ Error deleting diving record:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete diving record',
        error: deleteError.message
      });
    }

    console.log('✅ Diving record deleted successfully:', existingDiving.name || normalizedDivingId);

    res.json({
      success: true,
      message: 'Diving record deleted successfully',
      deletedDiving: {
        diving_id: existingDiving.diving_id,
        name: existingDiving.name
      }
    });
  } catch (error) {
    console.error('❌ Diving record deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const deleteDivingImage = async (req, res) => {
  try {
    const { divingId, imageId } = req.params;
    const normalizedDivingId = normalizeDivingId(divingId);
    const normalizedImageId = normalizeDivingId(imageId);

    if (normalizedDivingId === null || normalizedImageId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid diving ID or image ID'
      });
    }

    const { error } = await supabase
      .from('diving_images')
      .delete()
      .eq('image_id', normalizedImageId)
      .eq('diving_id', normalizedDivingId);

    if (error) {
      console.error('❌ Error deleting diving image:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete diving image',
        error: error.message
      });
    }

    console.log('✅ Diving image deleted successfully');

    res.json({
      success: true,
      message: 'Diving image deleted successfully'
    });
  } catch (error) {
    console.error('❌ Diving image deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getDiving,
  createDiving,
  updateDiving,
  uploadDivingImage,
  deleteDiving,
  deleteDivingImage
};


