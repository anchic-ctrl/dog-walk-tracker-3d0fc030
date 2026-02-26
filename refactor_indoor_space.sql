-- 1. Remove indoor_space from dogs table
ALTER TABLE public.dogs DROP COLUMN IF EXISTS indoor_space;

-- 2. Add indoor_space to activity_records table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'indoor_space') THEN
        CREATE TYPE public.indoor_space AS ENUM ('1樓客廳', '2樓大房間', '2樓小房間');
    END IF;
END $$;

ALTER TABLE public.activity_records 
ADD COLUMN IF NOT EXISTS indoor_space public.indoor_space;
