-- Add indoor_notes JSONB to dogs
ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS indoor_notes JSONB DEFAULT '{"requiresPeePad": false, "requiresDiaper": false}'::jsonb;

-- Adjust pee_status enum
ALTER TYPE public.pee_status ADD VALUE IF NOT EXISTS 'pad';
ALTER TYPE public.pee_status ADD VALUE IF NOT EXISTS 'diaper';

