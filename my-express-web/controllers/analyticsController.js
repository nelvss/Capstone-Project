const supabase = require('../config/supabase');

// Conditionally require Google Generative AI (only if package is installed)
let GoogleGenerativeAI;
try {
  GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
} catch (error) {
  console.warn('⚠️ @google/generative-ai package not installed. AI chart interpretation will be unavailable.');
  GoogleGenerativeAI = null;
}

const getRevenue = async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'month' } = req.query;
    
    console.log('📊 Fetching revenue analytics:', { start_date, end_date, group_by });
    
    // Query payments table for revenue data
    let paymentsQuery = supabase
      .from('payments')
      .select('total_booking_amount, payment_date, booking_id');
    
    if (start_date) {
      paymentsQuery = paymentsQuery.gte('payment_date', start_date);
    }
    if (end_date) {
      paymentsQuery = paymentsQuery.lte('payment_date', end_date);
    }
    
    const { data: payments, error: paymentsError } = await paymentsQuery;
    
    if (paymentsError) {
      console.error('❌ Error fetching revenue data:', paymentsError);
      return res.json({ 
        success: true, 
        analytics: {
          total_revenue: 0,
          total_bookings: 0,
          confirmed_bookings: 0
        },
        message: 'No revenue data available'
      });
    }
    
    // Get unique booking IDs and fetch their statuses
    const bookingIds = [...new Set(payments?.map(p => p.booking_id).filter(Boolean))];
    let bookingsData = {};
    
    if (bookingIds.length > 0) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_id, status')
        .in('booking_id', bookingIds);
      
      if (bookings) {
        bookingsData = bookings.reduce((acc, booking) => {
          acc[booking.booking_id] = booking.status;
          return acc;
        }, {});
      }
    }
    
    // Calculate revenue only from confirmed/completed bookings
    const confirmedPayments = payments?.filter(payment => {
      const status = bookingsData[payment.booking_id];
      return status === 'confirmed' || status === 'completed';
    }) || [];
    
    const totalRevenue = confirmedPayments.reduce((sum, payment) => sum + (parseFloat(payment.total_booking_amount) || 0), 0);
    
    console.log('✅ Revenue analytics fetched successfully');
    
    // Note: Socket.IO events should only be emitted on data changes (POST/PUT/DELETE)
    // Not on GET requests to avoid infinite loops
    
    res.json({ 
      success: true, 
      analytics: {
        total_revenue: totalRevenue,
        total_bookings: payments?.length || 0,
        confirmed_bookings: confirmedPayments.length,
        revenue_by_status: {
          confirmed: totalRevenue,
          pending: 0,
          cancelled: 0
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
      .select('status, arrival_date');
    
    if (start_date) {
      query = query.gte('arrival_date', start_date);
    }
    if (end_date) {
      query = query.lte('arrival_date', end_date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching booking counts:', error);
      return res.json({ 
        success: true, 
        counts: {
          total: 0,
          pending: 0,
          confirmed: 0,
          cancelled: 0,
          rescheduled: 0,
          completed: 0
        },
        message: 'No booking data available'
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
      .select('status, arrival_date');
    
    if (start_date) {
      query = query.gte('arrival_date', start_date);
    }
    if (end_date) {
      query = query.lte('arrival_date', end_date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching booking status distribution:', error);
      return res.json({ 
        success: true, 
        distribution: {
          pending: 0,
          confirmed: 0,
          cancelled: 0,
          rescheduled: 0,
          completed: 0
        },
        message: 'No booking data available'
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
    
    // Fetch ALL records by setting a high limit or using pagination
    // Supabase default limit is 1000, which can cause data discrepancies
    let allData = [];
    let hasMore = true;
    let offset = 0;
    const pageSize = 1000;
    
    while (hasMore) {
      let query = supabase
        .from('bookings')
        .select('booking_type, arrival_date, status')
        .in('status', ['confirmed', 'completed'])
        .range(offset, offset + pageSize - 1);
      
      if (start_date) {
        query = query.gte('arrival_date', start_date);
      }
      if (end_date) {
        query = query.lte('arrival_date', end_date);
      }
      
      const { data: pageData, error: pageError } = await query;
      
      if (pageError) {
        console.error('❌ Error fetching page:', pageError);
        break;
      }
      
      if (!pageData || pageData.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(pageData);
        offset += pageSize;
        
        // If we got less than pageSize, we've reached the end
        if (pageData.length < pageSize) {
          hasMore = false;
        }
      }
    }
    
    const data = allData;
    const error = null;
    
    console.log('🔍 Query filters:', { 
      has_start: !!start_date, 
      has_end: !!end_date,
      start_date, 
      end_date 
    });
    
    console.log('🔍 Raw data received:', { 
      totalRecords: data?.length || 0,
      firstRecord: data?.[0],
      lastRecord: data?.[data?.length - 1]
    });
    
    if (error || !data) {
      console.error('❌ Error fetching booking type comparison:', error);
      // Return empty data instead of 500 error
      return res.json({ 
        success: true, 
        comparison: [],
        message: 'No booking data available'
      });
    }
    
    // Handle null or empty data
    if (!data || data.length === 0) {
      console.log('ℹ️ No booking type data found');
      return res.json({ 
        success: true, 
        comparison: [],
        message: 'No booking data available'
      });
    }
    
    // Group by time period
    const grouped = {};
    const debugSample = [];
    
    data.forEach((booking, index) => {
      // Skip if arrival_date is null or invalid
      if (!booking.arrival_date) return;
      
      const date = new Date(booking.arrival_date);
      if (isNaN(date.getTime())) return;
      
      // Collect first 5 bookings for debugging
      if (index < 5) {
        debugSample.push({
          arrival_date: booking.arrival_date,
          booking_type: booking.booking_type,
          parsed_date: date.toISOString()
        });
      }
      
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
    
    console.log('🔍 Sample bookings processed:', debugSample);
    
    const comparison = Object.keys(grouped).sort().map(key => ({
      period: key,
      package_only: grouped[key].package_only,
      tour_only: grouped[key].tour_only
    }));

    // Enhanced logging to debug discrepancies
    console.log('🔍 Booking type comparison summary:', {
      filters: { start_date, end_date },
      totalRecordsFromDB: data.length,
      periods: comparison.length,
      totalPackageOnly: comparison.reduce((sum, c) => sum + (c.package_only || 0), 0),
      totalTourOnly: comparison.reduce((sum, c) => sum + (c.tour_only || 0), 0)
    });
    
    // Log first 3 periods for debugging
    if (comparison.length > 0) {
      console.log('📅 First 3 periods:', comparison.slice(0, 3));
    }
    
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

// Get package distribution (Package 1-4)
const getPackageDistribution = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    console.log('📊 Fetching package distribution:', { start_date, end_date });
    
    let query = supabase
      .from('bookings')
      .select('booking_preferences, arrival_date')
      .eq('booking_type', 'package_only');
    
    if (start_date) {
      query = query.gte('arrival_date', start_date);
    }
    if (end_date) {
      query = query.lte('arrival_date', end_date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching package distribution:', error);
      return res.json({ 
        success: true, 
        distribution: {
          package1: 0,
          package2: 0,
          package3: 0,
          package4: 0
        },
        message: 'No booking data available'
      });
    }
    
    // Handle null or empty data
    if (!data || data.length === 0) {
      console.log('ℹ️ No package distribution data found');
      return res.json({ 
        success: true, 
        distribution: {
          package1: 0,
          package2: 0,
          package3: 0,
          package4: 0
        },
        message: 'No booking data available'
      });
    }
    
    // Debug: Log sample booking preferences
    console.log('📦 Sample booking preferences (first 5):', 
      data.slice(0, 5).map(b => b.booking_preferences));
    
    // Count packages from booking_preferences
    const distribution = {
      package1: 0,
      package2: 0,
      package3: 0,
      package4: 0
    };
    
    data.forEach(booking => {
      if (!booking.booking_preferences) return;
      
      const preferences = String(booking.booking_preferences).trim();
      
      // Parse "Package Only: Package X" format
      // Handle case-insensitive matching and extract package number
      const prefLower = preferences.toLowerCase();
      
      // Check for exact package matches (more specific first to avoid false matches)
      if (prefLower.includes('package 4') || preferences.match(/package\s*4/i)) {
        distribution.package4++;
      } else if (prefLower.includes('package 3') || preferences.match(/package\s*3/i)) {
        distribution.package3++;
      } else if (prefLower.includes('package 2') || preferences.match(/package\s*2/i)) {
        distribution.package2++;
      } else if (prefLower.includes('package 1') || preferences.match(/package\s*1/i)) {
        distribution.package1++;
      }
    });
    
    console.log('📦 Package distribution counts:', distribution);
    console.log('📦 Total bookings processed:', data.length);
    
    console.log('✅ Package distribution fetched successfully');
    
    res.json({ 
      success: true, 
      distribution
    });
    
  } catch (error) {
    console.error('❌ Package distribution error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get tour distribution (Island Hopping, Inland Tour, Snorkeling Tour)
const getTourDistribution = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    console.log('📊 Fetching tour distribution:', { start_date, end_date });
    
    let query = supabase
      .from('bookings')
      .select('booking_preferences, arrival_date')
      .eq('booking_type', 'tour_only');
    
    if (start_date) {
      query = query.gte('arrival_date', start_date);
    }
    if (end_date) {
      query = query.lte('arrival_date', end_date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching tour distribution:', error);
      return res.json({ 
        success: true, 
        distribution: {
          islandHopping: 0,
          inlandTour: 0,
          snorkelingTour: 0
        },
        message: 'No booking data available'
      });
    }
    
    // Handle null or empty data
    if (!data || data.length === 0) {
      console.log('ℹ️ No tour distribution data found');
      return res.json({ 
        success: true, 
        distribution: {
          islandHopping: 0,
          inlandTour: 0,
          snorkelingTour: 0
        },
        message: 'No booking data available'
      });
    }
    
    // Debug: Log sample booking preferences
    console.log('🏝️ Sample booking preferences (first 5):', 
      data.slice(0, 5).map(b => b.booking_preferences));
    
    // Count tour types from booking_preferences
    const distribution = {
      islandHopping: 0,
      inlandTour: 0,
      snorkelingTour: 0
    };
    
    data.forEach(booking => {
      if (!booking.booking_preferences) return;
      
      const preferences = String(booking.booking_preferences).trim();
      const prefLower = preferences.toLowerCase();
      
      // Parse "Tour Only: [Tour Type]" format
      // Handle variations: "Island Tour" maps to "Island Hopping", "Inland Tour", "Snorkeling Tour"
      // Check for Inland Tour first (more specific)
      if (prefLower.includes('inland tour')) {
        distribution.inlandTour++;
      } 
      // Check for Snorkeling Tour (more specific than just "snorkel")
      else if (prefLower.includes('snorkeling tour') || (prefLower.includes('snorkel') && !prefLower.includes('snorkeling tour'))) {
        distribution.snorkelingTour++;
      } 
      // Check for Island Tour or Island Hopping (both map to Island Hopping)
      else if (prefLower.includes('island tour') || prefLower.includes('island hopping')) {
        distribution.islandHopping++;
      }
    });
    
    console.log('🏝️ Tour distribution counts:', distribution);
    console.log('🏝️ Total bookings processed:', data.length);
    
    console.log('✅ Tour distribution fetched successfully');
    
    res.json({ 
      success: true, 
      distribution
    });
    
  } catch (error) {
    console.error('❌ Tour distribution error:', error);
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
      .from('payments')
      .select('total_booking_amount, payment_date, booking_id');
    
    if (start_date) {
      query = query.gte('payment_date', start_date);
    }
    if (end_date) {
      query = query.lte('payment_date', end_date);
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
    
    // Get booking statuses
    const bookingIds = data?.map(p => p.booking_id) || [];
    const { data: bookings } = await supabase
      .from('bookings')
      .select('booking_id, status')
      .in('booking_id', bookingIds);
    
    const bookingStatusMap = {};
    bookings?.forEach(b => {
      bookingStatusMap[b.booking_id] = b.status;
    });
    
    // Group by time period and status
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
        grouped[key] = {
          pending: 0,
          confirmed: 0,
          cancelled: 0,
          rescheduled: 0,
          completed: 0
        };
      }
      
      const price = parseFloat(payment.total_booking_amount) || 0;
      const status = bookingStatusMap[payment.booking_id] || 'pending';
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
    
    const pageSize = 1000; // Supabase's maximum per request
    
    // Get tour bookings with pagination
    let allTourBookings = [];
    let tourOffset = 0;
    let hasMoreTours = true;
    
    while (hasMoreTours) {
      let tourQuery = supabase
        .from('booking_tour')
        .select('tour_type, booking_id, tour_date')
        .range(tourOffset, tourOffset + pageSize - 1);
      
      // Tour bookings don't have created_at - filter tours by actual tour_date
      if (start_date) {
        tourQuery = tourQuery.gte('tour_date', start_date);
      }
      if (end_date) {
        tourQuery = tourQuery.lte('tour_date', end_date);
      }
      
      const { data: tourBookingsPage, error: tourError } = await tourQuery;
      
      if (tourError) {
        console.warn('⚠️ Error fetching tour bookings:', tourError.message);
        hasMoreTours = false;
      } else if (tourBookingsPage && tourBookingsPage.length > 0) {
        allTourBookings = allTourBookings.concat(tourBookingsPage);
        tourOffset += pageSize;
        
        // If we got less than pageSize results, we've reached the end
        if (tourBookingsPage.length < pageSize) {
          hasMoreTours = false;
        }
      } else {
        hasMoreTours = false;
      }
    }
    
    // Get vehicle bookings with pagination
    let allVehicleBookings = [];
    let vehicleOffset = 0;
    let hasMoreVehicles = true;
    
    while (hasMoreVehicles) {
      const { data: vehicleBookingsPage, error: vehicleError } = await supabase
        .from('booking_vehicles')
        .select('booking_id, vehicle_id')
        .range(vehicleOffset, vehicleOffset + pageSize - 1);
      
      if (vehicleError) {
        console.warn('⚠️ Error fetching vehicle bookings:', vehicleError.message);
        hasMoreVehicles = false;
      } else if (vehicleBookingsPage && vehicleBookingsPage.length > 0) {
        allVehicleBookings = allVehicleBookings.concat(vehicleBookingsPage);
        vehicleOffset += pageSize;
        
        // If we got less than pageSize results, we've reached the end
        if (vehicleBookingsPage.length < pageSize) {
          hasMoreVehicles = false;
        }
      } else {
        hasMoreVehicles = false;
      }
    }
    
    // Get diving bookings with pagination
    let allDivingBookings = [];
    let divingOffset = 0;
    let hasMoreDiving = true;
    
    while (hasMoreDiving) {
      const { data: divingBookingsPage, error: divingError } = await supabase
        .from('bookings_diving')
        .select('diving_type, booking_id')
        .range(divingOffset, divingOffset + pageSize - 1);
      
      if (divingError) {
        console.warn('⚠️ Error fetching diving bookings:', divingError.message);
        hasMoreDiving = false;
      } else if (divingBookingsPage && divingBookingsPage.length > 0) {
        allDivingBookings = allDivingBookings.concat(divingBookingsPage);
        divingOffset += pageSize;
        
        // If we got less than pageSize results, we've reached the end
        if (divingBookingsPage.length < pageSize) {
          hasMoreDiving = false;
        }
      } else {
        hasMoreDiving = false;
      }
    }
    
    // Get van rental bookings with pagination
    let allVanBookings = [];
    let vanOffset = 0;
    let hasMoreVans = true;
    
    while (hasMoreVans) {
      const { data: vanBookingsPage, error: vanError } = await supabase
        .from('bookings_van_rental')
        .select('booking_id, van_destination_id')
        .range(vanOffset, vanOffset + pageSize - 1);
      
      if (vanError) {
        console.warn('⚠️ Error fetching van bookings:', vanError.message);
        hasMoreVans = false;
      } else if (vanBookingsPage && vanBookingsPage.length > 0) {
        allVanBookings = allVanBookings.concat(vanBookingsPage);
        vanOffset += pageSize;
        
        // If we got less than pageSize results, we've reached the end
        if (vanBookingsPage.length < pageSize) {
          hasMoreVans = false;
        }
      } else {
        hasMoreVans = false;
      }
    }
    
    // Aggregate service counts
    const services = {
      tours: {},
      vehicles: allVehicleBookings?.length || 0,
      diving: {},
      van_rentals: allVanBookings?.length || 0
    };
    
    // Count tour types - handle null/undefined
    if (allTourBookings && Array.isArray(allTourBookings)) {
      allTourBookings.forEach(booking => {
        const tourType = booking.tour_type || 'unknown';
        services.tours[tourType] = (services.tours[tourType] || 0) + 1;
      });
    }
    
    // Count diving types - handle null/undefined
    if (allDivingBookings && Array.isArray(allDivingBookings)) {
      allDivingBookings.forEach(booking => {
        const divingType = booking.diving_type || 'unknown';
        services.diving[divingType] = (services.diving[divingType] || 0) + 1;
      });
    }
    
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
      .select('number_of_tourist, arrival_date');
    
    // Use arrival_date for filtering
    if (start_date) {
      query = query.gte('arrival_date', start_date);
    }
    if (end_date) {
      query = query.lte('arrival_date', end_date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching tourist volume:', error);
      return res.json({ 
        success: true, 
        volume: [],
        message: 'No tourist volume data available'
      });
    }
    
    if (!data || data.length === 0) {
      console.log('ℹ️ No tourist volume data found');
      return res.json({ 
        success: true, 
        volume: [],
        message: 'No tourist volume data available'
      });
    }
    
    // Group by time period
    const grouped = {};
    data.forEach(booking => {
      // Use arrival_date
      if (!booking.arrival_date) return;
      
      const date = new Date(booking.arrival_date);
      if (isNaN(date.getTime())) return;
      
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
      .select('hotel_id, arrival_date');
    
    if (start_date) {
      query = query.gte('arrival_date', start_date);
    }
    if (end_date) {
      query = query.lte('arrival_date', end_date);
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
    
    // Query payments table for total_booking_amount
    let paymentsQuery = supabase
      .from('payments')
      .select('total_booking_amount, payment_date, booking_id');
    
    if (start_date) {
      paymentsQuery = paymentsQuery.gte('payment_date', start_date);
    }
    if (end_date) {
      paymentsQuery = paymentsQuery.lte('payment_date', end_date);
    }
    
    const { data: payments, error: paymentsError } = await paymentsQuery;
    
    if (paymentsError) {
      console.error('❌ Error fetching average booking value:', paymentsError);
      return res.json({ 
        success: true, 
        avgValues: [],
        message: 'No booking value data available'
      });
    }
    
    if (!payments || payments.length === 0) {
      console.log('ℹ️ No booking value data found');
      return res.json({ 
        success: true, 
        avgValues: [],
        message: 'No booking value data available'
      });
    }
    
    // Get unique booking IDs and fetch their statuses
    const bookingIds = [...new Set(payments.map(p => p.booking_id).filter(Boolean))];
    let bookingsData = {};
    
    if (bookingIds.length > 0) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_id, status')
        .in('booking_id', bookingIds);
      
      if (bookings) {
        bookingsData = bookings.reduce((acc, booking) => {
          acc[booking.booking_id] = booking.status;
          return acc;
        }, {});
      }
    }
    
    // Filter payments only from confirmed/completed bookings
    const confirmedPayments = payments.filter(payment => {
      const status = bookingsData[payment.booking_id];
      return status === 'confirmed' || status === 'completed';
    });
    
    if (confirmedPayments.length === 0) {
      console.log('ℹ️ No confirmed/completed booking payments found');
      return res.json({ 
        success: true, 
        avgValues: [],
        message: 'No confirmed booking value data available'
      });
    }
    
    // Group by time period
    const grouped = {};
    confirmedPayments.forEach(payment => {
      if (!payment.payment_date) return;
      
      const date = new Date(payment.payment_date);
      if (isNaN(date.getTime())) return;
      
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
      .select('status, arrival_date');
    
    if (start_date) {
      query = query.gte('arrival_date', start_date);
    }
    if (end_date) {
      query = query.lte('arrival_date', end_date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching cancellation rate:', error);
      return res.json({ 
        success: true, 
        cancellationRates: [],
        message: 'No cancellation data available'
      });
    }
    
    // Group by time period
    const grouped = {};
    data?.forEach(booking => {
      const date = new Date(booking.arrival_date);
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
      .select('arrival_date');
    
    if (start_date) {
      query = query.gte('arrival_date', start_date);
    }
    if (end_date) {
      query = query.lte('arrival_date', end_date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching peak booking days:', error);
      return res.json({ 
        success: true, 
        peakDays: [],
        message: 'No booking days data available'
      });
    }
    
    if (!data || data.length === 0) {
      console.log('ℹ️ No peak booking days data found');
      return res.json({ 
        success: true, 
        peakDays: [],
        message: 'No booking days data available'
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
    
    data.forEach(booking => {
      if (!booking.arrival_date) return;
      
      const date = new Date(booking.arrival_date);
      if (isNaN(date.getTime())) return;
      
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
    console.log('📊 Fetching van rental destinations...');
    
    // Get all van rental bookings with choose_destination and van_destination_id
    const { data: vanBookings, error } = await supabase
      .from('bookings_van_rental')
      .select('van_destination_id, choose_destination');
    
    if (error) {
      console.error('❌ Error fetching van rental destinations:', error);
      return res.json({ 
        success: true, 
        within: [],
        outside: [],
        message: 'No van rental destinations data available'
      });
    }
    
    if (!vanBookings || vanBookings.length === 0) {
      console.log('ℹ️ No van rental destinations data found');
      return res.json({ 
        success: true, 
        within: [],
        outside: [],
        message: 'No van rental destinations data available'
      });
    }
    
    console.log(`📋 Found ${vanBookings.length} van rental bookings`);
    
    // Get destination names from van_destinations table
    const destinationIds = [...new Set(vanBookings?.map(v => v.van_destination_id).filter(id => id))];
    console.log(`📋 Found ${destinationIds.length} unique destination IDs from bookings`);
    
    let destinationsData = {};
    
    if (destinationIds.length > 0) {
      const { data: destinations, error: destError } = await supabase
        .from('van_destinations')
        .select('id, destination_name')
        .in('id', destinationIds);
      
      if (destError) {
        console.error('❌ Error fetching destination details:', destError);
      }
      
      if (destinations) {
        console.log(`📋 Found ${destinations.length} destinations in van_destinations table`);
        destinationsData = destinations.reduce((acc, dest) => {
          acc[dest.id] = dest.destination_name || `Destination ID: ${dest.id}`;
          return acc;
        }, {});
        
        // Log destination data for debugging
        console.log('📋 Destination names:', Object.values(destinationsData));
      } else {
        console.warn('⚠️ No destinations found in van_destinations table');
      }
    }
    
    // Count bookings per destination, separated by choose_destination (within/outside)
    const withinCounts = {};
    const outsideCounts = {};
    let unmatchedCount = 0;
    
    vanBookings?.forEach(booking => {
      if (booking.van_destination_id) {
        const destName = destinationsData[booking.van_destination_id] || `Destination ID: ${booking.van_destination_id}`;
        const chooseDestination = (booking.choose_destination || '').toLowerCase().trim();
        
        // Use choose_destination from bookings_van_rental to determine category
        if (chooseDestination === 'within') {
          withinCounts[destName] = (withinCounts[destName] || 0) + 1;
        } else if (chooseDestination === 'outside') {
          outsideCounts[destName] = (outsideCounts[destName] || 0) + 1;
        } else {
          unmatchedCount++;
          console.warn(`⚠️ Unmatched choose_destination for ${destName}: "${booking.choose_destination || 'null'}"`);
        }
      }
    });
    
    console.log(`📊 Counts - Within: ${Object.keys(withinCounts).length} destinations, Outside: ${Object.keys(outsideCounts).length} destinations, Unmatched: ${unmatchedCount}`);
    
    // Convert to arrays and sort by bookings
    const within = Object.keys(withinCounts).map(destName => ({
      destination: destName,
      bookings: withinCounts[destName]
    })).sort((a, b) => b.bookings - a.bookings);
    
    const outside = Object.keys(outsideCounts).map(destName => ({
      destination: destName,
      bookings: outsideCounts[destName]
    })).sort((a, b) => b.bookings - a.bookings);
    
    console.log(`✅ Van rental destinations fetched successfully - Within: ${within.length} entries, Outside: ${outside.length} entries`);
    
    res.json({ 
      success: true, 
      within,
      outside
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
      .select('booking_id, arrival_date, status')
      .gte('arrival_date', `${startIso}T00:00:00Z`)
      .lte('arrival_date', `${endIso}T23:59:59Z`);

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
          const createdDay = normalizeDay(booking.arrival_date);
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
        .select('booking_id, package_name')
        .in('booking_id', bookingIds),
      supabase
        .from('booking_vehicles')
        .select('booking_id, vehicle_name')
        .in('booking_id', bookingIds),
      supabase
        .from('bookings_diving')
        .select('booking_id, diving_type')
        .in('booking_id', bookingIds),
      supabase
        .from('bookings_van_rental')
        .select('booking_id, choose_destination')
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
      const day = bookingStatusMap.get(bookingId);
      upsertEntry(serviceKey, label, 'package', day);
    });

    vehicleData.data?.forEach((booking) => {
      const bookingId = String(booking.booking_id || '').trim();
      if (!bookingId || !bookingStatusMap.has(bookingId)) return;
      const serviceKey = `vehicle-${slugify(booking.vehicle_name)}`;
      const label = formatLabel(booking.vehicle_name || 'Vehicle Rental', 'vehicle');
      const day = bookingStatusMap.get(bookingId);
      upsertEntry(serviceKey, label, 'vehicle', day);
    });

    divingData.data?.forEach((booking) => {
      const bookingId = String(booking.booking_id || '').trim();
      if (!bookingId || !bookingStatusMap.has(bookingId)) return;
      const serviceKey = `diving-${slugify(booking.diving_type)}`;
      const label = formatLabel(booking.diving_type || 'Diving', 'diving');
      const day = bookingStatusMap.get(bookingId);
      upsertEntry(serviceKey, label, 'diving', day);
    });

    vanData.data?.forEach((booking) => {
      const bookingId = String(booking.booking_id || '').trim();
      if (!bookingId || !bookingStatusMap.has(bookingId)) return;
      const serviceKey = `van-${slugify(booking.choose_destination)}`;
      const label = formatLabel(booking.choose_destination || 'Van Rental', 'van');
      // Use booking date from bookingStatusMap since pickup_date doesn't exist
      const day = bookingStatusMap.get(bookingId);
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

// Get seasonal prediction (Peak vs Low seasons by month)
const getSeasonalPrediction = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    // Growth threshold for trend classification (percentage)
    const GROWTH_THRESHOLD = 10; // Percentage threshold for trend classification
    
    console.log('📊 Generating seasonal prediction:', { targetYear });
    
    // Fetch ALL available historical booking data up to the target year
    // Start from 2019 (FIRST_ANALYTICS_YEAR) to match other analytics functions
    // This ensures consistency with booking type comparison and other analytics
    const FIRST_ANALYTICS_YEAR = 2019;
    // Use simple YYYY-MM-DD format for better Supabase compatibility (avoids timezone issues)
    const startDate = `${FIRST_ANALYTICS_YEAR}-01-01`;
    const endDate = `${targetYear - 1}-12-31`;
    
    console.log('📅 Seasonal Prediction Date Range:', {
      FIRST_ANALYTICS_YEAR,
      targetYear,
      startDate,
      endDate,
      dateRangeYears: `${FIRST_ANALYTICS_YEAR} to ${targetYear - 1}`
    });
    
    // Fetch ALL records using pagination to bypass Supabase's 1000 record limit
    let historicalBookings = [];
    let hasMore = true;
    let offset = 0;
    const pageSize = 1000; // Supabase's maximum per request
    let queryError = null;
    
    while (hasMore) {
      let query = supabase
        .from('bookings')
        .select('booking_id, arrival_date, status, number_of_tourist')
        .gte('arrival_date', startDate)
        .lte('arrival_date', endDate)
        .in('status', ['confirmed', 'completed'])
        .order('arrival_date', { ascending: true }) // Order by date for consistent pagination
        .range(offset, offset + pageSize - 1);
      
      const { data: pageData, error: pageError } = await query;
      
      if (pageError) {
        console.error('❌ Error fetching historical bookings page:', pageError);
        queryError = pageError;
        break;
      }
      
      if (!pageData || pageData.length === 0) {
        hasMore = false;
      } else {
        historicalBookings = historicalBookings.concat(pageData);
        offset += pageSize;
        
        // If we got less than pageSize results, we've reached the end
        if (pageData.length < pageSize) {
          hasMore = false;
        }
      }
    }
    
    // Enhanced logging to debug data issues
    console.log('📊 Fetched historical bookings:', {
      totalBookings: historicalBookings?.length || 0,
      firstBooking: historicalBookings?.[0]?.arrival_date,
      lastBooking: historicalBookings?.[historicalBookings.length - 1]?.arrival_date,
      dateRange: `${FIRST_ANALYTICS_YEAR} to ${targetYear - 1}`,
      pagesFetched: Math.ceil((historicalBookings?.length || 0) / pageSize)
    });
    
    // Log breakdown by year to see what data we're getting
    if (historicalBookings && historicalBookings.length > 0) {
      const bookingsByYear = {};
      historicalBookings.forEach(booking => {
        if (booking.arrival_date) {
          const year = new Date(booking.arrival_date).getFullYear();
          bookingsByYear[year] = (bookingsByYear[year] || 0) + 1;
        }
      });
      console.log('📊 Bookings by Year:', bookingsByYear);
    }
    
    if (queryError) {
      console.error('❌ Error fetching historical bookings:', queryError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch historical booking data', 
        error: queryError.message 
      });
    }
    
    if (!historicalBookings || historicalBookings.length === 0) {
      console.warn('ℹ️ No historical booking data found for seasonal prediction');
      return res.json({
        success: true,
        data: {
          generated_at: new Date().toISOString(),
          target_year: targetYear,
          lookback_years: 0,
          has_sufficient_data: false,
          message: 'Insufficient historical data for seasonal prediction',
          months: [],
          peak_months: [],
          low_months: []
        }
      });
    }
    
    // Fetch payments for historical bookings to calculate revenue
    const bookingIds = historicalBookings.map(b => b.booking_id);
    let historicalPayments = [];
    if (bookingIds.length > 0) {
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('booking_id, total_booking_amount')
        .in('booking_id', bookingIds);
      
      if (!paymentsError && payments) {
        historicalPayments = payments;
      }
    }
    
    // Calculate average revenue per booking
    const totalRevenue = historicalPayments.length > 0
      ? historicalPayments.reduce((sum, p) => 
          sum + (parseFloat(p.total_booking_amount) || 0), 0)
      : 0;
    const avgRevenuePerBooking = historicalBookings.length > 0 
      ? totalRevenue / historicalBookings.length 
      : 0;
    
    // Group bookings by month across all years
    const monthlyData = {};
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Initialize monthly data structure
    for (let i = 0; i < 12; i++) {
      monthlyData[i] = {
        month_number: i + 1,
        month_name: monthNames[i],
        bookings: [],
        total_bookings: 0,
        total_tourists: 0,
        years_data: {}
      };
    }
    
    // Aggregate historical data by month
    let invalidDates = 0;
    historicalBookings.forEach(booking => {
      // Validate arrival_date before processing
      if (!booking.arrival_date) {
        invalidDates++;
        return;
      }
      
      const date = new Date(booking.arrival_date);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        invalidDates++;
        return;
      }
      
      const month = date.getMonth();
      const year = date.getFullYear();
      
      // Validate month and year are in expected range
      if (month < 0 || month > 11 || year < FIRST_ANALYTICS_YEAR || year > targetYear - 1) {
        invalidDates++;
        return;
      }
      
      if (!monthlyData[month].years_data[year]) {
        monthlyData[month].years_data[year] = {
          bookings: 0,
          tourists: 0
        };
      }
      
      monthlyData[month].bookings.push(booking);
      monthlyData[month].total_bookings++;
      monthlyData[month].total_tourists += parseInt(booking.number_of_tourist) || 0;
      
      monthlyData[month].years_data[year].bookings++;
      monthlyData[month].years_data[year].tourists += parseInt(booking.number_of_tourist) || 0;
    });
    
    if (invalidDates > 0) {
      console.warn(`⚠️ Skipped ${invalidDates} bookings with invalid or missing arrival_date`);
    }
    
    // Log aggregated years
    const aggregatedYears = new Set();
    for (let i = 0; i < 12; i++) {
      Object.keys(monthlyData[i].years_data).forEach(year => aggregatedYears.add(parseInt(year)));
    }
    console.log('📊 Years found in aggregated data:', Array.from(aggregatedYears).sort());
    
    // Log summary for all months to verify data
    console.log('📊 Monthly Data Summary:');
    for (let i = 0; i < 12; i++) {
      const monthData = monthlyData[i];
      const yearsCount = Object.keys(monthData.years_data).length;
      const yearsList = Object.keys(monthData.years_data).map(y => parseInt(y)).sort();
      console.log(`  ${monthData.month_name}: ${monthData.total_bookings} bookings across ${yearsCount} years (${yearsList.join(', ')})`);
    }
    
    // Calculate averages and predictions for target year
    const monthlyPredictions = [];
    
    for (let i = 0; i < 12; i++) {
      const monthData = monthlyData[i];
      const yearsCount = Object.keys(monthData.years_data).length || 1;
      
      // Debug logging for January to help diagnose calculation issues
      if (i === 0) { // January is month index 0
        console.log(`📊 January Calculation Debug:`, {
          month_name: monthData.month_name,
          years_data: monthData.years_data,
          years_with_data: Object.keys(monthData.years_data),
          yearsCount: yearsCount,
          total_bookings: monthData.total_bookings,
          breakdown_by_year: Object.keys(monthData.years_data).map(year => ({
            year: year,
            bookings: monthData.years_data[year].bookings
          }))
        });
      }
      
      // Log detailed breakdown for months with significant data
      if (monthData.total_bookings > 0 && yearsCount >= 3) {
        console.log(`📊 ${monthData.month_name} Summary:`, {
          total_bookings: monthData.total_bookings,
          years_count: yearsCount,
          years: Object.keys(monthData.years_data).map(y => parseInt(y)).sort(),
          breakdown: Object.keys(monthData.years_data).map(year => ({
            year: parseInt(year),
            bookings: monthData.years_data[year].bookings
          })).sort((a, b) => a.year - b.year)
        });
      }
      
      const avgBookings = monthData.total_bookings / yearsCount;
      const avgTourists = monthData.total_tourists / yearsCount;
      
      // Calculate growth trend using Year-over-Year Average Growth
      const years = Object.keys(monthData.years_data).sort();
      let trend = 'stable';
      let growthRate = 0;
      
      if (years.length >= 2) {
        let totalGrowthRate = 0;
        let yearOverYearChanges = 0;
        
        // Loop through all consecutive year pairs to calculate year-over-year growth
        for (let i = 1; i < years.length; i++) {
          const prevYear = years[i - 1];
          const currYear = years[i];
          const prevBookings = monthData.years_data[prevYear].bookings;
          const currBookings = monthData.years_data[currYear].bookings;
          
          if (prevBookings > 0) {
            // Calculate year-over-year growth percentage
            const yoyGrowth = ((currBookings - prevBookings) / prevBookings) * 100;
            totalGrowthRate += yoyGrowth;
            yearOverYearChanges++;
          }
        }
        
        // Calculate average growth rate across all year pairs
        if (yearOverYearChanges > 0) {
          growthRate = totalGrowthRate / yearOverYearChanges;
          
          // Classify trend based on average growth rate
          if (growthRate > GROWTH_THRESHOLD) {
            trend = 'increasing';
          } else if (growthRate < -GROWTH_THRESHOLD) {
            trend = 'decreasing';
          }
        }
      }
      
      // Apply trend to prediction
      const trendMultiplier = trend === 'increasing' ? 1.1 : trend === 'decreasing' ? 0.9 : 1.0;
      const predictedBookings = Math.round(avgBookings * trendMultiplier);
      const predictedTourists = Math.round(avgTourists * trendMultiplier);
      const predictedRevenue = predictedBookings * avgRevenuePerBooking;
      
      // Debug logging for January to help diagnose calculation issues
      if (i === 0) { // January is month index 0
        console.log(`📊 January Prediction Calculation:`, {
          month_name: monthNames[i],
          historical_avg_bookings: Math.round(avgBookings),
          avgBookings_exact: avgBookings,
          trend: trend,
          growth_rate: growthRate,
          trendMultiplier: trendMultiplier,
          predicted_before_round: avgBookings * trendMultiplier,
          predicted_bookings: predictedBookings
        });
      }
      
      monthlyPredictions.push({
        month_number: i + 1,
        month_name: monthNames[i],
        historical_avg_bookings: Math.round(avgBookings),
        predicted_bookings: predictedBookings,
        predicted_tourists: predictedTourists,
        predicted_revenue: Math.round(predictedRevenue),
        trend: trend,
        growth_rate: parseFloat(growthRate.toFixed(2)),
        confidence: yearsCount >= 2 ? 'high' : 'medium',
        years_count: yearsCount,
        total_historical_bookings: monthData.total_bookings,
        years_with_data: Object.keys(monthData.years_data).map(y => parseInt(y)).sort()
      });
    }
    
    // Calculate overall average
    const totalPredictedBookings = monthlyPredictions.reduce((sum, m) => sum + m.predicted_bookings, 0);
    const avgMonthlyBookings = totalPredictedBookings / 12;
    
    // Determine peak and low seasons (threshold: +/- 25% of average)
    const peakThreshold = avgMonthlyBookings * 1.25;
    const lowThreshold = avgMonthlyBookings * 0.75;
    
    const peakMonths = [];
    const lowMonths = [];
    const moderateMonths = [];
    
    monthlyPredictions.forEach(month => {
      const classification = {
        month: month.month_name,
        month_number: month.month_number,
        predicted_bookings: month.predicted_bookings,
        predicted_tourists: month.predicted_tourists,
        predicted_revenue: month.predicted_revenue,
        trend: month.trend,
        percentage_of_average: parseFloat(((month.predicted_bookings / avgMonthlyBookings) * 100).toFixed(1))
      };
      
      if (month.predicted_bookings >= peakThreshold) {
        peakMonths.push({ ...classification, season: 'peak' });
      } else if (month.predicted_bookings <= lowThreshold) {
        lowMonths.push({ ...classification, season: 'low' });
      } else {
        moderateMonths.push({ ...classification, season: 'moderate' });
      }
    });
    
    // Sort by predicted bookings
    peakMonths.sort((a, b) => b.predicted_bookings - a.predicted_bookings);
    lowMonths.sort((a, b) => a.predicted_bookings - b.predicted_bookings);
    
    // Calculate actual lookback years from the data
    const allYears = new Set();
    for (let i = 0; i < 12; i++) {
      Object.keys(monthlyData[i].years_data).forEach(year => allYears.add(parseInt(year)));
    }
    const actualLookbackYears = allYears.size > 0 ? targetYear - Math.min(...Array.from(allYears)) : 0;
    
    console.log('📊 Lookback Years Calculation:', {
      allYearsInData: Array.from(allYears).sort(),
      minYear: allYears.size > 0 ? Math.min(...Array.from(allYears)) : 'N/A',
      targetYear: targetYear,
      actualLookbackYears: actualLookbackYears,
      calculation: `${targetYear} - ${allYears.size > 0 ? Math.min(...Array.from(allYears)) : 'N/A'} = ${actualLookbackYears}`
    });
    
    console.log('✅ Seasonal prediction generated successfully');
    
    res.json({
      success: true,
      data: {
        generated_at: new Date().toISOString(),
        target_year: targetYear,
        lookback_years: actualLookbackYears,
        historical_data_points: historicalBookings.length,
        has_sufficient_data: true,
        average_monthly_bookings: Math.round(avgMonthlyBookings),
        peak_threshold: Math.round(peakThreshold),
        low_threshold: Math.round(lowThreshold),
        months: monthlyPredictions,
        peak_months: peakMonths,
        low_months: lowMonths,
        moderate_months: moderateMonths,
        summary: {
          peak_season: peakMonths.map(m => m.month).join(', ') || 'None identified',
          low_season: lowMonths.map(m => m.month).join(', ') || 'None identified',
          total_predicted_bookings: totalPredictedBookings,
          total_predicted_revenue: monthlyPredictions.reduce((sum, m) => sum + m.predicted_revenue, 0)
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Seasonal prediction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate seasonal prediction',
      error: error.message 
    });
  }
};

// Interpret chart data using Google Gemini AI
const interpretChart = async (req, res) => {
  // Extract data outside try block so it's available in catch
  const { chartType, labels, datasets, chartTitle } = req.body;
  
  try {
    // Check if Google Generative AI package is installed
    if (!GoogleGenerativeAI) {
      return res.status(503).json({
        success: false,
        error: 'AI service package not installed. Please run: npm install @google/generative-ai'
      });
    }

    // Validate input
    if (!chartType || !labels || !datasets || !Array.isArray(labels) || !Array.isArray(datasets)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid chart data. Required: chartType, labels (array), datasets (array)'
      });
    }

    // Check if Gemini API key is configured
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error('❌ GEMINI_API_KEY not configured in environment variables');
      return res.status(500).json({
        success: false,
        error: 'AI service not configured. Please contact administrator.'
      });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use gemini-1.5-pro which is available in v1beta
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Build prompt for chart interpretation
    const datasetsInfo = datasets.map((ds, idx) => {
      return `Series ${idx + 1}: ${ds.label || 'Unnamed Series'}
  Data: ${JSON.stringify(ds.data)}`;
    }).join('\n\n');

    // Map chart types to business context for owner-friendly insights
    const chartContextMap = {
      'bookingTypeChart': 'customer booking preferences between Package Only (bundled tour packages with accommodations) and Tour Only (individual tour services without lodging)',
      'packageDistributionChart': 'which package deals are most popular with customers',
      'tourDistributionChart': 'which individual tour services customers prefer',
      'touristVolumeChart': 'how many visitors you can expect during different time periods',
      'avgBookingValueChart': 'how much customers typically spend on bookings',
      'peakBookingDaysChart': 'which days of the week receive the most bookings',
      'servicePerformanceChart': 'how each of your services is performing in terms of customer interest'
    };

    const businessContext = chartContextMap[chartTitle] || 'your business performance data';
    
    // Add specific instructions for Booking Type Comparison chart
    let additionalContext = '';
    if (chartTitle === 'bookingTypeChart') {
      additionalContext = `\n\nIMPORTANT CONTEXT FOR THIS CHART:
- "Package Only" refers to bundled tour packages that include accommodations (hotels, transient houses, etc.) along with tour activities
- "Tour Only" refers to individual tour services without lodging - customers book just the tour activities
- Compare these two booking types and explain which is more popular and why
- Discuss the revenue implications of each booking type
- Consider that Package Only bookings typically have higher values but Tour Only may have higher volume`;
    }

    const prompt = `You are analyzing ${businessContext} for a travel and tours business owner in Puerto Galera. The owner needs clear, practical insights they can act on immediately.${additionalContext}

Chart Type: ${chartType}
Chart Title: ${chartTitle || 'Analytics Chart'}
Time Periods/Labels: ${JSON.stringify(labels)}

Data Series:
${datasetsInfo}

Provide insights in plain business language (avoid technical jargon). Structure your response as:

📊 WHAT'S HAPPENING:
- Describe the main pattern or trend in simple terms
- Highlight the highest and lowest performing items/periods with specific numbers
- For Booking Type Comparison: explicitly mention Package Only vs Tour Only performance
- Mention any surprising changes or patterns

💡 WHAT THIS MEANS FOR YOUR BUSINESS:
- Explain why this matters for revenue, customer satisfaction, or operations
- Compare to what you'd typically expect (if there are notable differences)
- For Booking Type Comparison: explain the business implications of the Package Only vs Tour Only split

🎯 RECOMMENDED ACTIONS:
- Suggest 2-3 specific actions the owner can take
- Focus on practical steps like promoting certain services, adjusting pricing, or preparing for busy periods
- For Booking Type Comparison: provide specific recommendations for each booking type
- Make recommendations concrete and actionable

Use percentages and specific numbers to be precise, but explain what they mean in business terms. Keep the total response around 180-220 words. Use friendly, conversational language as if advising a business colleague.`;

    // Generate interpretation
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const interpretation = response.text();

    console.log('✅ Chart interpretation generated successfully');

    return res.json({
      success: true,
      interpretation: interpretation
    });

  } catch (error) {
    console.error('❌ Error interpreting chart with Gemini AI:', error);
    
    // Provide a fallback interpretation when AI service fails
    const fallbackInterpretation = generateFallbackInterpretation(chartType, labels, datasets, chartTitle);
    
    console.log('⚠️ Using fallback interpretation due to AI service error');
    
    return res.json({
      success: true,
      interpretation: fallbackInterpretation,
      note: 'Generated using basic analysis due to AI service unavailability.'
    });
  }
};

// Generate a basic fallback interpretation when AI service is unavailable
const generateFallbackInterpretation = (chartType, labels, datasets, chartTitle) => {
  try {
    const dataPoints = datasets[0]?.data || [];
    const total = dataPoints.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const average = dataPoints.length > 0 ? (total / dataPoints.length).toFixed(2) : 0;
    const max = Math.max(...dataPoints.map(v => parseFloat(v) || 0));
    const min = Math.min(...dataPoints.map(v => parseFloat(v) || 0));
    
    const maxIndex = dataPoints.findIndex(v => parseFloat(v) === max);
    const minIndex = dataPoints.findIndex(v => parseFloat(v) === min);
    
    let interpretation = `📊 WHAT'S HAPPENING:\n`;
    interpretation += `Your data ranges from ${min.toFixed(0)} to ${max.toFixed(0)}, with an average of ${average}. `;
    
    if (maxIndex >= 0 && labels[maxIndex]) {
      interpretation += `Your best performance is at ${labels[maxIndex]} (${max.toFixed(0)} bookings). `;
    }
    
    if (minIndex >= 0 && labels[minIndex]) {
      interpretation += `The lowest activity is at ${labels[minIndex]} (${min.toFixed(0)} bookings). `;
    }
    
    // Calculate trend
    interpretation += `\n\n💡 WHAT THIS MEANS:\n`;
    if (dataPoints.length > 1) {
      const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
      const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));
      const firstAvg = firstHalf.reduce((sum, val) => sum + (parseFloat(val) || 0), 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, val) => sum + (parseFloat(val) || 0), 0) / secondHalf.length;
      
      if (secondAvg > firstAvg * 1.1) {
        const growthPercent = ((secondAvg - firstAvg) / firstAvg * 100).toFixed(1);
        interpretation += `Great news! Your business is growing. Recent performance is ${growthPercent}% better than earlier periods. This suggests your services are gaining popularity.`;
      } else if (secondAvg < firstAvg * 0.9) {
        const declinePercent = ((firstAvg - secondAvg) / firstAvg * 100).toFixed(1);
        interpretation += `Activity has decreased by ${declinePercent}% compared to earlier periods. Consider reviewing your marketing strategy or service offerings.`;
      } else {
        interpretation += `Your business performance is stable and consistent. This is good for planning and managing resources.`;
      }
    }
    
    // Add actionable recommendations
    interpretation += `\n\n🎯 RECOMMENDED ACTIONS:\n`;
    if (max > average * 1.5 && maxIndex >= 0 && labels[maxIndex]) {
      interpretation += `• Focus marketing efforts on periods like ${labels[maxIndex]} when demand is highest\n`;
    }
    if (min < average * 0.5 && minIndex >= 0 && labels[minIndex]) {
      interpretation += `• Offer special promotions during ${labels[minIndex]} to boost bookings\n`;
    }
    interpretation += `• Monitor these trends weekly to spot opportunities early`;
    
    return interpretation;
  } catch (err) {
    return '📊 We\'re having trouble analyzing this data right now. Please check back in a few minutes or contact support if this persists.';
  }
};

module.exports = {
  getRevenue,
  getBookingsCount,
  getPopularServices,
  getBookingStatusDistribution,
  getBookingTypeComparison,
  getPackageDistribution,
  getTourDistribution,
  getRevenueByStatus,
  getServicePerformance,
  getTouristVolume,
  getHotelPerformance,
  getAvgBookingValue,
  getCancellationRate,
  getPeakBookingDays,
  getVanDestinations,
  getBookingDemandTimeseries,
  getSeasonalPrediction,
  interpretChart
};

