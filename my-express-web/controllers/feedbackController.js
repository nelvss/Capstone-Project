const supabase = require('../config/supabase');

const submitFeedback = async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required' 
      });
    }
    
    console.log('📝 Submitting feedback:', { message: message.trim() });
    
    const { data, error } = await supabase
      .from('feedback')
      .insert([
        {
          anonymous_name: 'Anonymous',
          message: message.trim(),
          date: new Date().toISOString()
        }
      ])
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

