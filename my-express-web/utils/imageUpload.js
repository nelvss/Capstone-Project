const supabase = require('../config/supabase');
const { sanitizeIdentifier, sanitizeFileStem } = require('./helpers');

async function uploadImageToStorage({
  imageData,
  fileName,
  bucket,
  keyPrefix = '',
  identifier = 'file'
}) {
  if (!imageData || !fileName) {
    const error = new Error('Missing image data or filename');
    error.statusCode = 400;
    throw error;
  }

  let mimeType = 'application/octet-stream';
  const mimeMatch = imageData.match(/^data:(.*?);base64,/);
  if (mimeMatch && mimeMatch[1]) {
    mimeType = mimeMatch[1].toLowerCase();
  }

  const base64Data = imageData.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const fileExtension = (fileName.split('.').pop() || '').toLowerCase();
  const extensionToMime = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    bmp: 'image/bmp',
    heic: 'image/heic',
    heif: 'image/heif'
  };
  const mimeToExtension = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/heic': 'heic',
    'image/heif': 'heif'
  };

  if (mimeType === 'image/jpg') {
    mimeType = 'image/jpeg';
  }

  const allowedMimes = new Set(Object.keys(mimeToExtension));
  if (!allowedMimes.has(mimeType)) {
    const mapped = extensionToMime[fileExtension];
    if (mapped) {
      mimeType = mapped;
    }
  }

  let finalExtension = fileExtension || 'bin';
  if (allowedMimes.has(mimeType)) {
    finalExtension = mimeToExtension[mimeType] || finalExtension;
  }

  const sanitizedIdentifier = sanitizeIdentifier(identifier, 'file');
  const sanitizedStem = sanitizeFileStem(fileName);
  const prefix = keyPrefix ? `${keyPrefix.replace(/\/+$/, '')}/` : '';
  const uniqueFileName = `${prefix}${sanitizedIdentifier}-${sanitizedStem}-${Date.now()}.${finalExtension}`;

  console.log(`📤 Uploading image to bucket "${bucket}" as ${uniqueFileName} (MIME: ${mimeType})`);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(uniqueFileName, buffer, {
      contentType: mimeType,
      upsert: false
    });

  if (uploadError) {
    console.error('❌ Storage upload error:', uploadError);
    const error = new Error('Failed to upload image to storage');
    error.statusCode = 500;
    error.details = uploadError;
    throw error;
  }

  const { data: urlData, error: urlError } = supabase.storage
    .from(bucket)
    .getPublicUrl(uniqueFileName);

  if (urlError) {
    console.error('❌ Error retrieving public URL:', urlError);
    const error = new Error('Failed to retrieve public URL for image');
    error.statusCode = 500;
    error.details = urlError;
    throw error;
  }

  console.log('✅ Image uploaded successfully');

  return {
    publicUrl: urlData.publicUrl,
    filePath: uniqueFileName,
    mimeType
  };
}

module.exports = { uploadImageToStorage };

