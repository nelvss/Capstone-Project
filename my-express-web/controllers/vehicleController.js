const supabase = require('../config/supabase');
const { uploadImageToStorage } = require('../utils/imageUpload');
const { normalizeVehicleId, fixVehicleImageUrl } = require('../utils/helpers');

const getVehicles = async (req, res) => {
  try {
    console.log('📊 Fetching vehicles...');
    
    const { data, error } = await supabase
      .from('vehicles')
      .select('*');
    
    if (error) {
      console.error('❌ Error fetching vehicles:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch vehicles', 
        error: error.message 
      });
    }
    
    const vehicles = (data || []).map(vehicle => {
      if (vehicle.vehicle_image) {
        vehicle.vehicle_image = fixVehicleImageUrl(vehicle.vehicle_image);
      }
      return vehicle;
    });
    
    console.log('✅ Vehicles fetched successfully:', vehicles.length, 'vehicles');
    
    res.json({ 
      success: true, 
      vehicles: vehicles
    });
    
  } catch (error) {
    console.error('❌ Vehicles fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const createVehicle = async (req, res) => {
  try {
    const { name, price_per_day, description } = req.body;

    console.log('➕ Creating vehicle:', { name, price_per_day, description });

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle name is required'
      });
    }

    if (price_per_day === undefined || price_per_day === null) {
      return res.status(400).json({
        success: false,
        message: 'Price per day is required'
      });
    }

    const parsedPrice = parseFloat(price_per_day);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'price_per_day must be a non-negative number'
      });
    }

    const insertData = {
      name: name.trim(),
      price_per_day: parsedPrice,
      vehicle_image: ''
    };

    if (description !== undefined && description !== null) {
      insertData.description = description;
    }

    const { data, error } = await supabase
      .from('vehicles')
      .insert([insertData])
      .select('*');

    if (error) {
      console.error('❌ Error creating vehicle:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create vehicle',
        error: error.message
      });
    }

    console.log('✅ Vehicle created successfully:', data[0]);

    res.json({
      success: true,
      message: 'Vehicle created successfully',
      vehicle: data[0]
    });
  } catch (error) {
    console.error('❌ Vehicle creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const normalizedVehicleId = normalizeVehicleId(vehicleId);

    if (normalizedVehicleId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    const { name, price_per_day, description, vehicle_image } = req.body;
    const updates = {};

    if (name !== undefined) {
      updates.name = name.toString().trim();
    }

    if (price_per_day !== undefined) {
      const parsedPrice = parseFloat(price_per_day);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'price_per_day must be a non-negative number'
        });
      }
      updates.price_per_day = parsedPrice;
    }

    if (description !== undefined) {
      updates.description = description;
    }

    if (vehicle_image !== undefined) {
      updates.vehicle_image = vehicle_image;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided for update'
      });
    }

    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('vehicle_id', normalizedVehicleId)
      .select('*');

    if (error) {
      console.error('❌ Error updating vehicle:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update vehicle',
        error: error.message
      });
    }

    const updatedVehicle = data[0];
    if (updatedVehicle && updatedVehicle.vehicle_image) {
      updatedVehicle.vehicle_image = fixVehicleImageUrl(updatedVehicle.vehicle_image);
    }

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle
    });
  } catch (error) {
    console.error('❌ Vehicle update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const uploadVehicleImage = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const normalizedVehicleId = normalizeVehicleId(vehicleId);
    const { imageData, fileName } = req.body;

    if (normalizedVehicleId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
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
      bucket: 'vehicle-rental',
      keyPrefix: 'vehicles',
      identifier: `vehicle-${normalizedVehicleId}`
    });

    const { data, error } = await supabase
      .from('vehicles')
      .update({ vehicle_image: publicUrl })
      .eq('vehicle_id', normalizedVehicleId)
      .select('*');

    if (error) {
      console.error('❌ Error saving vehicle image URL:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to store vehicle image URL',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Vehicle image uploaded successfully',
      imageUrl: publicUrl,
      fileName: filePath,
      vehicle: data[0]
    });
  } catch (error) {
    console.error('❌ Vehicle image upload error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 400 ? error.message : 'Internal server error',
      error: error.details?.message || error.message
    });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const normalizedVehicleId = normalizeVehicleId(vehicleId);

    if (normalizedVehicleId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    console.log('🗑️ Deleting vehicle:', normalizedVehicleId);

    const { data: existingVehicle, error: fetchError } = await supabase
      .from('vehicles')
      .select('vehicle_id, vehicle_image, name')
      .eq('vehicle_id', normalizedVehicleId)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error checking vehicle existence:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify vehicle before deletion',
        error: fetchError.message
      });
    }

    if (!existingVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    const { error: deleteError } = await supabase
      .from('vehicles')
      .delete()
      .eq('vehicle_id', normalizedVehicleId);

    if (deleteError) {
      console.error('❌ Error deleting vehicle:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete vehicle',
        error: deleteError.message
      });
    }

    console.log('✅ Vehicle deleted successfully:', existingVehicle.name || normalizedVehicleId);

    res.json({
      success: true,
      message: 'Vehicle deleted successfully',
      deletedVehicle: {
        vehicle_id: existingVehicle.vehicle_id,
        name: existingVehicle.name
      }
    });
  } catch (error) {
    console.error('❌ Vehicle deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getVehicles,
  createVehicle,
  updateVehicle,
  uploadVehicleImage,
  deleteVehicle
};

