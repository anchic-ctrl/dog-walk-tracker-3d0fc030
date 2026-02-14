-- Create storage bucket for dog photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dog-photos', 'dog-photos', true);

-- Create RLS policies for dog photos bucket
CREATE POLICY "Anyone can view dog photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'dog-photos');

CREATE POLICY "Active members can upload dog photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'dog-photos' 
  AND auth.uid() IN (
    SELECT user_id FROM public.members 
    WHERE status = 'active' AND user_id IS NOT NULL
  )
);

CREATE POLICY "Active members can update dog photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'dog-photos' 
  AND auth.uid() IN (
    SELECT user_id FROM public.members 
    WHERE status = 'active' AND user_id IS NOT NULL
  )
);

CREATE POLICY "Active members can delete dog photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'dog-photos' 
  AND auth.uid() IN (
    SELECT user_id FROM public.members 
    WHERE status = 'active' AND user_id IS NOT NULL
  )
);