# How to Fix Supabase Service Role Key Issue

## Problem
You deleted the service role key from your Supabase project. The backend server needs this key to access the database.

## Solution

### Step 1: Access Your Supabase Dashboard
Go to: **https://app.supabase.com**

### Step 2: Open Your Project
Look for a project with URL: `https://jdxgljucrsjpglvthhrw.supabase.co`

⚠️ **IMPORTANT**: If you can't find this project, it might be:
- Paused due to inactivity (free tier limitation)
- Deleted
- You need to create a new project

### Step 3: Check Project Status
- If the project shows "Paused", click **"Restore Project"** or **"Resume"**
- This may take a few minutes

### Step 4: Get the Service Role Key
1. Go to **Settings** → **API**
2. Scroll to **"Service Role Key"** section
3. Click **"Reveal"** or **"Copy"**
4. Copy the entire key (it's very long, starts with `eyJhbG...`)

### Step 5: Update Your .env File
Open: `my-express-web/.env`

Update the `SUPABASE_KEY` with your new service role key:

```env
SUPABASE_URL=https://jdxgljucrsjpglvthhrw.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_NEW_KEY_HERE
```

### Step 6: Restart Your Server
```bash
# Stop the server (Ctrl+C in terminal)
# Then restart:
npm start
```

### Step 7: Verify It Works
Try logging in again. The error should be gone!

---

## Alternative: If Project Doesn't Exist

If you can't find the project or it was deleted:

### Option A: Create New Supabase Project
1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in project details
4. Copy the new project URL and service role key
5. Update your `.env` file with the new values
6. Re-run your database setup scripts

### Option B: Use Existing Project
If you have another Supabase project:
1. Get its URL and service role key
2. Update your `.env` file
3. Make sure your database tables exist in that project

---

## Security Note

⚠️ **NEVER** commit your `.env` file to Git!
- The service role key has full access to your database
- Keep it secret and secure
- Only use it on the backend server

---

## Still Having Issues?

If the DNS resolution error persists (`ENOTFOUND jdxgljucrsjpglvthhrw.supabase.co`):

1. Verify your project is not paused
2. Check your internet connection
3. Try accessing https://jdxgljucrsjpglvthhrw.supabase.co in your browser
4. If it doesn't load, the project was deleted or the URL is wrong

