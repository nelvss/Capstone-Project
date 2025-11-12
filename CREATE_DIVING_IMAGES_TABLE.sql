-- Create diving_images table for multiple images per diving record
CREATE TABLE IF NOT EXISTS public.diving_images (
    image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diving_id UUID NOT NULL REFERENCES public.diving(diving_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT diving_images_diving_id_fkey FOREIGN KEY (diving_id) REFERENCES public.diving(diving_id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_diving_images_diving_id ON public.diving_images(diving_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.diving_images ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Enable all access for diving_images" ON public.diving_images
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Optional: Migrate existing single images from diving table to diving_images table
-- Run this only if you want to migrate existing images
INSERT INTO public.diving_images (diving_id, image_url)
SELECT diving_id, diving_image
FROM public.diving
WHERE diving_image IS NOT NULL 
  AND diving_image != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.diving_images di 
    WHERE di.diving_id = diving.diving_id 
    AND di.image_url = diving.diving_image
  );

-- Verify the table was created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'diving_images'
ORDER BY ordinal_position;
