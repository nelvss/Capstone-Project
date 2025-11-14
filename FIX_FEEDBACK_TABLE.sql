-- =====================================================
-- FIX FEEDBACK TABLE - Ensure proper structure and permissions
-- =====================================================
-- Execute this in your Supabase SQL Editor to fix feedback deletion issues

-- Step 1: Check if feedback table exists and view its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'feedback' 
ORDER BY ordinal_position;

-- Step 2: Ensure feedback_id is the primary key and is UUID type
-- If the table doesn't have the correct structure, this will help identify the issue

-- Step 3: Check for any Row Level Security (RLS) policies that might prevent deletion
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'feedback';

-- Step 4: Temporarily disable RLS for feedback table (if needed for testing)
-- UNCOMMENT THE LINE BELOW ONLY IF YOU NEED TO TEST WITHOUT RLS
-- ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;

-- Step 5: If feedback table doesn't exist, create it with proper structure
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    anonymous_name VARCHAR(255) DEFAULT 'Anonymous',
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    image_url TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Enable RLS but allow all operations (adjust as needed for your security requirements)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Step 7: Create policies to allow all operations (modify based on your requirements)
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations on feedback" ON feedback;

-- Create a permissive policy that allows all operations
CREATE POLICY "Allow all operations on feedback" ON feedback
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Alternative: If you want authenticated users only, use this instead:
-- DROP POLICY IF EXISTS "Allow authenticated users to manage feedback" ON feedback;
-- CREATE POLICY "Allow authenticated users to manage feedback" ON feedback
--     FOR ALL
--     TO authenticated
--     USING (true)
--     WITH CHECK (true);

-- Step 8: Grant necessary permissions to authenticated and anon roles
GRANT ALL ON feedback TO authenticated;
GRANT ALL ON feedback TO anon;

-- Step 9: Verify the table structure
SELECT 
    c.column_name, 
    c.data_type, 
    c.is_nullable,
    c.column_default,
    tc.constraint_type
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu 
    ON c.table_name = kcu.table_name 
    AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc 
    ON kcu.constraint_name = tc.constraint_name
WHERE c.table_name = 'feedback'
ORDER BY c.ordinal_position;

-- Step 10: Test query to see existing feedback IDs
SELECT feedback_id, anonymous_name, date, 
       LEFT(message, 50) as message_preview
FROM feedback 
ORDER BY date DESC 
LIMIT 10;

-- =====================================================
-- TROUBLESHOOTING NOTES
-- =====================================================
-- If deletion still fails after running this script:
-- 1. Check the server logs for the exact error message
-- 2. Try deleting directly in Supabase dashboard to test RLS policies
-- 3. Verify the feedback_id being sent matches exactly (UUID format)
-- 4. Check if there are any foreign key constraints preventing deletion
-- =====================================================
