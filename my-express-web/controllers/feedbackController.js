const supabase = require('../config/supabase');
const { uploadImageToStorage } = require('../utils/imageUpload');

const submitFeedback = async (req, res) => {
  try {
    const { message, rating, images } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required' 
      });
    }
    
    // Validate rating if provided (must be between 1-5)
    if (rating !== undefined && rating !== null) {
      const ratingNum = parseInt(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ 
          success: false, 
          message: 'Rating must be between 1 and 5' 
        });
      }
    }
    
    console.log('📝 Submitting feedback:', { 
      message: message.trim(), 
      rating: rating || 'not provided',
      imageCount: images ? images.length : 0,
      hasImages: !!images,
      imagesType: Array.isArray(images) ? 'array' : typeof images
    });
    
    // Debug: Log first image structure if available
    if (images && Array.isArray(images) && images.length > 0) {
      console.log('📸 First image structure:', {
        hasData: !!images[0].data,
        dataLength: images[0].data ? images[0].data.length : 0,
        dataPrefix: images[0].data ? images[0].data.substring(0, 50) : 'none',
        hasFileName: !!images[0].fileName,
        fileName: images[0].fileName
      });
    }
    
    // Build feedback object
    const feedbackData = {
      anonymous_name: 'Anonymous',
      message: message.trim(),
      date: new Date().toISOString()
    };
    
    // Add rating only if provided
    if (rating !== undefined && rating !== null) {
      feedbackData.rating = parseInt(rating);
    }
    
    // Handle multiple image uploads if provided
    if (images && Array.isArray(images) && images.length > 0) {
      const uploadedUrls = [];
      const uploadErrors = [];
      
      console.log(`📤 Attempting to upload ${images.length} image(s) to feedback-images bucket`);
      
      for (let i = 0; i < images.length; i++) {
        const imageItem = images[i];
        try {
          console.log(`📤 Uploading image ${i + 1}/${images.length}: ${imageItem.fileName}`);
          
          if (!imageItem.data || !imageItem.fileName) {
            throw new Error(`Image ${i + 1} is missing data or filename`);
          }
          
          const uploadResult = await uploadImageToStorage({
            imageData: imageItem.data,
            fileName: imageItem.fileName,
            bucket: 'feedback-images',
            keyPrefix: 'feedback',
            identifier: 'feedback'
          });
          
          uploadedUrls.push(uploadResult.publicUrl);
          console.log(`✅ Image ${i + 1} uploaded successfully:`, uploadResult.publicUrl);
        } catch (uploadError) {
          const errorMessage = uploadError.details?.message || uploadError.message || 'Unknown error';
          console.error(`❌ Image ${i + 1} upload error:`, {
            fileName: imageItem?.fileName,
            error: errorMessage,
            details: uploadError.details
          });
          uploadErrors.push({
            imageIndex: i + 1,
            fileName: imageItem?.fileName,
            error: errorMessage
          });
        }
      }
      
      // Store image URLs as JSON array in image_url field
      if (uploadedUrls.length > 0) {
        feedbackData.image_url = JSON.stringify(uploadedUrls);
        console.log(`✅ Successfully uploaded ${uploadedUrls.length}/${images.length} image(s)`);
      } else {
        console.error('❌ All image uploads failed!', uploadErrors);
        // Return error if all uploads failed
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images. Please check bucket configuration.',
          errors: uploadErrors
        });
      }
      
      // Warn if some uploads failed
      if (uploadErrors.length > 0 && uploadedUrls.length > 0) {
        console.warn(`⚠️ ${uploadErrors.length} image(s) failed to upload, but ${uploadedUrls.length} succeeded`);
      }
    }
    
    const { data, error } = await supabase
      .from('feedback')
      .insert([feedbackData])
      .select();
    
    if (error) {
      console.error('❌ Error inserting feedback:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to submit feedback',
        error: error.message 
      });
    }
    
    console.log('✅ Feedback submitted successfully:', data);
    
    res.json({ 
      success: true, 
      message: 'Feedback submitted successfully',
      feedback_id: data[0]?.feedback_id
    });
    
  } catch (error) {
    console.error('❌ Feedback submission error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const getFeedback = async (req, res) => {
  try {
    console.log('📝 Fetching feedback from Supabase...');
    
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching feedback:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch feedback',
        error: error.message 
      });
    }
    
    console.log('✅ Feedback fetched successfully:', data?.length || 0, 'items');
    
    res.json({ 
      success: true, 
      feedback: data || []
    });
    
  } catch (error) {
    console.error('❌ Feedback fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`📝 Updating feedback status for ID: ${id} to: ${status}`);
    
    res.json({ 
      success: true, 
      message: 'Feedback status updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating feedback status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📝 Deleting feedback with ID: ${id}`);
    
    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('feedback_id', id);
    
    if (error) {
      console.error('❌ Error deleting feedback:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete feedback',
        error: error.message 
      });
    }
    
    console.log('✅ Feedback deleted successfully');
    
    res.json({ 
      success: true, 
      message: 'Feedback deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Feedback deletion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

module.exports = {
  submitFeedback,
  getFeedback,
  updateFeedbackStatus,
  deleteFeedback
};

