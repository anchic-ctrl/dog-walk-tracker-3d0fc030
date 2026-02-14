-- Create enum for poop status
CREATE TYPE public.poop_status AS ENUM ('normal', 'watery', 'unformed');

-- Add poop_status column to activity_records
ALTER TABLE public.activity_records
ADD COLUMN poop_status public.poop_status DEFAULT NULL;