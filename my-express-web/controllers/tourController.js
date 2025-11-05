const supabase = require('../config/supabase');
const { uploadImageToStorage } = require('../utils/imageUpload');
const { normalizeTourId } = require('../utils/helpers');

const getTours = async (req, res) => {
  try {
    console.log('📊 Fetching tours...');
    
    const { data: tours, error: toursError } = await supabase
      .from('tour_only')
      .select('*')
      .order('category', { ascending: true });
    
    if (toursError) {
      console.error('❌ Error fetching tours:', toursError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch tours', 
        error: toursError.message 
      });
    }
    
    if (!tours || tours.length === 0) {
      return res.json({ 
        success: true, 
        tours: []
      });
    }
    
    const tourIds = tours.map(t => t.tour_only_id);
    
    const { data: pricing } = await supabase
      .from('tour_pricing')
      .select('*')
      .in('tour_only_id', tourIds)
      .order('min_tourist', { ascending: true });
    
    const { data: images } = await supabase
      .from('tour_images')
      .select('*')
      .in('tour_only_id', tourIds)
      .order('image_id', { ascending: true });
    
    const pricingByTour = {};
    (pricing || []).forEach(p => {
      if (!pricingByTour[p.tour_only_id]) {
        pricingByTour[p.tour_only_id] = [];
      }
      pricingByTour[p.tour_only_id].push(p);
    });
    
    const imagesByTour = {};
    (images || []).forEach(img => {
      if (!imagesByTour[img.tour_only_id]) {
        imagesByTour[img.tour_only_id] = [];
      }
      imagesByTour[img.tour_only_id].push(img);
    });
    
    const toursWithDetails = tours.map(tour => ({
      ...tour,
      pricing: pricingByTour[tour.tour_only_id] || [],
      images: imagesByTour[tour.tour_only_id] || []
    }));
    
    console.log('✅ Tours fetched successfully:', toursWithDetails.length, 'tours');
    
    res.json({ 
      success: true, 
      tours: toursWithDetails
    });
    
  } catch (error) {
    console.error('❌ Tours fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const createTour = async (req, res) => {
  try {
    const { category } = req.body;

    console.log('➕ Creating tour:', { category });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    const validCategories = ['Inland Tour', 'Snorkeling Tour', 'Island Tour'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    const insertData = {
      category: category.trim()
    };

    const { data, error } = await supabase
      .from('tour_only')
      .insert([insertData])
      .select('*');

    if (error) {
      console.error('❌ Error creating tour:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create tour',
        error: error.message
      });
    }

    const newTour = data[0];
    const tourWithDetails = {
      ...newTour,
      pricing: [],
      images: []
    };

    console.log('✅ Tour created successfully:', newTour.tour_only_id);

    res.json({
      success: true,
      message: 'Tour created successfully',
      tour: tourWithDetails
    });
  } catch (error) {
    console.error('❌ Tour creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const updateTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const normalizedTourId = normalizeTourId(tourId);
    const { category } = req.body;

    if (normalizedTourId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tour ID'
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    const validCategories = ['Inland Tour', 'Snorkeling Tour', 'Island Tour'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    const { data, error } = await supabase
      .from('tour_only')
      .update({ category: category.trim() })
      .eq('tour_only_id', normalizedTourId)
      .select('*');

    if (error) {
      console.error('❌ Error updating tour:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update tour',
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const updatedTour = data[0];

    const { data: pricing } = await supabase
      .from('tour_pricing')
      .select('*')
      .eq('tour_only_id', normalizedTourId)
      .order('min_tourist', { ascending: true });

    const { data: images } = await supabase
      .from('tour_images')
      .select('*')
      .eq('tour_only_id', normalizedTourId)
      .order('image_id', { ascending: true });

    const tourWithDetails = {
      ...updatedTour,
      pricing: pricing || [],
      images: images || []
    };

    console.log('✅ Tour updated successfully');

    res.json({
      success: true,
      message: 'Tour updated successfully',
      tour: tourWithDetails
    });
  } catch (error) {
    console.error('❌ Tour update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const deleteTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const normalizedTourId = normalizeTourId(tourId);

    if (normalizedTourId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tour ID'
      });
    }

    console.log('🗑️ Deleting tour:', normalizedTourId);

    const { data: existingTour, error: fetchError } = await supabase
      .from('tour_only')
      .select('tour_only_id, category')
      .eq('tour_only_id', normalizedTourId)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error checking tour existence:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify tour before deletion',
        error: fetchError.message
      });
    }

    if (!existingTour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    await supabase.from('tour_pricing').delete().eq('tour_only_id', normalizedTourId);
    await supabase.from('tour_images').delete().eq('tour_only_id', normalizedTourId);

    const { error: deleteError } = await supabase
      .from('tour_only')
      .delete()
      .eq('tour_only_id', normalizedTourId);

    if (deleteError) {
      console.error('❌ Error deleting tour:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete tour',
        error: deleteError.message
      });
    }

    console.log('✅ Tour deleted successfully:', normalizedTourId);

    res.json({
      success: true,
      message: 'Tour deleted successfully',
      deletedTour: {
        tour_only_id: existingTour.tour_only_id,
        category: existingTour.category
      }
    });
  } catch (error) {
    console.error('❌ Tour deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const addTourPricing = async (req, res) => {
  try {
    const { tourId } = req.params;
    const normalizedTourId = normalizeTourId(tourId);
    const { min_tourist, max_tourist, price_per_head } = req.body;

    if (normalizedTourId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tour ID'
      });
    }

    if (min_tourist === undefined || max_tourist === undefined || price_per_head === undefined) {
      return res.status(400).json({
        success: false,
        message: 'min_tourist, max_tourist, and price_per_head are required'
      });
    }

    const minTourist = parseInt(min_tourist);
    const maxTourist = parseInt(max_tourist);
    const pricePerHead = parseFloat(price_per_head);

    if (Number.isNaN(minTourist) || minTourist < 1 || Number.isNaN(maxTourist) || maxTourist < 1 || minTourist > maxTourist || Number.isNaN(pricePerHead) || pricePerHead < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pricing values'
      });
    }

    const insertData = {
      tour_only_id: normalizedTourId,
      min_tourist: minTourist,
      max_tourist: maxTourist,
      price_per_head: pricePerHead
    };

    const { data, error } = await supabase
      .from('tour_pricing')
      .insert([insertData])
      .select('*');

    if (error) {
      console.error('❌ Error creating tour pricing:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create tour pricing',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Tour pricing created successfully',
      pricing: data[0]
    });
  } catch (error) {
    console.error('❌ Tour pricing creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const updateTourPricing = async (req, res) => {
  try {
    const { tourId, pricingId } = req.params;
    const normalizedTourId = normalizeTourId(tourId);
    const normalizedPricingId = normalizeTourId(pricingId);
    const { min_tourist, max_tourist, price_per_head } = req.body;

    if (normalizedTourId === null || normalizedPricingId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tour ID or pricing ID'
      });
    }

    const updates = {};
    if (min_tourist !== undefined) updates.min_tourist = parseInt(min_tourist);
    if (max_tourist !== undefined) updates.max_tourist = parseInt(max_tourist);
    if (price_per_head !== undefined) updates.price_per_head = parseFloat(price_per_head);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided for update'
      });
    }

    const { data, error } = await supabase
      .from('tour_pricing')
      .update(updates)
      .eq('pricing_id', normalizedPricingId)
      .eq('tour_only_id', normalizedTourId)
      .select('*');

    if (error) {
      console.error('❌ Error updating tour pricing:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update tour pricing',
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour pricing not found'
      });
    }

    res.json({
      success: true,
      message: 'Tour pricing updated successfully',
      pricing: data[0]
    });
  } catch (error) {
    console.error('❌ Tour pricing update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const deleteTourPricing = async (req, res) => {
  try {
    const { tourId, pricingId } = req.params;
    const normalizedTourId = normalizeTourId(tourId);
    const normalizedPricingId = normalizeTourId(pricingId);

    if (normalizedTourId === null || normalizedPricingId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tour ID or pricing ID'
      });
    }

    const { error } = await supabase
      .from('tour_pricing')
      .delete()
      .eq('pricing_id', normalizedPricingId)
      .eq('tour_only_id', normalizedTourId);

    if (error) {
      console.error('❌ Error deleting tour pricing:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete tour pricing',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Tour pricing deleted successfully'
    });
  } catch (error) {
    console.error('❌ Tour pricing deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const uploadTourImage = async (req, res) => {
  try {
    const { tourId } = req.params;
    const normalizedTourId = normalizeTourId(tourId);
    const { imageData, fileName } = req.body;

    if (normalizedTourId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tour ID'
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
      bucket: 'tour-images',
      keyPrefix: 'tours',
      identifier: `tour-${normalizedTourId}`
    });

    const { data, error } = await supabase
      .from('tour_images')
      .insert([{
        tour_only_id: normalizedTourId,
        image_url: publicUrl
      }])
      .select('*');

    if (error) {
      console.error('❌ Error saving tour image:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to store tour image',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Tour image uploaded successfully',
      imageUrl: publicUrl,
      fileName: filePath,
      image: data[0]
    });
  } catch (error) {
    console.error('❌ Tour image upload error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 400 ? error.message : 'Internal server error',
      error: error.details?.message || error.message
    });
  }
};

const deleteTourImage = async (req, res) => {
  try {
    const { tourId, imageId } = req.params;
    const normalizedTourId = normalizeTourId(tourId);
    const normalizedImageId = normalizeTourId(imageId);

    if (normalizedTourId === null || normalizedImageId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tour ID or image ID'
      });
    }

    const { error } = await supabase
      .from('tour_images')
      .delete()
      .eq('image_id', normalizedImageId)
      .eq('tour_only_id', normalizedTourId);

    if (error) {
      console.error('❌ Error deleting tour image:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete tour image',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Tour image deleted successfully'
    });
  } catch (error) {
    console.error('❌ Tour image deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getTours,
  createTour,
  updateTour,
  deleteTour,
  addTourPricing,
  updateTourPricing,
  deleteTourPricing,
  uploadTourImage,
  deleteTourImage
};

