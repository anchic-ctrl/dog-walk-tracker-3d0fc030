-- 1. Add indoor_notes JSONB to dogs table for storing diapger/pad requirements
ALTER TABLE public.dogs 
ADD COLUMN IF NOT EXISTS indoor_notes JSONB DEFAULT '{"requiresPeePad": false, "requiresDiaper": false}'::jsonb;

-- 2. Add toilet_location to activity_records for indoor play
ALTER TABLE public.activity_records 
ADD COLUMN IF NOT EXISTS toilet_location TEXT;
