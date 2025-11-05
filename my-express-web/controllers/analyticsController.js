const supabase = require('../config/supabase');

const getRevenue = async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'month' } = req.query;
    
    console.log('📊 Fetching revenue analytics:', { start_date, end_date, group_by });
    
    let query = supabase
      .from('bookings')
      .select('total_price, created_at, status');
    
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching revenue data:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch revenue data', 
        error: error.message 
      });
    }
    
    const confirmedBookings = data?.filter(booking => booking.status === 'confirmed') || [];
    const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + (parseFloat(booking.total_price) || 0), 0);
    
    console.log('✅ Revenue analytics fetched successfully');
    
    res.json({ 
      success: true, 
      analytics: {
        total_revenue: totalRevenue,
        total_bookings: data?.length || 0,
        confirmed_bookings: confirmedBookings.length,
        revenue_by_status: {
          confirmed: confirmedBookings.reduce((sum, booking) => sum + (parseFloat(booking.total_price) || 0), 0),
          pending: data?.filter(b => b.status === 'pending').reduce((sum, booking) => sum + (parseFloat(booking.total_price) || 0), 0) || 0,
          cancelled: data?.filter(b => b.status === 'cancelled').reduce((sum, booking) => sum + (parseFloat(booking.total_price) || 0), 0) || 0
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Revenue analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const getBookingsCount = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    console.log('📊 Fetching booking counts:', { start_date, end_date });
    
    let query = supabase
      .from('bookings')
      .select('status, created_at');
    
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching booking counts:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch booking counts', 
        error: error.message 
      });
    }
    
    const counts = {
      total: data?.length || 0,
      pending: data?.filter(b => b.status === 'pending').length || 0,
      confirmed: data?.filter(b => b.status === 'confirmed').length || 0,
      cancelled: data?.filter(b => b.status === 'cancelled').length || 0,
      rescheduled: data?.filter(b => b.status === 'rescheduled').length || 0,
      completed: data?.filter(b => b.status === 'completed').length || 0
    };
    
    console.log('✅ Booking counts fetched successfully');
    
    res.json({ 
      success: true, 
      counts
    });
    
  } catch (error) {
    console.error('❌ Booking counts error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const getPopularServices = async (req, res) => {
  try {
    console.log('📊 Fetching popular services analytics...');
    
    const { data: tourBookings } = await supabase
      .from('booking_tour')
      .select('tour_type');
    
    const { data: vehicleBookings } = await supabase
      .from('booking_vehicles')
      .select('vehicle_id');
    
    const { data: divingBookings } = await supabase
      .from('bookings_diving')
      .select('diving_type');
    
    const services = {
      tours: tourBookings?.reduce((acc, booking) => {
        acc[booking.tour_type] = (acc[booking.tour_type] || 0) + 1;
        return acc;
      }, {}) || {},
      vehicles: vehicleBookings?.length || 0,
      diving: divingBookings?.reduce((acc, booking) => {
        acc[booking.diving_type] = (acc[booking.diving_type] || 0) + 1;
        return acc;
      }, {}) || {}
    };
    
    console.log('✅ Popular services analytics fetched successfully');
    
    res.json({ 
      success: true, 
      services
    });
    
  } catch (error) {
    console.error('❌ Popular services analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

module.exports = {
  getRevenue,
  getBookingsCount,
  getPopularServices
};

