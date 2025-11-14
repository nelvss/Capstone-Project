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
    
    // Validate that ID exists and is not empty
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Feedback ID is required'
      });
    }
    
    // Ensure ID is a string (UUIDs must be strings, not numbers)
    // Convert to string and trim whitespace
    const feedbackId = String(id).trim();
    
    if (feedbackId === '') {
      return res.status(400).json({
        success: false,
        message: 'Feedback ID cannot be empty'
      });
    }
    
    console.log(`📝 Deleting feedback with ID: ${feedbackId} (type: ${typeof feedbackId})`);
    
    // First, fetch the feedback to get image URLs before deleting
    const { data: existingFeedback, error: fetchError } = await supabase
      .from('feedback')
      .select('feedback_id, image_url')
      .eq('feedback_id', feedbackId)
      .maybeSingle();
    
    if (fetchError) {
      console.error('❌ Error fetching feedback before deletion:', fetchError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch feedback before deletion',
        error: fetchError.message 
      });
    }
    
    if (!existingFeedback) {
      return res.status(404).json({ 
        success: false, 
        message: 'Feedback not found'
      });
    }
    
    // Delete images from storage if they exist
    if (existingFeedback.image_url) {
      try {
        let imageUrls = [];
        
        // Parse image_url if it's a JSON string
        if (typeof existingFeedback.image_url === 'string') {
          try {
            imageUrls = JSON.parse(existingFeedback.image_url);
          } catch (parseError) {
            // If parsing fails, treat it as a single URL string
            imageUrls = [existingFeedback.image_url];
          }
        } else if (Array.isArray(existingFeedback.image_url)) {
          imageUrls = existingFeedback.image_url;
        }
        
        if (imageUrls && imageUrls.length > 0) {
          console.log(`🗑️ Deleting ${imageUrls.length} image(s) from storage...`);
          
          // Extract file paths from URLs
          const filePaths = imageUrls.map(url => {
            try {
              // Extract the file path from the full URL
              // URL format: https://[project].supabase.co/storage/v1/object/public/feedback-images/[filename]
              const urlObj = new URL(url);
              const pathParts = urlObj.pathname.split('/');
              // Find the index of 'feedback-images' and get everything after it
              const bucketIndex = pathParts.indexOf('feedback-images');
              if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
                // Get the file path after the bucket name (handles nested paths)
                return pathParts.slice(bucketIndex + 1).join('/');
              }
              // Fallback: just get the last part
              const fileName = pathParts[pathParts.length - 1];
              // Remove query parameters if any
              return fileName.split('?')[0];
            } catch (urlError) {
              // If URL parsing fails, try simple string split
              const urlParts = url.split('/');
              const fileName = urlParts[urlParts.length - 1];
              return fileName ? fileName.split('?')[0] : null;
            }
          }).filter(fileName => fileName); // Remove any empty values
          
          if (filePaths.length > 0) {
            // Delete all images from storage
            const { error: storageError } = await supabase.storage
              .from('feedback-images')
              .remove(filePaths);
            
            if (storageError) {
              console.warn('⚠️ Warning: Could not delete some images from storage:', storageError.message);
              // Continue with database deletion even if storage deletion fails
            } else {
              console.log(`✅ Successfully deleted ${filePaths.length} image(s) from storage`);
            }
          }
        }
      } catch (storageErr) {
        console.warn('⚠️ Warning: Error deleting images from storage:', storageErr);
        // Continue with database deletion even if storage deletion fails
      }
    }
    
    // Delete feedback from database
    // feedback_id is a UUID, so we must use it as a string
    // Use select() to get the deleted rows back for verification
    const deleteQuery = supabase
      .from('feedback')
      .delete()
      .eq('feedback_id', feedbackId)  // Use the validated string UUID
      .select();
    
    const { data: deleteData, error } = await deleteQuery;
    
    if (error) {
      console.error('❌ Error deleting feedback:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete feedback',
        error: error.message 
      });
    }
    
    // Check if any rows were actually deleted
    if (!deleteData || deleteData.length === 0) {
      console.error('❌ Feedback not found with ID:', feedbackId);
      return res.status(404).json({ 
        success: false, 
        message: 'Feedback not found or already deleted'
      });
    }
    
    console.log('✅ Feedback deleted successfully from database. Deleted:', deleteData);
    
    res.json({ 
      success: true, 
      message: 'Feedback and associated images deleted successfully',
      deletedCount: deleteData.length
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

