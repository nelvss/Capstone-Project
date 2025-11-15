const supabase = require('../config/supabase');
const { uploadImageToStorage } = require('../utils/imageUpload');

const uploadReceipt = async (req, res) => {
  try {
    const { imageData, fileName, bookingId } = req.body;

    if (!imageData || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'Missing image data or filename'
      });
    }

    const { publicUrl, filePath } = await uploadImageToStorage({
      imageData,
      fileName,
      bucket: 'receipts',
      keyPrefix: 'receipts',
      identifier: bookingId || 'unknown'
    });

    res.json({
      success: true,
      message: 'Receipt uploaded successfully',
      imageUrl: publicUrl,
      fileName: filePath
    });
  } catch (error) {
    console.error('❌ Receipt upload error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 400 ? error.message : 'Internal server error',
      error: error.details?.message || error.message
    });
  }
};

const createPayment = async (req, res) => {
  try {
    const { 
      booking_id,
      payment_method,
      total_booking_amount,
      paid_amount,
      payment_option,
      receipt_image_url
    } = req.body;
    
    console.log('💰 Recording payment:', { booking_id, payment_method, total_booking_amount, paid_amount });
    
    if (!booking_id || !payment_method || total_booking_amount === undefined || paid_amount === undefined || !payment_option) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: booking_id, payment_method, total_booking_amount, paid_amount, payment_option' 
      });
    }
    
    const remaining_balance = parseFloat(total_booking_amount) - parseFloat(paid_amount);
    
    const paymentData = {
      booking_id,
      payment_method,
      total_booking_amount: parseFloat(total_booking_amount),
      paid_amount: parseFloat(paid_amount),
      remaining_balance,
      payment_option,
      payment_date: new Date().toISOString()
    };
    
    if (receipt_image_url) {
      paymentData.receipt_image_url = receipt_image_url;
    }
    
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select();
    
    if (error) {
      console.error('❌ Error recording payment:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to record payment', 
        error: error.message 
      });
    }
    
    console.log('✅ Payment recorded successfully');
    
    res.json({ 
      success: true, 
      message: 'Payment recorded successfully',
      payment: data[0]
    });
    
  } catch (error) {
    console.error('❌ Payment recording error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const getPayments = async (req, res) => {
  try {
    const { booking_id, payment_method, start_date, end_date } = req.query;
    
    console.log('💰 Fetching payment history:', { booking_id, payment_method, start_date, end_date });
    
    // Build query with filters first
    let query = supabase
      .from('payments')
      .select(`
        *,
        bookings:booking_id (
          customer_first_name,
          customer_last_name,
          customer_email,
          arrival_date,
          departure_date
        )
      `)
      .order('payment_date', { ascending: false });
    
    if (booking_id) {
      query = query.eq('booking_id', booking_id);
    }
    
    if (payment_method) {
      query = query.eq('payment_method', payment_method);
    }
    
    if (start_date) {
      query = query.gte('payment_date', start_date);
    }
    if (end_date) {
      query = query.lte('payment_date', end_date);
    }
    
    // Apply range at the end to override default 1000 row limit
    query = query.range(0, 9999);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching payments:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch payments', 
        error: error.message 
      });
    }
    
    console.log('✅ Payments fetched successfully:', data?.length || 0, 'payments');
    
    res.json({ 
      success: true, 
      payments: data || []
    });
    
  } catch (error) {
    console.error('❌ Payments fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('💰 Fetching payment details for ID:', id);
    
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        bookings:booking_id (
          customer_first_name,
          customer_last_name,
          customer_email,
          customer_contact,
          arrival_date,
          departure_date
        )
      `)
      .eq('payment_id', id)
      .single();
    
    if (error) {
      console.error('❌ Error fetching payment:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch payment details', 
        error: error.message 
      });
    }
    
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }
    
    console.log('✅ Payment details fetched successfully');
    
    res.json({ 
      success: true, 
      payment
    });
    
  } catch (error) {
    console.error('❌ Payment fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paid_amount, receipt_image_url, payment_method, payment_option } = req.body;
    
    console.log(`📝 Updating payment ID: ${id}`);
    
    const { data: existingPayment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_id', id)
      .single();
    
    if (fetchError || !existingPayment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }
    
    const updateData = {};
    
    if (paid_amount !== undefined) {
      updateData.paid_amount = parseFloat(paid_amount);
      updateData.remaining_balance = existingPayment.total_booking_amount - parseFloat(paid_amount);
    }
    
    if (receipt_image_url !== undefined) {
      updateData.receipt_image_url = receipt_image_url;
    }
    
    if (payment_method !== undefined) {
      updateData.payment_method = payment_method;
    }
    
    if (payment_option !== undefined) {
      updateData.payment_option = payment_option;
    }
    
    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('payment_id', id)
      .select();
    
    if (error) {
      console.error('❌ Error updating payment:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update payment', 
        error: error.message 
      });
    }
    
    console.log('✅ Payment updated successfully');
    
    res.json({ 
      success: true, 
      message: 'Payment updated successfully',
      payment: data[0]
    });
    
  } catch (error) {
    console.error('❌ Payment update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📝 Deleting payment with ID: ${id}`);
    
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('payment_id', id);
    
    if (error) {
      console.error('❌ Error deleting payment:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete payment', 
        error: error.message 
      });
    }
    
    console.log('✅ Payment deleted successfully');
    
    res.json({ 
      success: true, 
      message: 'Payment deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Payment deletion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

module.exports = {
  uploadReceipt,
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment
};

