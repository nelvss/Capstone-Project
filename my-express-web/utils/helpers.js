const supabase = require('../config/supabase');

function sanitizeIdentifier(value, fallback = 'file') {
  if (!value) {
    return fallback;
  }
  const cleaned = value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return cleaned || fallback;
}

function sanitizeFileStem(fileName) {
  if (!fileName) {
    return 'image';
  }
  const stem = fileName
    .toString()
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return stem || 'image';
}

function normalizeVehicleId(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.toString().trim();

  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    const numericId = Number(trimmed);
    return Number.isFinite(numericId) ? numericId : null;
  }

  return trimmed;
}

// Helper to generate a unique booking ID with format YY-XXXX
async function generateNextBookingId() {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const prefix = `${currentYear}-`;

  // Fetch latest booking_id for current year, order desc to get the highest counter
  const { data: rows, error } = await supabase
    .from('bookings')
    .select('booking_id')
    .ilike('booking_id', `${prefix}%`)
    .order('booking_id', { ascending: false })
    .limit(1);

  if (error) {
    console.warn('⚠️ Could not query latest booking_id, defaulting to 001:', error.message);
  }

  let nextCounter = 1;
  if (rows && rows.length > 0) {
    const latestId = rows[0].booking_id || '';
    const match = latestId.match(/^(\d{2})-(\d{4,})$/);
    if (match) {
      const lastCounter = parseInt(match[2], 10) || 0;
      nextCounter = lastCounter + 1;
    }
  }

  const padded = String(nextCounter).padStart(4, '0');
  return `${prefix}${padded}`;
}

// Helper function to fix vehicle image URLs to include vehicles/ folder
function fixVehicleImageUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return url;
  }
  
  // If URL already contains /vehicles/, return as is
  if (url.includes('/vehicles/')) {
    return url;
  }
  
  // Extract the filename from the URL
  // Format: https://...supabase.co/storage/v1/object/public/vehicle-rental/filename.jpg
  // Should become: https://...supabase.co/storage/v1/object/public/vehicle-rental/vehicles/filename.jpg
  const bucketName = 'vehicle-rental';
  const bucketPattern = new RegExp(`/${bucketName}/([^/]+)$`);
  const match = url.match(bucketPattern);
  
  if (match && match[1]) {
    const filename = match[1];
    // Reconstruct URL with vehicles/ folder
    const baseUrl = url.substring(0, url.indexOf(`/${bucketName}/`));
    const newUrl = `${baseUrl}/${bucketName}/vehicles/${filename}`;
    return newUrl;
  }
  
  // If pattern doesn't match, return original URL
  return url;
}

// Helper function to fix diving image URLs to include diving/ folder
function fixDivingImageUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return url;
  }
  
  if (url.includes('/diving/')) {
    return url;
  }
  
  const bucketName = 'diving-image';
  const bucketPattern = new RegExp(`/${bucketName}/([^/]+)$`);
  const match = url.match(bucketPattern);
  
  if (match && match[1]) {
    const filename = match[1];
    const baseUrl = url.substring(0, url.indexOf(`/${bucketName}/`));
    const newUrl = `${baseUrl}/${bucketName}/diving/${filename}`;
    return newUrl;
  }
  
  return url;
}

// Helper function to normalize diving ID
function normalizeDivingId(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.toString().trim();

  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    const numericId = Number(trimmed);
    return Number.isFinite(numericId) ? numericId : null;
  }

  return trimmed;
}

// Helper function to normalize QRCode ID (supports UUIDs)
function normalizeQrcodeId(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.toString().trim();

  if (!trimmed) {
    return null;
  }

  // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (uuidRegex.test(trimmed)) {
    return trimmed; // Return UUID as-is
  }

  // Also support numeric IDs if they exist
  if (/^\d+$/.test(trimmed)) {
    const numericId = Number(trimmed);
    return Number.isFinite(numericId) && numericId > 0 ? numericId : null;
  }

  return null;
}

// Helper function to normalize Tour ID
function normalizeTourId(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.toString().trim();

  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    const numericId = Number(trimmed);
    return Number.isFinite(numericId) ? numericId : null;
  }

  return trimmed;
}

module.exports = {
  sanitizeIdentifier,
  sanitizeFileStem,
  normalizeVehicleId,
  generateNextBookingId,
  fixVehicleImageUrl,
  fixDivingImageUrl,
  normalizeDivingId,
  normalizeQrcodeId,
  normalizeTourId
};

