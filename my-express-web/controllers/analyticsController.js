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

// Get booking status distribution
const getBookingStatusDistribution = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    console.log('📊 Fetching booking status distribution:', { start_date, end_date });
    
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
      console.error('❌ Error fetching booking status distribution:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch booking status distribution', 
        error: error.message 
      });
    }
    
    const distribution = {
      pending: data?.filter(b => b.status === 'pending').length || 0,
      confirmed: data?.filter(b => b.status === 'confirmed').length || 0,
      cancelled: data?.filter(b => b.status === 'cancelled').length || 0,
      rescheduled: data?.filter(b => b.status === 'rescheduled').length || 0,
      completed: data?.filter(b => b.status === 'completed').length || 0
    };
    
    console.log('✅ Booking status distribution fetched successfully');
    
    res.json({ 
      success: true, 
      distribution
    });
    
  } catch (error) {
    console.error('❌ Booking status distribution error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get booking type comparison
const getBookingTypeComparison = async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'month' } = req.query;
    
    console.log('📊 Fetching booking type comparison:', { start_date, end_date, group_by });
    
    let query = supabase
      .from('bookings')
      .select('booking_type, created_at');
    
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching booking type comparison:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch booking type comparison', 
        error: error.message 
      });
    }
    
    // Group by time period
    const grouped = {};
    data?.forEach(booking => {
      const date = new Date(booking.created_at);
      let key;
      
      if (group_by === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (group_by === 'week') {
        const week = Math.ceil(date.getDate() / 7);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-W${week}`;
      } else {
        key = date.toISOString().split('T')[0];
      }
      
      if (!grouped[key]) {
        grouped[key] = { package_only: 0, tour_only: 0 };
      }
      
      if (booking.booking_type === 'package_only') {
        grouped[key].package_only++;
      } else if (booking.booking_type === 'tour_only') {
        grouped[key].tour_only++;
      }
    });
    
    const comparison = Object.keys(grouped).sort().map(key => ({
      period: key,
      package_only: grouped[key].package_only,
      tour_only: grouped[key].tour_only
    }));
    
    console.log('✅ Booking type comparison fetched successfully');
    
    res.json({ 
      success: true, 
      comparison
    });
    
  } catch (error) {
    console.error('❌ Booking type comparison error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get revenue by booking status
const getRevenueByStatus = async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'month' } = req.query;
    
    console.log('📊 Fetching revenue by status:', { start_date, end_date, group_by });
    
    let query = supabase
      .from('bookings')
      .select('status, total_price, created_at');
    
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching revenue by status:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch revenue by status', 
        error: error.message 
      });
    }
    
    // Group by time period and status
    const grouped = {};
    data?.forEach(booking => {
      const date = new Date(booking.created_at);
      let key;
      
      if (group_by === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (group_by === 'week') {
        const week = Math.ceil(date.getDate() / 7);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-W${week}`;
      } else {
        key = date.toISOString().split('T')[0];
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          pending: 0,
          confirmed: 0,
          cancelled: 0,
          rescheduled: 0,
          completed: 0
        };
      }
      
      const price = parseFloat(booking.total_price) || 0;
      const status = booking.status || 'pending';
      if (grouped[key][status] !== undefined) {
        grouped[key][status] += price;
      }
    });
    
    const revenueByStatus = Object.keys(grouped).sort().map(key => ({
      period: key,
      pending: grouped[key].pending,
      confirmed: grouped[key].confirmed,
      cancelled: grouped[key].cancelled,
      rescheduled: grouped[key].rescheduled,
      completed: grouped[key].completed
    }));
    
    console.log('✅ Revenue by status fetched successfully');
    
    res.json({ 
      success: true, 
      revenueByStatus
    });
    
  } catch (error) {
    console.error('❌ Revenue by status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get service performance breakdown
const getServicePerformance = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    console.log('📊 Fetching service performance:', { start_date, end_date });
    
    // Get tour bookings
    let tourQuery = supabase
      .from('booking_tour')
      .select('tour_type, booking_id, tour_date');
    
    if (start_date) {
      tourQuery = tourQuery.gte('tour_date', start_date);
    }
    if (end_date) {
      tourQuery = tourQuery.lte('tour_date', end_date);
    }
    
    const { data: tourBookings } = await tourQuery;
    
    // Get vehicle bookings
    let vehicleQuery = supabase
      .from('booking_vehicles')
      .select('booking_id, vehicle_id');
    
    const { data: vehicleBookings } = await vehicleQuery;
    
    // Get diving bookings
    let divingQuery = supabase
      .from('bookings_diving')
      .select('diving_type, booking_id');
    
    const { data: divingBookings } = await divingQuery;
    
    // Get van rental bookings
    let vanQuery = supabase
      .from('bookings_van_rental')
      .select('booking_id, van_destination_id');
    
    if (start_date) {
      vanQuery = vanQuery.gte('created_at', start_date);
    }
    if (end_date) {
      vanQuery = vanQuery.lte('created_at', end_date);
    }
    
    const { data: vanBookings } = await vanQuery;
    
    // Aggregate service counts
    const services = {
      tours: {},
      vehicles: vehicleBookings?.length || 0,
      diving: {},
      van_rentals: vanBookings?.length || 0
    };
    
    // Count tour types
    tourBookings?.forEach(booking => {
      const tourType = booking.tour_type || 'unknown';
      services.tours[tourType] = (services.tours[tourType] || 0) + 1;
    });
    
    // Count diving types
    divingBookings?.forEach(booking => {
      const divingType = booking.diving_type || 'unknown';
      services.diving[divingType] = (services.diving[divingType] || 0) + 1;
    });
    
    console.log('✅ Service performance fetched successfully');
    
    res.json({ 
      success: true, 
      services
    });
    
  } catch (error) {
    console.error('❌ Service performance error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get monthly tourist volume
const getTouristVolume = async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'month' } = req.query;
    
    console.log('📊 Fetching tourist volume:', { start_date, end_date, group_by });
    
    let query = supabase
      .from('bookings')
      .select('number_of_tourist, arrival_date, created_at');
    
    if (start_date) {
      query = query.gte('arrival_date', start_date);
    }
    if (end_date) {
      query = query.lte('arrival_date', end_date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching tourist volume:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch tourist volume', 
        error: error.message 
      });
    }
    
    // Group by time period
    const grouped = {};
    data?.forEach(booking => {
      const date = new Date(booking.arrival_date || booking.created_at);
      let key;
      
      if (group_by === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (group_by === 'week') {
        const week = Math.ceil(date.getDate() / 7);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-W${week}`;
      } else {
        key = date.toISOString().split('T')[0];
      }
      
      if (!grouped[key]) {
        grouped[key] = 0;
      }
      
      grouped[key] += parseInt(booking.number_of_tourist) || 0;
    });
    
    const volume = Object.keys(grouped).sort().map(key => ({
      period: key,
      tourists: grouped[key]
    }));
    
    console.log('✅ Tourist volume fetched successfully');
    
    res.json({ 
      success: true, 
      volume
    });
    
  } catch (error) {
    console.error('❌ Tourist volume error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get hotel performance
const getHotelPerformance = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    console.log('📊 Fetching hotel performance:', { start_date, end_date });
    
    let query = supabase
      .from('bookings')
      .select('hotel_id, created_at');
    
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    
    const { data: bookings, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching hotel performance:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch hotel performance', 
        error: error.message 
      });
    }
    
    // Get hotel names
    const hotelIds = [...new Set(bookings?.map(b => b.hotel_id).filter(id => id))];
    let hotelsData = {};
    
    if (hotelIds.length > 0) {
      const { data: hotels } = await supabase
        .from('hotels')
        .select('hotel_id, name')
        .in('hotel_id', hotelIds);
      
      if (hotels) {
        hotelsData = hotels.reduce((acc, hotel) => {
          acc[hotel.hotel_id] = hotel.name;
          return acc;
        }, {});
      }
    }
    
    // Count bookings per hotel
    const hotelCounts = {};
    bookings?.forEach(booking => {
      if (booking.hotel_id) {
        const hotelName = hotelsData[booking.hotel_id] || `Hotel ID: ${booking.hotel_id}`;
        hotelCounts[hotelName] = (hotelCounts[hotelName] || 0) + 1;
      }
    });
    
    const performance = Object.keys(hotelCounts).map(hotelName => ({
      hotel: hotelName,
      bookings: hotelCounts[hotelName]
    })).sort((a, b) => b.bookings - a.bookings);
    
    console.log('✅ Hotel performance fetched successfully');
    
    res.json({ 
      success: true, 
      performance
    });
    
  } catch (error) {
    console.error('❌ Hotel performance error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get average booking value over time
const getAvgBookingValue = async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'month' } = req.query;
    
    console.log('📊 Fetching average booking value:', { start_date, end_date, group_by });
    
    let query = supabase
      .from('payments')
      .select('total_booking_amount, payment_date');
    
    if (start_date) {
      query = query.gte('payment_date', start_date);
    }
    if (end_date) {
      query = query.lte('payment_date', end_date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching average booking value:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch average booking value', 
        error: error.message 
      });
    }
    
    // Group by time period
    const grouped = {};
    data?.forEach(payment => {
      const date = new Date(payment.payment_date);
      let key;
      
      if (group_by === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (group_by === 'week') {
        const week = Math.ceil(date.getDate() / 7);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-W${week}`;
      } else {
        key = date.toISOString().split('T')[0];
      }
      
      if (!grouped[key]) {
        grouped[key] = { total: 0, count: 0 };
      }
      
      grouped[key].total += parseFloat(payment.total_booking_amount) || 0;
      grouped[key].count++;
    });
    
    const avgValues = Object.keys(grouped).sort().map(key => ({
      period: key,
      average: grouped[key].count > 0 ? grouped[key].total / grouped[key].count : 0,
      total: grouped[key].total,
      count: grouped[key].count
    }));
    
    console.log('✅ Average booking value fetched successfully');
    
    res.json({ 
      success: true, 
      avgValues
    });
    
  } catch (error) {
    console.error('❌ Average booking value error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get cancellation rate trend
const getCancellationRate = async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'month' } = req.query;
    
    console.log('📊 Fetching cancellation rate:', { start_date, end_date, group_by });
    
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
      console.error('❌ Error fetching cancellation rate:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch cancellation rate', 
        error: error.message 
      });
    }
    
    // Group by time period
    const grouped = {};
    data?.forEach(booking => {
      const date = new Date(booking.created_at);
      let key;
      
      if (group_by === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (group_by === 'week') {
        const week = Math.ceil(date.getDate() / 7);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-W${week}`;
      } else {
        key = date.toISOString().split('T')[0];
      }
      
      if (!grouped[key]) {
        grouped[key] = { total: 0, cancelled: 0 };
      }
      
      grouped[key].total++;
      if (booking.status === 'cancelled') {
        grouped[key].cancelled++;
      }
    });
    
    const cancellationRates = Object.keys(grouped).sort().map(key => ({
      period: key,
      rate: grouped[key].total > 0 ? (grouped[key].cancelled / grouped[key].total) * 100 : 0,
      cancelled: grouped[key].cancelled,
      total: grouped[key].total
    }));
    
    console.log('✅ Cancellation rate fetched successfully');
    
    res.json({ 
      success: true, 
      cancellationRates
    });
    
  } catch (error) {
    console.error('❌ Cancellation rate error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get peak booking days
const getPeakBookingDays = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    console.log('📊 Fetching peak booking days:', { start_date, end_date });
    
    let query = supabase
      .from('bookings')
      .select('created_at');
    
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching peak booking days:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch peak booking days', 
        error: error.message 
      });
    }
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0
    };
    
    data?.forEach(booking => {
      const date = new Date(booking.created_at);
      const dayName = dayNames[date.getDay()];
      dayCounts[dayName]++;
    });
    
    const peakDays = Object.keys(dayCounts).map(day => ({
      day,
      bookings: dayCounts[day]
    })).sort((a, b) => {
      const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    });
    
    console.log('✅ Peak booking days fetched successfully');
    
    res.json({ 
      success: true, 
      peakDays
    });
    
  } catch (error) {
    console.error('❌ Peak booking days error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get van rental destinations
const getVanDestinations = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    console.log('📊 Fetching van rental destinations:', { start_date, end_date });
    
    let query = supabase
      .from('bookings_van_rental')
      .select('van_destination_id, created_at');
    
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    
    const { data: vanBookings, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching van rental destinations:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch van rental destinations', 
        error: error.message 
      });
    }
    
    // Get destination names
    const destinationIds = [...new Set(vanBookings?.map(v => v.van_destination_id).filter(id => id))];
    let destinationsData = {};
    
    if (destinationIds.length > 0) {
      const { data: destinations } = await supabase
        .from('van_destinations')
        .select('id, destination_name')
        .in('id', destinationIds);
      
      if (destinations) {
        destinationsData = destinations.reduce((acc, dest) => {
          acc[dest.id] = dest.destination_name;
          return acc;
        }, {});
      }
    }
    
    // Count bookings per destination
    const destinationCounts = {};
    vanBookings?.forEach(booking => {
      if (booking.van_destination_id) {
        const destName = destinationsData[booking.van_destination_id] || `Destination ID: ${booking.van_destination_id}`;
        destinationCounts[destName] = (destinationCounts[destName] || 0) + 1;
      }
    });
    
    const destinations = Object.keys(destinationCounts).map(destName => ({
      destination: destName,
      bookings: destinationCounts[destName]
    })).sort((a, b) => b.bookings - a.bookings);
    
    console.log('✅ Van rental destinations fetched successfully');
    
    res.json({ 
      success: true, 
      destinations
    });
    
  } catch (error) {
    console.error('❌ Van rental destinations error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get booking demand time-series for predictive analytics
const getBookingDemandTimeseries = async (req, res) => {
  const {
    start_date: startDateParam,
    end_date: endDateParam,
    horizon: horizonParam,
    lookback_days: lookbackParam
  } = req.query;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const sanitizeDate = (value, fallback) => {
    if (!value) return fallback;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
  };

  const endDate = sanitizeDate(endDateParam, new Date());
  const lookbackDaysRaw = parseInt(lookbackParam, 10);
  const lookbackDays = Number.isFinite(lookbackDaysRaw)
    ? Math.min(Math.max(lookbackDaysRaw, 30), 730)
    : 180;
  const startDateDefault = new Date(endDate.getTime() - lookbackDays * MS_PER_DAY);
  const startDate = sanitizeDate(startDateParam, startDateDefault);
  const horizonRaw = parseInt(horizonParam, 10);
  const forecastHorizon = Number.isFinite(horizonRaw)
    ? Math.min(Math.max(horizonRaw, 1), 30)
    : 7;

  const startIso = startDate.toISOString().split('T')[0];
  const endIso = endDate.toISOString().split('T')[0];

  const normalizeDay = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString().split('T')[0];
  };

  const slugify = (str) =>
    String(str || 'general')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'general';

  const formatLabel = (raw, type) => {
    if (!raw) {
      return type === 'package' ? 'Unnamed Package' : 'Unnamed Tour';
    }
    const cleaned = String(raw).trim();
    if (!cleaned) {
      return type === 'package' ? 'Unnamed Package' : 'Unnamed Tour';
    }
    return cleaned
      .split(/[\s_]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const withinRange = (dateString) => !!dateString && dateString >= startIso && dateString <= endIso;

  try {
    console.log('📊 Fetching booking demand time-series:', {
      startIso,
      endIso,
      forecastHorizon
    });

    let bookingsQuery = supabase
      .from('bookings')
      .select('booking_id, created_at, status')
      .gte('created_at', `${startIso}T00:00:00Z`)
      .lte('created_at', `${endIso}T23:59:59Z`);

    const { data: bookings, error: bookingsError } = await bookingsQuery;

    if (bookingsError) {
      console.error('❌ Error fetching base bookings:', bookingsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch base bookings',
        error: bookingsError.message
      });
    }

    const approvedStatuses = new Set(['confirmed', 'completed']);
    const bookingStatusMap = new Map();

    bookings
      ?.filter((booking) => booking.booking_id)
      .forEach((booking) => {
        if (approvedStatuses.has(String(booking.status || '').toLowerCase())) {
          const bookingId = String(booking.booking_id).trim();
          const createdDay = normalizeDay(booking.created_at);
          if (bookingId && createdDay && withinRange(createdDay)) {
            bookingStatusMap.set(bookingId, createdDay);
          }
        }
      });

    if (bookingStatusMap.size === 0) {
      console.warn('ℹ️ No qualifying bookings found for demand timeseries.');
      return res.json({
        success: true,
        data: {
          generated_at: new Date().toISOString(),
          start_date: startIso,
          end_date: endIso,
          horizon: forecastHorizon,
          services: [],
          total: []
        }
      });
    }

    const bookingIds = Array.from(bookingStatusMap.keys());

    const [tourData, packageData, vehicleData, divingData, vanData] = await Promise.all([
      supabase
        .from('booking_tour')
        .select('booking_id, tour_type, tour_date')
        .in('booking_id', bookingIds),
      supabase
        .from('package_only')
        .select('booking_id, package_name, created_at')
        .in('booking_id', bookingIds),
      supabase
        .from('booking_vehicles')
        .select('booking_id, vehicle_name, created_at')
        .in('booking_id', bookingIds),
      supabase
        .from('bookings_diving')
        .select('booking_id, diving_type, created_at')
        .in('booking_id', bookingIds),
      supabase
        .from('bookings_van_rental')
        .select('booking_id, choose_destination, created_at')
        .in('booking_id', bookingIds)
    ]);

    [
      { label: 'tour bookings', payload: tourData },
      { label: 'package bookings', payload: packageData },
      { label: 'vehicle bookings', payload: vehicleData },
      { label: 'diving bookings', payload: divingData },
      { label: 'van bookings', payload: vanData }
    ].forEach(({ label, payload }) => {
      if (payload?.error) {
        console.warn(`⚠️ Failed to load ${label}:`, payload.error.message);
      }
    });

    const registry = new Map();
    const totalByDate = new Map();

    const recordTotal = (dateKey) => {
      if (!dateKey || !withinRange(dateKey)) return;
      totalByDate.set(dateKey, (totalByDate.get(dateKey) || 0) + 1);
    };

    const upsertEntry = (key, label, type, dateKey) => {
      if (!dateKey || !withinRange(dateKey)) return;
      if (!registry.has(key)) {
        registry.set(key, {
          key,
          label,
          type,
          byDate: new Map()
        });
      }
      const entry = registry.get(key);
      entry.byDate.set(dateKey, (entry.byDate.get(dateKey) || 0) + 1);
      recordTotal(dateKey);
    };

    tourData.data?.forEach((booking) => {
      const bookingId = String(booking.booking_id || '').trim();
      if (!bookingId || !bookingStatusMap.has(bookingId)) return;
      const serviceKey = `tour-${slugify(booking.tour_type)}`;
      const label = formatLabel(booking.tour_type, 'tour');
      const day = normalizeDay(booking.tour_date) || bookingStatusMap.get(bookingId);
      upsertEntry(serviceKey, label, 'tour', day);
    });

    packageData.data?.forEach((booking) => {
      const bookingId = String(booking.booking_id || '').trim();
      if (!bookingId || !bookingStatusMap.has(bookingId)) return;
      const serviceKey = `package-${slugify(booking.package_name)}`;
      const label = formatLabel(booking.package_name, 'package');
      const day = normalizeDay(booking.created_at) || bookingStatusMap.get(bookingId);
      upsertEntry(serviceKey, label, 'package', day);
    });

    vehicleData.data?.forEach((booking) => {
      const bookingId = String(booking.booking_id || '').trim();
      if (!bookingId || !bookingStatusMap.has(bookingId)) return;
      const serviceKey = `vehicle-${slugify(booking.vehicle_name)}`;
      const label = formatLabel(booking.vehicle_name || 'Vehicle Rental', 'vehicle');
      const day = normalizeDay(booking.created_at) || bookingStatusMap.get(bookingId);
      upsertEntry(serviceKey, label, 'vehicle', day);
    });

    divingData.data?.forEach((booking) => {
      const bookingId = String(booking.booking_id || '').trim();
      if (!bookingId || !bookingStatusMap.has(bookingId)) return;
      const serviceKey = `diving-${slugify(booking.diving_type)}`;
      const label = formatLabel(booking.diving_type || 'Diving', 'diving');
      const day = normalizeDay(booking.created_at) || bookingStatusMap.get(bookingId);
      upsertEntry(serviceKey, label, 'diving', day);
    });

    vanData.data?.forEach((booking) => {
      const bookingId = String(booking.booking_id || '').trim();
      if (!bookingId || !bookingStatusMap.has(bookingId)) return;
      const serviceKey = `van-${slugify(booking.choose_destination)}`;
      const label = formatLabel(booking.choose_destination || 'Van Rental', 'van');
      const day = normalizeDay(booking.created_at) || bookingStatusMap.get(bookingId);
      upsertEntry(serviceKey, label, 'van', day);
    });

    bookingStatusMap.forEach((createdDay) => {
      recordTotal(createdDay);
    });

    const servicesSeries = Array.from(registry.values())
      .map((entry) => {
        const sortedDates = Array.from(entry.byDate.keys()).sort();
        return {
          key: entry.key,
          label: entry.label,
          type: entry.type,
          history: sortedDates.map((date) => ({
            date,
            value: entry.byDate.get(date)
          }))
        };
      })
      .filter((series) => series.history.length > 0);

    const totalSeries = Array.from(totalByDate.keys())
      .sort()
      .map((date) => ({
        date,
        value: totalByDate.get(date)
      }));

    console.log('✅ Booking demand time-series generated:', {
      services: servicesSeries.length,
      totalPoints: totalSeries.length
    });

    return res.json({
      success: true,
      data: {
        generated_at: new Date().toISOString(),
        start_date: startIso,
        end_date: endIso,
        horizon: forecastHorizon,
        services: servicesSeries,
        total: totalSeries
      }
    });
  } catch (error) {
    console.error('❌ Booking demand timeseries error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate booking demand timeseries',
      error: error.message
    });
  }
};

module.exports = {
  getRevenue,
  getBookingsCount,
  getPopularServices,
  getBookingStatusDistribution,
  getBookingTypeComparison,
  getRevenueByStatus,
  getServicePerformance,
  getTouristVolume,
  getHotelPerformance,
  getAvgBookingValue,
  getCancellationRate,
  getPeakBookingDays,
  getVanDestinations,
  getBookingDemandTimeseries
};

