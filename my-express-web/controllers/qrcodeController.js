const supabase = require('../config/supabase');
const { uploadImageToStorage } = require('../utils/imageUpload');
const { normalizeQrcodeId } = require('../utils/helpers');

const getQrcodes = async (req, res) => {
  try {
    console.log('📊 Fetching QRCode records...');
    
    const { data, error } = await supabase
      .from('qrcode')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching QRCode records:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch QRCode records', 
        error: error.message 
      });
    }
    
    console.log('✅ QRCode records fetched successfully:', data?.length || 0, 'records');
    
    res.json({ 
      success: true, 
      qrcode: data || []
    });
    
  } catch (error) {
    console.error('❌ QRCode records fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const createQrcode = async (req, res) => {
  try {
    const { name } = req.body;

    console.log('➕ Creating QRCode record:', { name });

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const validNames = ['GCash', 'Paymaya', 'Online Banking'];
    if (!validNames.includes(name)) {
      return res.status(400).json({
        success: false,
        message: `Name must be one of: ${validNames.join(', ')}`
      });
    }

    const insertData = {
      name: name.trim(),
      qrcode_image: ''
    };

    const { data, error } = await supabase
      .from('qrcode')
      .insert([insertData])
      .select('*');

    if (error) {
      console.error('❌ Error creating QRCode record:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create QRCode record',
        error: error.message
      });
    }

    console.log('✅ QRCode record created successfully:', data[0]);

    res.json({
      success: true,
      message: 'QRCode record created successfully',
      qrcode: data[0]
    });
  } catch (error) {
    console.error('❌ QRCode record creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const updateQrcode = async (req, res) => {
  try {
    const { qrcodeId } = req.params;
    const normalizedQrcodeId = normalizeQrcodeId(qrcodeId);

    if (normalizedQrcodeId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QRCode ID'
      });
    }

    const { name, qrcode_image } = req.body;
    const updates = {};

    if (name !== undefined) {
      const validNames = ['GCash', 'Paymaya', 'Online Banking'];
      if (!validNames.includes(name)) {
        return res.status(400).json({
          success: false,
          message: `Name must be one of: ${validNames.join(', ')}`
        });
      }
      updates.name = name.toString().trim();
    }

    if (qrcode_image !== undefined) {
      updates.qrcode_image = qrcode_image;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided for update'
      });
    }

    const { data, error } = await supabase
      .from('qrcode')
      .update(updates)
      .eq('qrcode_id', normalizedQrcodeId)
      .select('*');

    if (error) {
      console.error('❌ Error updating QRCode record:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update QRCode record',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'QRCode record updated successfully',
      qrcode: data[0]
    });
  } catch (error) {
    console.error('❌ QRCode record update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const uploadQrcodeImage = async (req, res) => {
  try {
    const { qrcodeId } = req.params;
    const normalizedQrcodeId = normalizeQrcodeId(qrcodeId);
    const { imageData, fileName } = req.body;

    if (normalizedQrcodeId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QRCode ID'
      });
    }

    if (!imageData || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'Missing image data or filename'
      });
    }

    const { data: existingQrcode, error: checkError } = await supabase
      .from('qrcode')
      .select('qrcode_id, name')
      .eq('qrcode_id', normalizedQrcodeId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking QRCode existence:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify QRCode record',
        error: checkError.message
      });
    }

    if (!existingQrcode) {
      return res.status(404).json({
        success: false,
        message: 'QRCode record not found'
      });
    }

    let publicUrl, filePath;
    try {
      const uploadResult = await uploadImageToStorage({
        imageData,
        fileName,
        bucket: 'qrcode-image',
        keyPrefix: 'qrcode',
        identifier: `qrcode-${normalizedQrcodeId}`
      });
      publicUrl = uploadResult.publicUrl;
      filePath = uploadResult.filePath;
    } catch (uploadError) {
      console.error('❌ Storage upload failed:', uploadError);
      
      if (uploadError.details?.message?.includes('Bucket') || uploadError.message?.includes('Bucket')) {
        return res.status(500).json({
          success: false,
          message: 'Storage bucket "qrcode-image" not found. Please create it in Supabase Storage with public access.',
          error: uploadError.details?.message || uploadError.message
        });
      }
      
      throw uploadError;
    }

    const { data, error } = await supabase
      .from('qrcode')
      .update({ qrcode_image: publicUrl })
      .eq('qrcode_id', normalizedQrcodeId)
      .select('*');

    if (error) {
      console.error('❌ Error saving QRCode image URL:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to store QRCode image URL in database',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'QRCode image uploaded successfully',
      imageUrl: publicUrl,
      fileName: filePath,
      qrcode: data[0]
    });
  } catch (error) {
    console.error('❌ QRCode image upload error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 400 ? error.message : 'Internal server error',
      error: error.details?.message || error.message
    });
  }
};

const deleteQrcode = async (req, res) => {
  try {
    const { qrcodeId } = req.params;
    const normalizedQrcodeId = normalizeQrcodeId(qrcodeId);

    if (normalizedQrcodeId === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QRCode ID'
      });
    }

    console.log('🗑️ Deleting QRCode record:', normalizedQrcodeId);

    const { data: existingQrcode, error: fetchError } = await supabase
      .from('qrcode')
      .select('qrcode_id, name')
      .eq('qrcode_id', normalizedQrcodeId)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error checking QRCode record existence:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify QRCode record before deletion',
        error: fetchError.message
      });
    }

    if (!existingQrcode) {
      return res.status(404).json({
        success: false,
        message: 'QRCode record not found'
      });
    }

    const { error: deleteError } = await supabase
      .from('qrcode')
      .delete()
      .eq('qrcode_id', normalizedQrcodeId);

    if (deleteError) {
      console.error('❌ Error deleting QRCode record:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete QRCode record',
        error: deleteError.message
      });
    }

    console.log('✅ QRCode record deleted successfully:', existingQrcode.name || normalizedQrcodeId);

    res.json({
      success: true,
      message: 'QRCode record deleted successfully',
      deletedQrcode: {
        qrcode_id: existingQrcode.qrcode_id,
        name: existingQrcode.name
      }
    });
  } catch (error) {
    console.error('❌ QRCode record deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getQrcodesForSettings = async (req, res) => {
  try {
    console.log('📊 Fetching QR codes for payment methods...');
    
    const { data, error } = await supabase
      .from('qrcode')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching QR codes:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch QR codes', 
        error: error.message 
      });
    }
    
    const nameToPaymentMethod = {
      'GCash': 'gcash',
      'Paymaya': 'paymaya',
      'Online Banking': 'banking'
    };
    
    const qrCodes = (data || []).map(qrcode => ({
      payment_method: nameToPaymentMethod[qrcode.name] || qrcode.name.toLowerCase(),
      qr_image_url: qrcode.qrcode_image || '',
      name: qrcode.name,
      qrcode_id: qrcode.qrcode_id
    }));
    
    console.log('✅ QR codes fetched successfully:', qrCodes.length, 'codes');
    
    res.json({ 
      success: true, 
      qr_codes: qrCodes
    });
    
  } catch (error) {
    console.error('❌ QR codes fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

module.exports = {
  getQrcodes,
  createQrcode,
  updateQrcode,
  uploadQrcodeImage,
  deleteQrcode,
  getQrcodesForSettings
};

