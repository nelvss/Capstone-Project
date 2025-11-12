# Socket.IO Integration Guide

## Overview
Socket.IO has been integrated into the Express server for real-time communication between clients and the server.

## Server Setup (Already Configured)
The server is configured with Socket.IO in `server.js` with the following features:
- ✅ CORS configured for your domains
- ✅ WebSocket and polling transports
- ✅ Connection/disconnection logging
- ✅ Event listeners for bookings, payments, and analytics

## Client-Side Integration

### Step 1: Add Socket.IO Client Library
Add this script to your HTML files where you need real-time updates:

```html
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
```

### Step 2: Connect to Socket.IO Server

#### For Owner Dashboard (dashboard.html, analytics.html, payment.html)
```javascript
// Add this to your JavaScript file
const socket = io('https://otgpuertogaleratravel.com', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

// Listen for new bookings
socket.on('booking-update', (data) => {
  console.log('New booking received:', data);
  // Update your dashboard UI
  refreshBookings();
});

// Listen for payment updates
socket.on('payment-status-changed', (data) => {
  console.log('Payment status changed:', data);
  // Update payment UI
  refreshPayments();
});

// Listen for analytics updates
socket.on('analytics-refresh', () => {
  console.log('Analytics update received');
  // Refresh analytics data
  loadAnalytics();
});
```

#### For Staff Dashboard (staff_dashboard.html, staff_payment.html)
```javascript
const socket = io('https://otgpuertogaleratravel.com', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Staff connected:', socket.id);
});

// Listen for booking updates
socket.on('booking-update', (data) => {
  // Update staff dashboard with new booking
  showNotification('New Booking Received!');
  refreshBookingList();
});

// Listen for payment updates
socket.on('payment-status-changed', (data) => {
  showNotification('Payment Status Updated');
  refreshPaymentList();
});
```

#### For User Booking Form (booking_form.html)
```javascript
const socket = io('https://otgpuertogaleratravel.com', {
  transports: ['websocket', 'polling']
});

// Emit when a new booking is created
function submitBooking(bookingData) {
  // Your existing booking submission code
  fetch('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(response => response.json())
  .then(data => {
    // Emit socket event to notify staff/owner
    socket.emit('new-booking', {
      bookingId: data.id,
      customerName: bookingData.name,
      timestamp: new Date().toISOString()
    });
  });
}
```

## Use Cases

### 1. Real-Time Booking Notifications
When a user submits a booking, staff and owner dashboards receive instant notifications.

### 2. Payment Status Updates
When payment status changes, all relevant dashboards are updated in real-time.

### 3. Live Analytics Updates
Analytics dashboard can receive real-time updates without manual refresh.

### 4. Availability Updates
When a vehicle or tour slot is booked, availability can be updated across all connected clients.

## Server-Side Event Emission

### Example: Emit from Controller
In your controllers, you can emit events like this:

```javascript
// In bookingController.js
const createBooking = async (req, res) => {
  try {
    // Your booking creation logic
    const newBooking = await createBookingInDB(req.body);
    
    // Get Socket.IO instance
    const io = req.app.get('io');
    
    // Emit to all connected clients
    io.emit('booking-update', {
      type: 'new',
      booking: newBooking
    });
    
    res.json({ success: true, data: newBooking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

## Available Socket Events

### Client → Server Events
- `new-booking`: Emit when a new booking is created
- `payment-update`: Emit when payment status changes
- `analytics-update`: Request analytics refresh

### Server → Client Events
- `booking-update`: Broadcasted when bookings change
- `payment-status-changed`: Broadcasted when payment status updates
- `analytics-refresh`: Broadcasted to trigger analytics reload

## Testing Socket.IO

### Test Connection in Browser Console
```javascript
const socket = io('https://otgpuertogaleratravel.com');
socket.on('connect', () => console.log('Connected!'));
socket.emit('new-booking', { test: 'data' });
```

## Deployment Notes

### On Hostinger VPS
1. ✅ Socket.IO is already installed
2. ✅ Server code is configured
3. ⚠️ Ensure firewall allows WebSocket connections (port 3000)
4. ⚠️ Restart the Node.js server after deploying changes

### Restart Server
```bash
pm2 restart all
# or
pm2 restart your-app-name
```

## Next Steps

1. **Update Frontend Files**: Add Socket.IO client to your HTML pages
2. **Test Locally**: Test the connection before deploying
3. **Deploy**: Push changes to VPS and restart server
4. **Monitor**: Check server logs for Socket.IO connections

## Troubleshooting

### Connection Issues
- Check CORS configuration in server.js
- Verify Socket.IO client version matches server version
- Check browser console for connection errors
- Ensure firewall allows WebSocket connections

### Events Not Firing
- Check event names match exactly (case-sensitive)
- Verify socket is connected before emitting
- Check server logs for received events

## Security Considerations

- Consider adding authentication to socket connections
- Validate all incoming socket events
- Implement rate limiting for socket events
- Use rooms/namespaces for better organization
