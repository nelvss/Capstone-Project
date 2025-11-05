const supabase = require('../config/supabase');
const { generateNextBookingId } = require('../utils/helpers');

// Create main booking record
const createBooking = async (req, res) => {
  try {
    const { 
      customer_first_name,
      customer_last_name,
      customer_email, 
      customer_contact, 
      booking_type,
      booking_preferences,
      arrival_date, 
      departure_date, 
      number_of_tourist,
      package_only_id,
      hotel_id, 
      hotel_nights,
      booking_id,
      status = 'pending'
    } = req.body;
    
    console.log('📝 Creating new booking:', { customer_first_name, customer_last_name, customer_email, arrival_date, departure_date });
    
    if (!customer_first_name || !customer_last_name || !customer_email || !customer_contact || 
        !booking_type || !booking_preferences || !arrival_date || !departure_date || !number_of_tourist) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: customer_first_name, customer_last_name, customer_email, customer_contact, booking_type, booking_preferences, arrival_date, departure_date, number_of_tourist' 
      });
    }
    
    if (!['package_only', 'tour_only'].includes(booking_type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid booking_type. Must be either "package_only" or "tour_only"' 
      });
    }
    
    let resolvedBookingId = booking_id && String(booking_id).trim() ? String(booking_id).trim() : await generateNextBookingId();
    const bookingDataBase = {
      customer_first_name,
      customer_last_name,
      customer_email,
      customer_contact,
      booking_type,
      booking_preferences,
      arrival_date,
      departure_date,
      number_of_tourist,
      status
    };
    
    const optionalFields = {};
    if (package_only_id) optionalFields.package_only_id = package_only_id;
    if (hotel_id) optionalFields.hotel_id = hotel_id;
    if (hotel_nights) optionalFields.hotel_nights = hotel_nights;

    let attempt = 0;
    const maxAttempts = 5;
    while (attempt < maxAttempts) {
      attempt += 1;
      const bookingData = { booking_id: resolvedBookingId, ...bookingDataBase, ...optionalFields };

      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select();

      if (!error) {
        console.log('✅ Booking created successfully:', data[0]);
        return res.json({ 
          success: true, 
          message: 'Booking created successfully',
          booking: data[0]
        });
      }

      if (error && error.code === '23505') {
        console.warn(`⚠️ Duplicate booking_id (${resolvedBookingId}). Generating a new one and retrying...`);
        resolvedBookingId = await generateNextBookingId();
        continue;
      }

      console.error('❌ Error creating booking:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create booking', 
        error: error.message 
      });
    }

    return res.status(409).json({
      success: false,
      message: 'Could not allocate a unique booking ID after several attempts'
    });
    
  } catch (error) {
    console.error('❌ Booking creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get all bookings (for dashboards)
const getBookings = async (req, res) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;
    
    console.log('📊 Fetching bookings with filters:', { status, limit, offset });
    
    let query = supabase
      .from('bookings')
      .select('*')
      .order('arrival_date', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: bookings, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching bookings:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch bookings', 
        error: error.message 
      });
    }
    
    const hotelIds = [...new Set(bookings.map(b => b.hotel_id).filter(id => id))];
    let hotelsData = {};
    if (hotelIds.length > 0) {
      const { data: hotels } = await supabase
        .from('hotels')
        .select('hotel_id, name, description, base_price_per_night')
        .in('hotel_id', hotelIds);
      
      if (hotels) {
        hotelsData = hotels.reduce((acc, hotel) => {
          acc[hotel.hotel_id] = hotel;
          return acc;
        }, {});
      }
    }
    
    const bookingIds = bookings.map(b => b.booking_id);
    let vehicleBookingsData = {};
    if (bookingIds.length > 0) {
      const { data: vehicleBookings } = await supabase
        .from('booking_vehicles')
        .select('booking_id, vehicle_id, vehicle_name, rental_days, total_amount')
        .in('booking_id', bookingIds);
      
      if (vehicleBookings) {
        const vehicleIds = [...new Set(vehicleBookings.map(vb => vb.vehicle_id).filter(id => id))];
        let vehiclesData = {};
        if (vehicleIds.length > 0) {
          const { data: vehicles } = await supabase
            .from('vehicles')
            .select('vehicle_id, name, price_per_day')
            .in('vehicle_id', vehicleIds);
          
          if (vehicles) {
            vehiclesData = vehicles.reduce((acc, vehicle) => {
              acc[vehicle.vehicle_id] = vehicle;
              return acc;
            }, {});
          }
        }
        
        vehicleBookingsData = vehicleBookings.reduce((acc, vb) => {
          if (!acc[vb.booking_id]) {
            acc[vb.booking_id] = [];
          }
          acc[vb.booking_id].push({
            ...vb,
            vehicle: vb.vehicle_id ? vehiclesData[vb.vehicle_id] : null
          });
          return acc;
        }, {});
      }
    }
    
    let vanRentalBookingsData = {};
    if (bookingIds.length > 0) {
      const normalizedBookingIds = bookingIds.map(id => String(id).trim()).filter(id => id);
      
      const { data: vanRentalBookings } = await supabase
        .from('bookings_van_rental')
        .select('booking_id, van_destination_id, number_of_days, total_amount, trip_type, choose_destination')
        .in('booking_id', normalizedBookingIds);
      
      if (vanRentalBookings) {
        const vanDestinationIds = [...new Set(vanRentalBookings.map(vrb => vrb.van_destination_id).filter(id => id))];
        let vanDestinationsData = {};
        if (vanDestinationIds.length > 0) {
          const { data: vanDestinations } = await supabase
            .from('van_destinations')
            .select('van_destination_id, destination_name')
            .in('van_destination_id', vanDestinationIds);
          
          if (vanDestinations) {
            vanDestinationsData = vanDestinations.reduce((acc, dest) => {
              acc[dest.van_destination_id] = dest;
              return acc;
            }, {});
          }
        }
        
        vanRentalBookingsData = vanRentalBookings.reduce((acc, vrb) => {
          const normalizedKey = String(vrb.booking_id).trim();
          if (!acc[normalizedKey]) {
            acc[normalizedKey] = [];
          }
          acc[normalizedKey].push({
            ...vrb,
            destination: vrb.van_destination_id ? vanDestinationsData[vrb.van_destination_id] : null
          });
          return acc;
        }, {});
      }
    }
    
    let paymentsData = {};
    if (bookingIds.length > 0) {
      const { data: payments } = await supabase
        .from('payments')
        .select('booking_id, total_booking_amount, payment_date')
        .in('booking_id', bookingIds)
        .order('payment_date', { ascending: false });
      
      if (payments) {
        paymentsData = payments.reduce((acc, payment) => {
          if (!acc[payment.booking_id]) {
            acc[payment.booking_id] = payment.total_booking_amount;
          }
          return acc;
        }, {});
      }
    }
    
    const bookingsWithDetails = bookings.map(booking => {
      const normalizedBookingId = String(booking.booking_id).trim();
      const vanRentals = vanRentalBookingsData[normalizedBookingId] || [];
      const vanRentalsFallback = vanRentals.length === 0 ? (vanRentalBookingsData[booking.booking_id] || []) : vanRentals;
      
      return {
        ...booking,
        hotels: booking.hotel_id ? hotelsData[booking.hotel_id] : null,
        vehicle_bookings: vehicleBookingsData[booking.booking_id] || [],
        van_rental_bookings: vanRentalsFallback,
        total_booking_amount: paymentsData[booking.booking_id] || null
      };
    });
    
    console.log('✅ Bookings fetched successfully:', bookingsWithDetails?.length || 0, 'bookings');
    
    res.json({ 
      success: true, 
      bookings: bookingsWithDetails || []
    });
    
  } catch (error) {
    console.error('❌ Bookings fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get single booking details
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📊 Fetching booking details for ID:', id);
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_id', id)
      .single();
    
    if (error) {
      console.error('❌ Error fetching booking:', error);
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found', 
        error: error.message 
      });
    }
    
    let hotelData = null;
    if (booking.hotel_id) {
      const { data: hotel } = await supabase
        .from('hotels')
        .select('hotel_id, name, description, base_price_per_night')
        .eq('hotel_id', booking.hotel_id)
        .single();
      
      if (hotel) {
        hotelData = hotel;
      }
    }
    
    let vehicleBookingsData = [];
    const { data: vehicleBookings } = await supabase
      .from('booking_vehicles')
      .select('booking_id, vehicle_id, vehicle_name, rental_days, total_amount')
      .eq('booking_id', booking.booking_id);
    
    if (vehicleBookings && vehicleBookings.length > 0) {
      const vehicleIds = [...new Set(vehicleBookings.map(vb => vb.vehicle_id).filter(id => id))];
      let vehiclesData = {};
      if (vehicleIds.length > 0) {
        const { data: vehicles } = await supabase
          .from('vehicles')
          .select('vehicle_id, name, price_per_day')
          .in('vehicle_id', vehicleIds);
        
        if (vehicles) {
          vehiclesData = vehicles.reduce((acc, vehicle) => {
            acc[vehicle.vehicle_id] = vehicle;
            return acc;
          }, {});
        }
      }
      
      vehicleBookingsData = vehicleBookings.map(vb => ({
        ...vb,
        vehicle: vb.vehicle_id ? vehiclesData[vb.vehicle_id] : null
      }));
    }
    
    const bookingWithDetails = {
      ...booking,
      hotels: hotelData,
      vehicle_bookings: vehicleBookingsData
    };
    
    console.log('✅ Booking details fetched successfully');
    
    res.json({ 
      success: true, 
      booking: bookingWithDetails
    });
    
  } catch (error) {
    console.error('❌ Booking fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    console.log(`📝 Updating booking status for ID: ${id} to: ${status}`);
    
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'rescheduled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
      });
    }
    
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('booking_id', id)
      .select();
    
    if (error) {
      console.error('❌ Error updating booking status:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update booking status', 
        error: error.message 
      });
    }
    
    if (!data || data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }
    
    console.log('✅ Booking status updated successfully');
    
    res.json({ 
      success: true, 
      message: 'Booking status updated successfully',
      booking: data[0]
    });
    
  } catch (error) {
    console.error('❌ Booking status update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Delete booking
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📝 Deleting booking with ID: ${id}`);
    
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('booking_id', id);
    
    if (error) {
      console.error('❌ Error deleting booking:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete booking', 
        error: error.message 
      });
    }
    
    console.log('✅ Booking deleted successfully');
    
    res.json({ 
      success: true, 
      message: 'Booking deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Booking deletion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Create tour booking
const createTourBooking = async (req, res) => {
  try {
    const { booking_id, tour_type, tourist_count, tour_date, total_price, notes = '' } = req.body;
    
    console.log('📝 Creating tour booking:', { booking_id, tour_type, tourist_count });
    
    if (!booking_id || !tour_type || !tourist_count || !tour_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: booking_id, tour_type, tourist_count, tour_date' 
      });
    }
    
    const { data, error } = await supabase
      .from('booking_tour')
      .insert([{
        booking_id,
        tour_type,
        tourist_count,
        tour_date,
        total_price: total_price || 0,
        notes,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error('❌ Error creating tour booking:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create tour booking', 
        error: error.message 
      });
    }
    
    console.log('✅ Tour booking created successfully');
    
    res.json({ 
      success: true, 
      message: 'Tour booking created successfully',
      tour_booking: data[0]
    });
    
  } catch (error) {
    console.error('❌ Tour booking creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Create vehicle booking
const createVehicleBooking = async (req, res) => {
  try {
    const { booking_id, vehicle_id, vehicle_name, rental_days, total_amount } = req.body;
    
    console.log('📝 Creating vehicle booking:', { booking_id, vehicle_id, vehicle_name, rental_days });
    
    if (!booking_id || !rental_days) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: booking_id, rental_days' 
      });
    }
    
    if (!vehicle_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'vehicle_id is required - vehicle must be found in database' 
      });
    }
    
    const bookingData = {
      booking_id,
      vehicle_id,
      rental_days,
      total_amount: total_amount || 0
    };
    
    if (vehicle_name) {
      bookingData.vehicle_name = vehicle_name;
    }
    
    const { data, error } = await supabase
      .from('booking_vehicles')
      .insert([bookingData])
      .select();
    
    if (error) {
      console.error('❌ Error creating vehicle booking:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create vehicle booking', 
        error: error.message 
      });
    }
    
    console.log('✅ Vehicle booking created successfully');
    
    res.json({ 
      success: true, 
      message: 'Vehicle booking created successfully',
      vehicle_booking: data[0]
    });
    
  } catch (error) {
    console.error('❌ Vehicle booking creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Create diving booking
const createDivingBooking = async (req, res) => {
  try {
    const { booking_id, number_of_divers, total_amount, booking_type = 'package_only' } = req.body;
    
    console.log('📝 Creating diving booking:', { booking_id, number_of_divers, total_amount, booking_type });
    
    if (!booking_id || !number_of_divers || total_amount === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: booking_id, number_of_divers, total_amount' 
      });
    }
    
    if (!['package_only', 'tour_only'].includes(booking_type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid booking_type. Must be either "package_only" or "tour_only"' 
      });
    }
    
    const { data, error } = await supabase
      .from('bookings_diving')
      .insert([{
        booking_id,
        number_of_divers,
        total_amount: total_amount || 0,
        booking_type
      }])
      .select();
    
    if (error) {
      console.error('❌ Error creating diving booking:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create diving booking', 
        error: error.message 
      });
    }
    
    console.log('✅ Diving booking created successfully');
    
    res.json({ 
      success: true, 
      message: 'Diving booking created successfully',
      diving_booking: data[0]
    });
    
  } catch (error) {
    console.error('❌ Diving booking creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Create van rental booking
const createVanRentalBooking = async (req, res) => {
  try {
    const { 
      booking_id, 
      destination_id,
      van_destination_id,
      number_of_days,
      rental_days, 
      total_amount,
      total_price,
      trip_type,
      choose_destination
    } = req.body;
    
    console.log('📝 Van rental booking request received');
    
    const finalDestinationId = van_destination_id || destination_id;
    const finalDays = number_of_days || rental_days;
    const finalAmount = total_amount || total_price || 0;
    
    if (!booking_id || !finalDestinationId || !finalDays) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: booking_id, van_destination_id (or destination_id), number_of_days (or rental_days)',
        received: { booking_id, van_destination_id: finalDestinationId, number_of_days: finalDays }
      });
    }
    
    const insertData = {
      booking_id,
      van_destination_id: finalDestinationId,
      number_of_days: finalDays,
      total_amount: finalAmount,
      trip_type: trip_type || 'oneway',
      choose_destination: choose_destination || ''
    };
    
    const { data, error } = await supabase
      .from('bookings_van_rental')
      .insert([insertData])
      .select();
    
    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create van rental booking', 
        error: error.message,
        errorCode: error.code,
        errorDetails: error.details
      });
    }
    
    console.log('✅ Van rental booking created successfully:', data[0]);
    
    res.json({ 
      success: true, 
      message: 'Van rental booking created successfully',
      van_rental_booking: data[0]
    });
    
  } catch (error) {
    console.error('❌ Van rental booking creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Create package booking
const createPackageBooking = async (req, res) => {
  try {
    const { booking_id, package_id, package_name, package_price, notes = '' } = req.body;
    
    console.log('📝 Creating package booking:', { booking_id, package_id, package_name });
    
    if (!booking_id || !package_id || !package_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: booking_id, package_id, package_name' 
      });
    }
    
    const { data, error } = await supabase
      .from('package_only')
      .insert([{
        booking_id,
        package_id,
        package_name,
        package_price: package_price || 0,
        notes,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error('❌ Error creating package booking:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create package booking', 
        error: error.message 
      });
    }
    
    console.log('✅ Package booking created successfully');
    
    res.json({ 
      success: true, 
      message: 'Package booking created successfully',
      package_booking: data[0]
    });
    
  } catch (error) {
    console.error('❌ Package booking creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
  createTourBooking,
  createVehicleBooking,
  createDivingBooking,
  createVanRentalBooking,
  createPackageBooking
};

