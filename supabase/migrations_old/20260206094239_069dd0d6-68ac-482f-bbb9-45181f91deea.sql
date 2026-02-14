
-- =============================================
-- 1. ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('boss', 'staff');
CREATE TYPE public.room_color AS ENUM ('黃', '綠', '藍', '紅');
CREATE TYPE public.indoor_space AS ENUM ('1樓客廳', '2樓大房間', '2樓小房間');
CREATE TYPE public.dog_size AS ENUM ('S', 'M', 'L');
CREATE TYPE public.activity_kind AS ENUM ('walk', 'indoor');

-- =============================================
-- 2. PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view profiles
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- Users can only update their own profile (with both USING and WITH CHECK)
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 3. USER ROLES TABLE
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view roles
CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

-- =============================================
-- 4. HELPER FUNCTION: is_boss() (no parameter needed)
-- =============================================
CREATE OR REPLACE FUNCTION public.is_boss()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'boss'
  )
$$;

-- Boss-only policies for user_roles management
CREATE POLICY "user_roles_insert_boss" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_boss());

CREATE POLICY "user_roles_update_boss" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.is_boss())
  WITH CHECK (public.is_boss());

CREATE POLICY "user_roles_delete_boss" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.is_boss());

-- =============================================
-- 5. DOGS TABLE
-- =============================================
CREATE TABLE public.dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  breed TEXT NOT NULL,
  photo_url TEXT,
  room_color public.room_color NOT NULL,
  room_number INTEGER NOT NULL CHECK (room_number >= 1 AND room_number <= 3),
  indoor_space public.indoor_space NOT NULL,
  size public.dog_size NOT NULL,
  
  -- Walking notes (JSONB for flexibility)
  walking_notes JSONB NOT NULL DEFAULT '{
    "pullsOnLeash": false,
    "reactiveToOtherDogs": false,
    "needsMuzzle": false,
    "mustWalkAlone": false,
    "notes": ""
  }'::jsonb,
  
  -- Food info
  food_info JSONB NOT NULL DEFAULT '{
    "foodType": "",
    "feedingTime": "",
    "specialInstructions": "",
    "forbiddenFood": ""
  }'::jsonb,
  
  -- Medication info
  medication_info JSONB NOT NULL DEFAULT '{
    "medicationName": "",
    "frequency": "",
    "howToGive": "",
    "notes": ""
  }'::jsonb,
  
  additional_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view dogs
CREATE POLICY "dogs_select" ON public.dogs
  FOR SELECT TO authenticated USING (true);

-- Only boss can manage dogs
CREATE POLICY "dogs_insert_boss" ON public.dogs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_boss());

CREATE POLICY "dogs_update_boss" ON public.dogs
  FOR UPDATE TO authenticated
  USING (public.is_boss())
  WITH CHECK (public.is_boss());

CREATE POLICY "dogs_delete_boss" ON public.dogs
  FOR DELETE TO authenticated
  USING (public.is_boss());

-- =============================================
-- 6. ACTIVITY RECORDS TABLE
-- =============================================
CREATE TABLE public.activity_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID REFERENCES public.dogs(id) ON DELETE CASCADE NOT NULL,
  activity_kind public.activity_kind NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_records ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view activity records
CREATE POLICY "activity_records_select" ON public.activity_records
  FOR SELECT TO authenticated USING (true);

-- All authenticated users can insert, but created_by MUST equal auth.uid()
CREATE POLICY "activity_records_insert" ON public.activity_records
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Update: owner or boss
CREATE POLICY "activity_records_update" ON public.activity_records
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_boss())
  WITH CHECK (created_by = auth.uid() OR public.is_boss());

-- Delete: owner or boss
CREATE POLICY "activity_records_delete" ON public.activity_records
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_boss());

-- =============================================
-- 7. TRIGGER: Auto-set created_by on INSERT
-- =============================================
CREATE OR REPLACE FUNCTION public.set_activity_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Always override created_by with the current user
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_activity_created_by
  BEFORE INSERT ON public.activity_records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_activity_created_by();

-- =============================================
-- 8. TRIGGER: Auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 9. TRIGGER: Auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_dogs_updated_at
  BEFORE UPDATE ON public.dogs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
