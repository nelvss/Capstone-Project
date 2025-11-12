# Van Images Implementation Guide

## Overview
This document outlines the implementation of the `van_images` table and `van-images` storage bucket integration with the Settings Van Rental tab and the home page van rental card.

## Database Structure

### Table: `van_images`
- `van_images_id` (Primary Key): UUID/Auto-generated ID
- `image_url` (Text): URL of the image stored in Supabase storage

### Storage Bucket: `van-images`
- Stores van rental images
- Public access for displaying on the website

## Backend Implementation

### 1. Controller Updates (`vanDestinationController.js`)

Added three new functions:

#### `getVanImages()`
- **Route**: `GET /api/van-images`
- **Purpose**: Fetch all van images from the database
- **Returns**: Array of van image objects with `van_images_id` and `image_url`

#### `uploadVanImage()`
- **Route**: `POST /api/van-images/upload`
- **Purpose**: Upload a new van image
- **Body**: 
  ```json
  {
    "imageData": "base64-encoded-image",
    "fileName": "image-name.jpg"
  }
  ```
- **Process**:
  1. Uploads image to `van-images` bucket using `uploadImageToStorage` utility
  2. Inserts image URL into `van_images` table
  3. Returns the created image object

#### `deleteVanImage()`
- **Route**: `DELETE /api/van-images/:imageId`
- **Purpose**: Delete a van image
- **Process**:
  1. Fetches image from database to get the URL
  2. Deletes the record from `van_images` table
  3. Attempts to delete the file from storage (optional, warns on failure)
  4. Returns success confirmation

### 2. Routes Updates (`vanDestinationRoutes.js`)

Added three new routes:
```javascript
router.get('/van-images', getVanImages);
router.post('/van-images/upload', uploadVanImage);
router.delete('/van-images/:imageId', deleteVanImage);
```

## Frontend Implementation

### 1. Settings Page (`settings.html`)

Added a new section before the van destinations list:

```html
<div class="van-images-section mb-4">
  <div class="section-heading">
    <div>
      <h3>Van Rental Images</h3>
      <p class="section-subtitle">Manage images for the van rental service...</p>
    </div>
    <div class="vehicle-actions-bar">
      <button id="van-upload-image-btn" class="btn-primary">📷 Upload Image</button>
      <input type="file" id="van-image-file-input" accept="image/*" hidden>
      <button id="van-images-refresh-btn" class="btn-secondary">↻ Refresh Images</button>
      <span id="van-images-sync-status" class="vehicle-sync-status">Images: loading...</span>
    </div>
  </div>
  <div id="van-images-error" class="vehicle-error" role="alert" hidden></div>
  <div id="van-images-gallery" class="tour-images-gallery"></div>
</div>
```

### 2. Settings JavaScript (`settings.js`)

Added van images management system:

#### State Management
```javascript
const vanImagesState = {
  data: [],
  lastSynced: null,
  isLoading: false
};

const vanImagesUI = {
  gallery: null,
  error: null,
  syncStatus: null,
  refreshBtn: null,
  uploadBtn: null,
  fileInput: null
};
```

#### Key Functions

**`loadVanImages()`**
- Fetches van images from API
- Updates state and UI
- Renders images in gallery

**`renderVanImages()`**
- Creates image cards with preview and delete button
- Displays "No images" message when empty
- Each image card has:
  - Image preview
  - Delete button

**`handleUploadVanImage(file)`**
- Converts file to base64
- Sends to API for upload
- Updates UI with new image
- Shows success message

**`handleDeleteVanImage(imageId, imageCard)`**
- Confirms deletion with user
- Calls delete API endpoint
- Removes from state and DOM with animation
- Shows success message

**`initializeVanImagesManager()`**
- Initializes UI elements
- Sets up event listeners for upload and refresh
- Loads initial images

### 3. Home Page (`home.js`)

Updated `loadVanRental()` function to:

1. **Fetch Van Images**: Makes an additional API call to `/van-images`
2. **Update Carousel**: 
   - If images exist in database, populates carousel with database images
   - Falls back to hardcoded images (`Commuter.jpg`, `Grandia.jpg`) if no images found
3. **Update Gallery**: 
   - Updates `serviceImages['Van Rental']` array for the image gallery modal
4. **Error Handling**: Gracefully handles image loading failures

## Features

### Settings Page Features
✅ **Upload Images**: Click "Upload Image" button to select and upload van rental photos
✅ **View Gallery**: See all uploaded van images in a grid layout
✅ **Delete Images**: Remove individual images with confirmation
✅ **Real-time Status**: Shows number of images and last sync time
✅ **Error Handling**: Clear error messages for upload/delete failures

### Home Page Features
✅ **Dynamic Carousel**: Automatically displays images from database
✅ **Fallback Images**: Uses default images if no database images available
✅ **Image Gallery**: Click "More Info" to see all van images in a modal gallery
✅ **Smooth Integration**: Works seamlessly with existing van destinations display

## Usage Instructions

### For Administrators (Settings Page)

1. **Navigate to Settings > Van Rental tab**
2. **Upload Images**:
   - Click "📷 Upload Image" button
   - Select an image file (JPG, PNG, etc.)
   - Wait for upload confirmation
   - Image appears in the gallery

3. **Delete Images**:
   - Click the "🗑️" button on any image
   - Confirm deletion
   - Image is removed immediately

4. **Refresh Images**:
   - Click "↻ Refresh Images" to reload from database

### For Users (Home Page)

1. **View Van Rental Card**:
   - Scroll to "Rentals" section
   - See "Van Rental" card with image carousel
   - Carousel automatically cycles through uploaded images

2. **View Image Gallery**:
   - Click "More Info" button on van rental card
   - Click "📸 View Image Gallery" link
   - Browse all van images in full-screen modal

## Technical Notes

### Image Upload Process
1. User selects file in browser
2. File is read as base64 data URL
3. Base64 data and filename sent to API
4. API extracts base64, uploads to Supabase storage
5. Storage returns public URL
6. URL is saved in `van_images` table
7. Success response returns image object to frontend

### Storage Bucket Configuration
Ensure the `van-images` bucket in Supabase has:
- **Public Access**: Enabled (for displaying images on website)
- **File Size Limit**: Configured appropriately (e.g., 5MB per image)
- **Allowed File Types**: Image formats (JPEG, PNG, GIF, WebP)

### API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/van-images` | Fetch all van images |
| POST | `/api/van-images/upload` | Upload new van image |
| DELETE | `/api/van-images/:imageId` | Delete van image |
| GET | `/api/van-destinations` | Fetch van destinations (existing) |

## Styling

Uses existing CSS classes from the tour images system:
- `.tour-images-gallery`: Grid container for images
- `.tour-image-card`: Individual image card
- `.tour-image-preview`: Image preview styling
- `.tour-image-delete-btn`: Delete button styling

## Future Enhancements

Potential improvements:
- [ ] Image reordering/sorting
- [ ] Image captions/descriptions
- [ ] Multiple image upload at once
- [ ] Image compression before upload
- [ ] Lazy loading for better performance
- [ ] Admin approval workflow for images

## Troubleshooting

### Images Not Showing on Home Page
1. Check if images exist in database (Settings page)
2. Verify storage bucket public access settings
3. Check browser console for API errors
4. Confirm API base URL is correct

### Upload Failing
1. Check file size (should be under limit)
2. Verify file format is supported
3. Check storage bucket permissions
4. Review server logs for errors

### Delete Not Working
1. Confirm image ID is valid
2. Check database permissions
3. Review API error messages
4. Verify storage bucket delete permissions

## Testing Checklist

- [x] Upload single image
- [x] Upload multiple images
- [x] Delete image
- [x] Refresh images list
- [x] View images on home page
- [x] View images in gallery modal
- [x] Fallback to default images
- [x] Error handling for failed uploads
- [x] Error handling for failed deletes

## Conclusion

The van images system is now fully integrated with:
- ✅ Backend API endpoints
- ✅ Database table (`van_images`)
- ✅ Storage bucket (`van-images`)
- ✅ Settings page management interface
- ✅ Home page dynamic display
- ✅ Image gallery modal

Users can now manage van rental images through the settings page, and visitors will see these images automatically on the home page van rental card.
