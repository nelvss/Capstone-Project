# Supabase Storage Setup for Receipt Images

## Step 1: Create Storage Bucket in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"Create a new bucket"**
4. Enter the following details:
   - **Bucket Name**: `receipts`
   - **Public Bucket**: Check this box (receipts need to be publicly accessible)
   - **File Size Limit**: 5 MB (or adjust as needed)
   - **Allowed MIME Types**: Leave empty or add: `image/jpeg, image/png, image/webp, application/pdf`

5. Click **"Create bucket"**

## Step 2: Set Bucket Policies (Optional - for security)

If you want to restrict access, you can set up policies:

1. Go to **Storage** > **Policies** > Click **"receipts"** bucket
2. Add a policy for uploads:
   - Policy name: `Allow authenticated uploads`
   - Allowed operation: `INSERT`
   - Policy definition: `bucket_id = 'receipts' AND auth.role() = 'authenticated'`

## Step 3: Restart Your Express Server

After creating the storage bucket, restart your Express server to ensure the new endpoint is loaded:

```bash
# In your terminal, stop the server (Ctrl+C) and restart:
cd my-express-web
npm start
```

## Step 4: Test the Upload

1. Create a new booking from the user site
2. Upload a receipt image during payment
3. Check that the image URL is stored in the database
4. View the payment in the Owner/Staff dashboard
5. The receipt should now display correctly!

## Troubleshooting

### Error: "Storage object not found"
- Make sure you created the `receipts` bucket in Supabase Storage
- Verify the bucket is set to **Public**

### Error: "Failed to upload receipt image"
- Check that the file size is under 5 MB
- Verify the file format is supported (jpg, png, webp, pdf)
- Check server console for detailed error messages

### Images not showing in dashboard
- Verify the `receipt_image_url` field in the database contains the full Supabase Storage URL
- Check browser console for 404 errors on image URLs
- Ensure the bucket is set to Public

