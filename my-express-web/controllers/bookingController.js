const supabase = require('../config/supabase');
const { generateNextBookingId } = require('../utils/helpers');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_CHOOSE_DESTINATIONS = ['Within Puerto Galera', 'Outside Puerto Galera'];

function isValidUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value.trim());
}

function isValidBookingId(value) {
  if (value === undefined || value === null) {
    return false;
  }

  const normalized = String(value).trim();
  return normalized.length > 0;
}

let supportsPackageOnlyIdColumn = true;
let supportsDivingTypeColumn = true;

function isMissingPackageOnlyIdColumnError(error) {
  if (!error) return false;
  const message = typeof error.message === 'string' ? error.message : '';
  const details = typeof error.details === 'string' ? error.details : '';
  return message.includes('package_only_id') || details.includes('package_only_id');
}

function isMissingDivingTypeColumnError(error) {
  if (!error) return false;
  const message = typeof error.message === 'string' ? error.message : '';
  const details = typeof error.details === 'string' ? error.details : '';
  const hint = typeof error.hint === 'string' ? error.hint : '';
  return message.includes('diving_type') || details.includes('diving_type') || hint.includes('diving_type');
}

function isMissingPricePerHeadColumnError(error) {
  if (!error) return false;
  const message = typeof error.message === 'string' ? error.message : '';
  const details = typeof error.details === 'string' ? error.details : '';
  const hint = typeof error.hint === 'string' ? error.hint : '';
  return message.includes('price_per_head') || details.includes('price_per_head') || hint.includes('price_per_head');
}

async function fetchBookingWithDetails(bookingId) {
  try {
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (bookingError) {
      throw new Error(bookingError.message || 'Failed to fetch booking');
    }

    if (!booking) {
      return null;
    }

    let hotelData = null;
    if (booking.hotel_id) {
      const { data: hotel, error: hotelError } = await supabase
        .from('hotels')
        .select('hotel_id, name, description, base_price_per_night')
        .eq('hotel_id', booking.hotel_id)
        .single();

      if (hotelError) {
        console.warn('⚠️ Failed to fetch hotel for booking:', hotelError.message);
      } else {
        hotelData = hotel;
      }
    }

    const { data: vehicleBookings = [], error: vehicleError } = await supabase
      .from('booking_vehicles')
      .select('booking_id, vehicle_id, vehicle_name, rental_days, total_amount')
      .eq('booking_id', bookingId);

    if (vehicleError) {
      throw new Error(vehicleError.message || 'Failed to fetch vehicle bookings');
    }

    const vehicleIds = [...new Set(vehicleBookings.map(v => v.vehicle_id).filter(Boolean))];
    let vehiclesMap = {};
    if (vehicleIds.length > 0) {
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('vehicle_id, name, price_per_day')
        .in('vehicle_id', vehicleIds);

      if (vehiclesError) {
        throw new Error(vehiclesError.message || 'Failed to fetch vehicles');
      }

      vehiclesMap = (vehicles || []).reduce((acc, vehicle) => {
        acc[vehicle.vehicle_id] = vehicle;
        return acc;
      }, {});
    }

    const vehicleBookingsWithDetails = (vehicleBookings || []).map(v => ({
      ...v,
      vehicle: v.vehicle_id ? vehiclesMap[v.vehicle_id] || null : null
    }));

    const { data: vanBookings = [], error: vanError } = await supabase
      .from('bookings_van_rental')
      .select('booking_id, van_destination_id, number_of_days, total_amount, trip_type, choose_destination')
      .eq('booking_id', bookingId);

    if (vanError) {
      throw new Error(vanError.message || 'Failed to fetch van rentals');
    }

    const vanDestinationIds = [...new Set(vanBookings.map(v => v.van_destination_id).filter(Boolean))];
    let vanMap = {};
    if (vanDestinationIds.length > 0) {
      const { data: vanDestinations, error: vanDestinationsError } = await supabase
        .from('van_destinations')
        .select('van_destination_id, destination_name')
        .in('van_destination_id', vanDestinationIds);

      if (vanDestinationsError) {
        throw new Error(vanDestinationsError.message || 'Failed to fetch van destinations');
      }

      vanMap = (vanDestinations || []).reduce((acc, dest) => {
        acc[dest.van_destination_id] = dest;
        return acc;
      }, {});
    }

    const vanRentalsWithDetails = (vanBookings || []).map(v => ({
      ...v,
      location_type: v.choose_destination || null,
      destination: v.van_destination_id ? vanMap[v.van_destination_id] || null : null
    }));

    let divingBookings = [];
    let divingError = null;
    const primaryDivingColumns = supportsDivingTypeColumn
      ? 'diving_id, booking_id, number_of_divers, total_amount, price_per_head, diving_type'
      : 'diving_id, booking_id, number_of_divers, total_amount, price_per_head';

    ({ data: divingBookings = [], error: divingError } = await supabase
      .from('bookings_diving')
      .select(primaryDivingColumns)
      .eq('booking_id', bookingId));

    if (divingError && divingError.code === '42703') {
      const missingDivingType = isMissingDivingTypeColumnError(divingError);
      const missingPricePerHead = isMissingPricePerHeadColumnError(divingError);

      if (missingDivingType) {
        supportsDivingTypeColumn = false;
      }

      console.warn('⚠️ Column missing in bookings_diving. Retrying without missing fields.', {
        missingDivingType,
        missingPricePerHead
      });

      let fallbackColumns = 'diving_id, booking_id, number_of_divers, total_amount';
      if (!missingPricePerHead) {
        fallbackColumns += ', price_per_head';
      }
      if (!missingDivingType && supportsDivingTypeColumn) {
        fallbackColumns += ', diving_type';
      }

      ({ data: divingBookings = [], error: divingError } = await supabase
        .from('bookings_diving')
        .select(fallbackColumns)
        .eq('booking_id', bookingId));
    }

    if (divingError) {
      console.warn('⚠️ Failed to fetch diving bookings:', divingError.message);
    }

    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .select('total_booking_amount, payment_date')
      .eq('booking_id', bookingId)
      .order('payment_date', { ascending: false })
      .limit(1);

    if (paymentError) {
      throw new Error(paymentError.message || 'Failed to fetch payment details');
    }

    const payment = paymentData && paymentData.length > 0 ? paymentData[0] : null;

    return {
      ...booking,
      hotels: hotelData,
      vehicle_bookings: vehicleBookingsWithDetails,
      van_rental_bookings: vanRentalsWithDetails,
      diving_bookings: divingBookings || [],
      total_booking_amount: payment ? payment.total_booking_amount : null,
      payment_date: payment ? payment.payment_date : null
    };
  } catch (error) {
    console.error('❌ fetchBookingWithDetails error:', error);
    throw error;
  }
}

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
    if (supportsPackageOnlyIdColumn && package_only_id) optionalFields.package_only_id = package_only_id;
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

      if (supportsPackageOnlyIdColumn && isMissingPackageOnlyIdColumnError(error)) {
        console.warn('⚠️ package_only_id column missing in bookings table. Retrying without it.');
        supportsPackageOnlyIdColumn = false;
        delete optionalFields.package_only_id;
        attempt -= 1; // retry this attempt without consuming quota
        continue;
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
            location_type: vrb.choose_destination || null,
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
    
    let divingBookingsData = {};
    if (bookingIds.length > 0) {
      let divingBookings = [];
      let divingListError = null;
      const primaryDivingColumns = supportsDivingTypeColumn
        ? 'diving_id, booking_id, number_of_divers, total_amount, price_per_head, diving_type'
        : 'diving_id, booking_id, number_of_divers, total_amount, price_per_head';

      ({ data: divingBookings = [], error: divingListError } = await supabase
        .from('bookings_diving')
        .select(primaryDivingColumns)
        .in('booking_id', bookingIds));

      if (divingListError && divingListError.code === '42703') {
        const missingDivingType = isMissingDivingTypeColumnError(divingListError);
        const missingPricePerHead = isMissingPricePerHeadColumnError(divingListError);

        if (missingDivingType) {
          supportsDivingTypeColumn = false;
        }

        console.warn('⚠️ Column missing in bookings_diving list. Retrying without missing fields.', {
          missingDivingType,
          missingPricePerHead
        });

        let fallbackColumns = 'diving_id, booking_id, number_of_divers, total_amount';
        if (!missingPricePerHead) {
          fallbackColumns += ', price_per_head';
        }
        if (!missingDivingType && supportsDivingTypeColumn) {
          fallbackColumns += ', diving_type';
        }

        ({ data: divingBookings = [], error: divingListError } = await supabase
          .from('bookings_diving')
          .select(fallbackColumns)
          .in('booking_id', bookingIds));
      }

      if (divingListError) {
        console.warn('⚠️ Failed to fetch diving bookings list:', divingListError.message);
      } else if (divingBookings) {
        divingBookingsData = divingBookings.reduce((acc, diving) => {
          if (!acc[diving.booking_id]) {
            acc[diving.booking_id] = [];
          }
          acc[diving.booking_id].push(diving);
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
        diving_bookings: divingBookingsData[booking.booking_id] || [],
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

    const bookingWithDetails = await fetchBookingWithDetails(id);

    if (!bookingWithDetails) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

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

const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status = 'pending',
      booking_type,
      number_of_tourist,
      customer_first_name,
      customer_last_name,
      customer_email,
      customer_contact,
      arrival_date,
      departure_date,
      hotel_id,
      hotel_nights,
      package_only_id,
      tour_only_id,
      booking_preferences,
      vehicles,
      van_rentals,
      diving,
      total_booking_amount,
      payment_date
    } = req.body;

    const vehicleEntries = Array.isArray(vehicles) ? vehicles : [];
    const vanRentalEntries = Array.isArray(van_rentals) ? van_rentals : [];
    const divingEntries = Array.isArray(diving) ? diving : [];

    const requiredFields = [
      { key: 'customer_first_name', value: customer_first_name },
      { key: 'customer_last_name', value: customer_last_name },
      { key: 'customer_email', value: customer_email },
      { key: 'customer_contact', value: customer_contact },
      { key: 'arrival_date', value: arrival_date },
      { key: 'departure_date', value: departure_date }
    ];

    const missingFields = requiredFields
      .filter(field => !field.value || String(field.value).trim() === '')
      .map(field => field.key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'rescheduled', 'completed'];
    const normalizedStatus = validStatuses.includes(status) ? status : 'pending';

    const normalizedBookingType = ['package_only', 'tour_only'].includes(booking_type)
      ? booking_type
      : 'package_only';

    const parseInteger = (value) => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const bookingUpdate = {
      customer_first_name: String(customer_first_name).trim(),
      customer_last_name: String(customer_last_name).trim(),
      customer_email: String(customer_email).trim(),
      customer_contact: String(customer_contact).trim(),
      arrival_date,
      departure_date,
      booking_preferences: booking_preferences ? String(booking_preferences).trim() : '',
      booking_type: normalizedBookingType,
      status: normalizedStatus,
      number_of_tourist: parseInteger(number_of_tourist),
      hotel_id: hotel_id ? String(hotel_id).trim() : null,
      hotel_nights: parseInteger(hotel_nights)
    };

    // Add package_only_id or tour_only_id based on booking type
    if (supportsPackageOnlyIdColumn && normalizedBookingType === 'package_only') {
      bookingUpdate.package_only_id = package_only_id ? String(package_only_id).trim() : null;
    } else if (supportsPackageOnlyIdColumn && normalizedBookingType === 'tour_only') {
      bookingUpdate.package_only_id = null; // Clear package ID for tour bookings when supported
    }

    console.log('📝 Booking update payload:', JSON.stringify(bookingUpdate, null, 2));

    let updatePayload = { ...bookingUpdate };
    if (!supportsPackageOnlyIdColumn) {
      delete updatePayload.package_only_id;
    }

    let updatedBooking;
    let bookingError;

    ({ data: updatedBooking, error: bookingError } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('booking_id', id)
      .select()
      .single());

    if (bookingError && supportsPackageOnlyIdColumn && isMissingPackageOnlyIdColumnError(bookingError)) {
      console.warn('⚠️ package_only_id column missing in bookings table. Retrying update without it.');
      supportsPackageOnlyIdColumn = false;
      delete updatePayload.package_only_id;
      ({ data: updatedBooking, error: bookingError } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('booking_id', id)
        .select()
        .single());
    }

    if (bookingError) {
      console.error('❌ Error updating booking:', bookingError);
      console.error('❌ Error details:', {
        message: bookingError.message,
        details: bookingError.details,
        hint: bookingError.hint,
        code: bookingError.code
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to update booking',
        error: bookingError.message,
        details: bookingError.details,
        hint: bookingError.hint
      });
    }

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const bookingIdNormalized = String(id).trim();
    const { data: deletedVehicles, error: deleteVehiclesError } = await supabase
      .from('booking_vehicles')
      .delete()
      .match({ booking_id: bookingIdNormalized })
      .select('booking_id');

    if (deleteVehiclesError) {
      console.error('❌ Error clearing vehicle bookings:', deleteVehiclesError);
      return res.status(500).json({
        success: false,
        message: 'Failed to reset vehicle bookings',
        error: deleteVehiclesError.message
      });
    }

    console.log('🧹 Cleared vehicle bookings count:', deletedVehicles ? deletedVehicles.length : 0, 'for booking', id);

    const vehicleRows = vehicleEntries
      .map(entry => {
        if (!entry) return null;
        const normalizedVehicleId = entry.vehicle_id !== undefined && entry.vehicle_id !== null
          ? String(entry.vehicle_id).trim()
          : '';

        if (!normalizedVehicleId) {
          return null;
        }

        return {
          booking_id: bookingIdNormalized,
          vehicle_id: normalizedVehicleId,
          vehicle_name: entry.vehicle_name ? String(entry.vehicle_name).trim() : normalizedVehicleId,
          rental_days: parseInteger(entry?.rental_days) || 0,
          total_amount: Number(entry?.total_amount) || 0
        };
      })
      .filter(Boolean);

    if (vehicleRows.length > 0) {
      console.log('🚚 Vehicle rows to insert:', JSON.stringify(vehicleRows, null, 2));

      const { error: insertVehiclesError } = await supabase
        .from('booking_vehicles')
        .insert(vehicleRows);

      if (insertVehiclesError) {
        console.error('❌ Error inserting vehicle bookings:', {
          message: insertVehiclesError.message,
          details: insertVehiclesError.details,
          hint: insertVehiclesError.hint,
          code: insertVehiclesError.code
        });
        return res.status(500).json({
          success: false,
          message: 'Failed to save vehicle bookings',
          error: insertVehiclesError.message,
          details: insertVehiclesError.details,
          hint: insertVehiclesError.hint,
          code: insertVehiclesError.code
        });
      }
    }

    const { data: deletedVans, error: deleteVanError } = await supabase
      .from('bookings_van_rental')
      .delete()
      .match({ booking_id: bookingIdNormalized })
      .select('booking_id');

    if (deleteVanError) {
      console.error('❌ Error clearing van rentals:', deleteVanError);
      return res.status(500).json({
        success: false,
        message: 'Failed to reset van rentals',
        error: deleteVanError.message
      });
    }

    console.log('🧹 Cleared van rentals count:', deletedVans ? deletedVans.length : 0, 'for booking', id);

    console.log('🚐 Raw van rental entries:', JSON.stringify(vanRentalEntries, null, 2));

    const normalizeStringValue = (value) => {
      if (value === undefined || value === null) return '';
      const trimmed = String(value).trim();
      if (trimmed === '' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
        return '';
      }
      return trimmed;
    };

    const parseChooseDestinationOption = (value) => {
      const normalized = normalizeStringValue(value);
      if (!normalized) return '';
      const lower = normalized.toLowerCase();

      for (const option of ALLOWED_CHOOSE_DESTINATIONS) {
        if (option.toLowerCase() === lower) {
          return option;
        }
      }

      if (lower.includes('within')) {
        return 'Within Puerto Galera';
      }
      if (lower.includes('outside')) {
        return 'Outside Puerto Galera';
      }

      return '';
    };

    const destinationIds = Array.from(new Set(
      (vanRentalEntries || [])
        .map(entry => normalizeStringValue(entry?.van_destination_id))
        .filter(Boolean)
    ));

    let destinationChooseMap = {};
    if (destinationIds.length > 0) {
      const { data: destinationRows, error: destinationFetchError } = await supabase
        .from('van_destinations')
        .select('van_destination_id, location_type')
        .in('van_destination_id', destinationIds);

      if (destinationFetchError) {
        console.error('⚠️ Failed to fetch van destinations for choose_destination mapping:', destinationFetchError);
      } else if (destinationRows) {
        destinationChooseMap = destinationRows.reduce((acc, row) => {
          const key = normalizeStringValue(row.van_destination_id);
          const resolved = parseChooseDestinationOption(row.location_type);
          if (key && resolved) {
            acc[key] = resolved;
          }
          return acc;
        }, {});
      }
    }

    const vanRows = [];
    for (const entry of vanRentalEntries) {
      if (!entry) {
        continue;
      }

      const tripTypeRaw = entry.trip_type ? String(entry.trip_type).toLowerCase() : '';
      const normalizedVanDestinationId = normalizeStringValue(entry.van_destination_id);
      const normalizedChooseDestination = normalizeStringValue(entry.choose_destination);

      if (!normalizedVanDestinationId && !normalizedChooseDestination) {
        continue;
      }

      let chooseDestinationValue = '';
      if (normalizedVanDestinationId) {
        chooseDestinationValue = destinationChooseMap[normalizedVanDestinationId] || ALLOWED_CHOOSE_DESTINATIONS[0];
      } else {
        chooseDestinationValue = parseChooseDestinationOption(normalizedChooseDestination);
        if (!chooseDestinationValue) {
          return res.status(400).json({
            success: false,
            message: `Invalid choose_destination value: "${normalizedChooseDestination}". Expected one of: ${ALLOWED_CHOOSE_DESTINATIONS.join(', ')}`
          });
        }
      }

      const numberOfDays = parseInteger(entry.number_of_days);
      const totalAmount = Number.isFinite(Number(entry.total_amount)) ? Number(entry.total_amount) : 0;

      vanRows.push({
        booking_id: bookingIdNormalized,
        van_destination_id: normalizedVanDestinationId || null,
        choose_destination: chooseDestinationValue,
        trip_type: tripTypeRaw === 'roundtrip' ? 'roundtrip' : 'oneway',
        number_of_days: Number.isFinite(numberOfDays) ? numberOfDays : 0,
        total_amount: totalAmount
      });
    }

    if (vanRows.length > 0) {
      console.log('🚐 Van rental rows to insert:', JSON.stringify(vanRows, null, 2));

      const { error: insertVanError } = await supabase
        .from('bookings_van_rental')
        .insert(vanRows);

      if (insertVanError) {
        console.error('❌ Error inserting van rentals:', {
          message: insertVanError.message,
          details: insertVanError.details,
          hint: insertVanError.hint,
          code: insertVanError.code
        });
        return res.status(500).json({
          success: false,
          message: 'Failed to save van rentals',
          error: insertVanError.message,
          details: insertVanError.details,
          hint: insertVanError.hint,
          code: insertVanError.code
        });
      }
    }

    const { data: deletedDiving, error: deleteDivingError } = await supabase
      .from('bookings_diving')
      .delete()
      .match({ booking_id: bookingIdNormalized })
      .select('booking_id');

    if (deleteDivingError) {
      console.error('❌ Error clearing diving bookings:', deleteDivingError);
      return res.status(500).json({
        success: false,
        message: 'Failed to reset diving bookings',
        error: deleteDivingError.message
      });
    }

    console.log('🧹 Cleared diving bookings count:', deletedDiving ? deletedDiving.length : 0, 'for booking', id);

    const divingRows = divingEntries
      .map(entry => {
        if (!entry) return null;

        const numberOfDivers = parseInteger(entry.number_of_divers);
        const pricePerHeadRaw = Number(entry.price_per_head);
        const totalAmountRaw = Number(entry.total_amount);
        const normalizedDivingType = entry.diving_type ? String(entry.diving_type).trim() : null;

        const row = {
          booking_id: bookingIdNormalized,
          number_of_divers: Number.isFinite(numberOfDivers) ? numberOfDivers : 0,
          price_per_head: Number.isFinite(pricePerHeadRaw) ? pricePerHeadRaw : 0,
          total_amount: Number.isFinite(totalAmountRaw) ? totalAmountRaw : 0,
          booking_type: normalizedBookingType
        };

        if (normalizedDivingType) {
          row.diving_type = normalizedDivingType;
        }

        return row;
      })
      .filter(entry => entry && (
        (Number.isFinite(entry.number_of_divers) && entry.number_of_divers > 0) ||
        (Number.isFinite(entry.total_amount) && entry.total_amount > 0) ||
        (Number.isFinite(entry.price_per_head) && entry.price_per_head > 0) ||
        (entry.diving_type && entry.diving_type.length > 0)
      ));

    if (divingRows.length > 0) {
      const stripDivingTypeColumn = (rows) => rows.map(row => {
        if (!row || typeof row !== 'object' || row.diving_type === undefined) return row;
        const { diving_type, ...rest } = row;
        return rest;
      });

      let rowsToInsert = supportsDivingTypeColumn ? divingRows : stripDivingTypeColumn(divingRows);
      let insertDivingError = null;

      const performInsert = async () => {
        const { error } = await supabase
          .from('bookings_diving')
          .insert(rowsToInsert);
        return error;
      };

      insertDivingError = await performInsert();

      if (insertDivingError && isMissingDivingTypeColumnError(insertDivingError)) {
        console.warn('⚠️ diving_type column missing during insert. Retrying without it.');
        supportsDivingTypeColumn = false;
        rowsToInsert = stripDivingTypeColumn(divingRows);
        insertDivingError = await performInsert();
      }

      if (insertDivingError) {
        console.error('❌ Error inserting diving bookings:', insertDivingError);
        return res.status(500).json({
          success: false,
          message: 'Failed to save diving bookings',
          error: insertDivingError.message
        });
      }
    }

    const providedTotal = total_booking_amount !== undefined && total_booking_amount !== null && total_booking_amount !== ''
      ? Number(total_booking_amount)
      : null;

    const isProvidedTotalValid = Number.isFinite(providedTotal);

    const vehiclesSum = vehicleEntries.reduce((sum, entry) => {
      const value = Number(entry?.total_amount);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    const vanSum = vanRentalEntries.reduce((sum, entry) => {
      const value = Number(entry?.total_amount);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    const divingSum = divingEntries.reduce((sum, entry) => {
      const value = Number(entry?.total_amount);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    const fallbackTotal = vehiclesSum + vanSum + divingSum;
    const finalTotal = isProvidedTotalValid ? providedTotal : (fallbackTotal > 0 ? fallbackTotal : null);
    const normalizedPaymentDate = payment_date ? String(payment_date) : null;

    if (finalTotal !== null || normalizedPaymentDate) {
      const paymentPayload = {
        booking_id: bookingIdNormalized,
        total_booking_amount: finalTotal
      };

      if (normalizedPaymentDate) {
        paymentPayload.payment_date = normalizedPaymentDate;
      }

      const { data: existingPayment, error: fetchPaymentError } = await supabase
        .from('payments')
        .select('payment_id')
        .eq('booking_id', bookingIdNormalized)
        .maybeSingle();

      if (fetchPaymentError) {
        console.error('❌ Error fetching payment:', fetchPaymentError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch payment information',
          error: fetchPaymentError.message
        });
      }

      if (existingPayment) {
        const { error: updatePaymentError } = await supabase
          .from('payments')
          .update(paymentPayload)
          .eq('payment_id', existingPayment.payment_id);

        if (updatePaymentError) {
          console.error('❌ Error updating payment:', updatePaymentError);
          return res.status(500).json({
            success: false,
            message: 'Failed to update payment information',
            error: updatePaymentError.message
          });
        }
      } else {
        const { error: insertPaymentError } = await supabase
          .from('payments')
          .insert([paymentPayload]);

        if (insertPaymentError) {
          console.error('❌ Error inserting payment:', insertPaymentError);
          return res.status(500).json({
            success: false,
            message: 'Failed to save payment information',
            error: insertPaymentError.message
          });
        }
      }
    } else {
      const { error: deletePaymentError } = await supabase
        .from('payments')
        .delete()
        .eq('booking_id', bookingIdNormalized);

      if (deletePaymentError) {
        console.warn('⚠️ Failed to delete payment record:', deletePaymentError.message);
      }
    }

    const detailedBooking = await fetchBookingWithDetails(id);

    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking: detailedBooking
    });
  } catch (error) {
    console.error('❌ Booking update error:', error);
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

// Delete specific vehicle booking
const deleteVehicleBooking = async (req, res) => {
  try {
    const { booking_id, vehicle_id } = req.params;
    const normalizedBookingId = typeof booking_id === 'string' ? booking_id.trim() : '';
    const normalizedVehicleId = typeof vehicle_id === 'string' ? vehicle_id.trim() : '';

    console.log(`📝 Deleting vehicle booking: booking_id=${booking_id}, vehicle_id=${vehicle_id}`);
    
    if (!normalizedBookingId || !normalizedVehicleId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters: booking_id and vehicle_id' 
      });
    }

    if (!isValidBookingId(normalizedBookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking_id.'
      });
    }
    
    const { data, error } = await supabase
      .from('booking_vehicles')
      .delete()
      .match({ booking_id: normalizedBookingId, vehicle_id: normalizedVehicleId })
      .select();
    
    if (error) {
      console.error('❌ Error deleting vehicle booking:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete vehicle booking', 
        error: error.message 
      });
    }
    
    console.log('✅ Vehicle booking deleted successfully:', data);
    
    res.json({ 
      success: true, 
      message: 'Vehicle booking deleted successfully',
      deleted: data
    });
    
  } catch (error) {
    console.error('❌ Vehicle booking deletion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Delete specific van rental booking
const deleteVanRentalBooking = async (req, res) => {
  try {
    const { booking_id, van_destination_id } = req.params;
    const normalizedBookingId = typeof booking_id === 'string' ? booking_id.trim() : '';
    const normalizedVanDestinationId = typeof van_destination_id === 'string' ? van_destination_id.trim() : '';

    console.log(`📝 Deleting van rental booking: booking_id=${booking_id}, van_destination_id=${van_destination_id}`);
    
    if (!normalizedBookingId || !normalizedVanDestinationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters: booking_id and van_destination_id' 
      });
    }

    if (!isValidBookingId(normalizedBookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking_id.'
      });
    }
    
    const { data, error } = await supabase
      .from('bookings_van_rental')
      .delete()
      .match({ booking_id: normalizedBookingId, van_destination_id: normalizedVanDestinationId })
      .select();
    
    if (error) {
      console.error('❌ Error deleting van rental booking:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete van rental booking', 
        error: error.message 
      });
    }
    
    console.log('✅ Van rental booking deleted successfully:', data);
    
    res.json({ 
      success: true, 
      message: 'Van rental booking deleted successfully',
      deleted: data
    });
    
  } catch (error) {
    console.error('❌ Van rental booking deletion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Delete specific diving booking
const deleteDivingBooking = async (req, res) => {
  try {
    const { booking_id, diving_id } = req.params;
    const normalizedBookingId = typeof booking_id === 'string' ? booking_id.trim() : '';
    const parsedDivingId = diving_id !== undefined ? Number.parseInt(diving_id, 10) : undefined;

    console.log(`📝 Deleting diving booking: booking_id=${booking_id}, diving_id=${diving_id}`);
    
    if (!normalizedBookingId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameter: booking_id' 
      });
    }

    if (!isValidBookingId(normalizedBookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking_id.'
      });
    }

    if (diving_id !== undefined && Number.isNaN(parsedDivingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid diving_id. Expected a numeric value.'
      });
    }
    
    // If diving_id is provided, delete specific diving booking, otherwise delete by booking_id only
    let query = supabase.from('bookings_diving').delete();
    
    if (diving_id !== undefined) {
      query = query.match({ booking_id: normalizedBookingId, diving_id: parsedDivingId });
    } else {
      query = query.match({ booking_id: normalizedBookingId });
    }
    
    const { data, error } = await query.select();
    
    if (error) {
      console.error('❌ Error deleting diving booking:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete diving booking', 
        error: error.message 
      });
    }
    
    console.log('✅ Diving booking deleted successfully:', data);
    
    res.json({ 
      success: true, 
      message: 'Diving booking deleted successfully',
      deleted: data
    });
    
  } catch (error) {
    console.error('❌ Diving booking deletion error:', error);
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
  updateBooking,
  updateBookingStatus,
  deleteBooking,
  createTourBooking,
  createVehicleBooking,
  createDivingBooking,
  createVanRentalBooking,
  createPackageBooking,
  deleteVehicleBooking,
  deleteVanRentalBooking,
  deleteDivingBooking
};

