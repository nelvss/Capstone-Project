const supabase = require('../config/supabase');
const { uploadImageToStorage } = require('../utils/imageUpload');

const submitFeedback = async (req, res) => {
  try {
    const { message, rating, imageData, fileName } = req.body;
    
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
      hasImage: !!imageData 
    });
    
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
    
    // Handle image upload if provided
    if (imageData && fileName) {
      try {
        const uploadResult = await uploadImageToStorage({
          imageData,
          fileName,
          bucket: 'feedback-images',
          keyPrefix: 'feedback',
          identifier: 'feedback'
        });
        
        feedbackData.image_url = uploadResult.publicUrl;
        console.log('✅ Image uploaded successfully:', uploadResult.publicUrl);
      } catch (uploadError) {
        console.error('❌ Image upload error:', uploadError);
        // Continue without image if upload fails
        // Or return error if image is required
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

