-- =============================================
-- 0. CLEANUP (Ensure fresh start)
-- =============================================
-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_link_member ON auth.users;

-- Drop tables (cascading will handle foreign keys and their triggers)
DROP TABLE IF EXISTS public.activity_records CASCADE;
DROP TABLE IF EXISTS public.dogs CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.link_member_on_signup CASCADE;
DROP FUNCTION IF EXISTS public.set_activity_created_by CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at CASCADE;
DROP FUNCTION IF EXISTS public.validate_invitation CASCADE;
DROP FUNCTION IF EXISTS public.transfer_super_admin CASCADE;
DROP FUNCTION IF EXISTS public.is_active_member CASCADE;
DROP FUNCTION IF EXISTS public.is_admin CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin CASCADE;
DROP FUNCTION IF EXISTS public.protect_super_admin_change CASCADE;

-- Drop types
DROP TYPE IF EXISTS public.room_color CASCADE;

DROP TYPE IF EXISTS public.indoor_space CASCADE;
DROP TYPE IF EXISTS public.dog_size CASCADE;
DROP TYPE IF EXISTS public.activity_kind CASCADE;
DROP TYPE IF EXISTS public.member_role CASCADE;
DROP TYPE IF EXISTS public.member_status CASCADE;
DROP TYPE IF EXISTS public.pee_status CASCADE;
DROP TYPE IF EXISTS public.poop_status CASCADE;

-- =============================================
-- 1. ENUMS
-- =============================================
CREATE TYPE public.room_color AS ENUM ('黃', '綠', '藍', '紅');
CREATE TYPE public.indoor_space AS ENUM ('1樓客廳', '2樓大房間', '2樓小房間');
CREATE TYPE public.dog_size AS ENUM ('S', 'M', 'L');
CREATE TYPE public.activity_kind AS ENUM ('walk', 'indoor');
CREATE TYPE public.member_role AS ENUM ('admin', 'staff');
CREATE TYPE public.member_status AS ENUM ('invited', 'active', 'disabled');
CREATE TYPE public.pee_status AS ENUM ('yes', 'no');
CREATE TYPE public.poop_status AS ENUM ('normal', 'watery', 'unformed', 'none');

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

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 3. MEMBERS TABLE
-- =============================================
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role member_role NOT NULL DEFAULT 'staff',
  status member_status NOT NULL DEFAULT 'invited',
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  invited_by UUID REFERENCES public.members(id),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one active super_admin allowed
CREATE UNIQUE INDEX only_one_active_super_admin 
  ON public.members (is_super_admin) 
  WHERE is_super_admin = true AND status = 'active';

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. DOGS TABLE
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
  walking_notes JSONB NOT NULL DEFAULT '{
    "pullsOnLeash": false,
    "reactiveToOtherDogs": false,
    "needsMuzzle": false,
    "mustWalkAlone": false,
    "notes": ""
  }'::jsonb,
  food_info JSONB NOT NULL DEFAULT '{
    "foodType": "",
    "feedingTime": "",
    "specialInstructions": "",
    "forbiddenFood": ""
  }'::jsonb,
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

-- =============================================
-- 5. ACTIVITY RECORDS TABLE
-- =============================================
CREATE TABLE public.activity_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID REFERENCES public.dogs(id) ON DELETE CASCADE NOT NULL,
  activity_kind public.activity_kind NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  pee_status public.pee_status DEFAULT NULL,
  poop_status public.poop_status DEFAULT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_records ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. HELPER FUNCTIONS
-- =============================================

-- Check if current user is an active member
CREATE OR REPLACE FUNCTION public.is_active_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.members
    WHERE user_id = auth.uid()
      AND status = 'active'
  )
$$;

-- Check if current user is admin (includes super_admin)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.members
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND (role = 'admin' OR is_super_admin = true)
  )
$$;

-- Check if current user is specifically super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.members
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND is_super_admin = true
  )
$$;

-- Validate invitation (used by edge function)
CREATE OR REPLACE FUNCTION public.validate_invitation(invite_email TEXT)
RETURNS TABLE (
  status TEXT,
  member_id UUID,
  invited_by_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member RECORD;
  v_inviter_name TEXT;
BEGIN
  SELECT m.* INTO v_member
  FROM public.members m
  WHERE LOWER(m.email) = LOWER(invite_email)
  LIMIT 1;

  IF v_member IS NULL THEN
    RETURN QUERY SELECT 'NOT_FOUND'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  IF v_member.invited_by IS NOT NULL THEN
    SELECT p.display_name INTO v_inviter_name
    FROM public.profiles p
    JOIN public.members inv ON inv.user_id = p.user_id
    WHERE inv.id = v_member.invited_by;
  END IF;

  IF v_member.status = 'active' THEN
    RETURN QUERY SELECT 'ALREADY_ACTIVATED'::TEXT, v_member.id, v_inviter_name;
  ELSIF v_member.status = 'disabled' THEN
    RETURN QUERY SELECT 'DISABLED'::TEXT, v_member.id, v_inviter_name;
  ELSIF v_member.expires_at IS NOT NULL AND v_member.expires_at < now() THEN
    RETURN QUERY SELECT 'EXPIRED'::TEXT, v_member.id, v_inviter_name;
  ELSE
    RETURN QUERY SELECT 'VALID'::TEXT, v_member.id, v_inviter_name;
  END IF;
END;
$$;

-- Transfer super admin role
CREATE OR REPLACE FUNCTION public.transfer_super_admin(target_member_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_super_id UUID;
  target_status member_status;
  target_role member_role;
BEGIN
  SELECT id INTO current_super_id
  FROM public.members
  WHERE user_id = auth.uid()
    AND is_super_admin = true
    AND status = 'active';

  IF current_super_id IS NULL THEN
    RAISE EXCEPTION 'Only the current super_admin can transfer the role.';
  END IF;

  SELECT m.status, m.role INTO target_status, target_role
  FROM public.members m
  WHERE m.id = target_member_id;

  IF target_status IS NULL THEN
    RAISE EXCEPTION 'Target member not found.';
  END IF;

  IF target_status != 'active' THEN
    RAISE EXCEPTION 'Target member must be active.';
  END IF;

  IF target_role != 'admin' THEN
    RAISE EXCEPTION 'Target must be an admin.';
  END IF;

  PERFORM set_config('app.transfer_super_admin', 'allowed', true);

  UPDATE public.members SET is_super_admin = false, updated_at = now()
  WHERE id = current_super_id;

  UPDATE public.members SET is_super_admin = true, updated_at = now()
  WHERE id = target_member_id;

  PERFORM set_config('app.transfer_super_admin', '', true);
END;
$$;

-- =============================================
-- 7. TRIGGERS
-- =============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
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

-- Auto-set created_by on activity insert
CREATE OR REPLACE FUNCTION public.set_activity_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_activity_created_by
  BEFORE INSERT ON public.activity_records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_activity_created_by();

-- Auto-create profile on signup
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

-- Link member on signup (case-insensitive)
CREATE OR REPLACE FUNCTION public.link_member_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.members
  SET 
    user_id = NEW.id,
    status = 'active',
    updated_at = now()
  WHERE LOWER(email) = LOWER(NEW.email)
    AND status = 'invited';
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_link_member
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_member_on_signup();

-- Protect super admin changes
CREATE OR REPLACE FUNCTION public.protect_super_admin_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.transfer_super_admin', true) = 'allowed' THEN
    RETURN NEW;
  END IF;

  IF OLD.is_super_admin IS DISTINCT FROM NEW.is_super_admin THEN
    RAISE EXCEPTION 'Cannot directly modify is_super_admin. Use transfer_super_admin() function.';
  END IF;

  IF OLD.is_super_admin = true AND OLD.status = 'active' AND NEW.status != 'active' THEN
    RAISE EXCEPTION 'Cannot disable super_admin. Transfer super_admin role first.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_super_admin_change_trigger
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_super_admin_change();

-- =============================================
-- 8. RLS POLICIES - MEMBERS
-- =============================================

CREATE POLICY "members_select"
  ON public.members FOR SELECT
  TO authenticated
  USING (is_active_member());

CREATE POLICY "members_insert"
  ON public.members FOR INSERT
  TO authenticated
  WITH CHECK (
    status = 'invited'
    AND user_id IS NULL
    AND (
      (role = 'staff' AND is_admin())
      OR (role = 'admin' AND is_super_admin())
    )
  );

CREATE POLICY "members_update"
  ON public.members FOR UPDATE
  TO authenticated
  USING (
    (role = 'staff' AND is_admin())
    OR (role = 'admin' AND is_super_admin())
  )
  WITH CHECK (
    (role = 'staff' AND is_admin())
    OR (role = 'admin' AND is_super_admin())
  );

CREATE POLICY "members_delete"
  ON public.members FOR DELETE
  TO authenticated
  USING (
    is_super_admin = false
    AND (
      (role = 'staff' AND is_admin())
      OR (role = 'admin' AND is_super_admin())
    )
  );

-- =============================================
-- 9. RLS POLICIES - DOGS
-- =============================================

CREATE POLICY "dogs_select"
  ON public.dogs FOR SELECT
  TO authenticated
  USING (is_active_member());

CREATE POLICY "dogs_insert"
  ON public.dogs FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "dogs_update"
  ON public.dogs FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "dogs_delete"
  ON public.dogs FOR DELETE
  TO authenticated
  USING (is_admin());

-- =============================================
-- 10. RLS POLICIES - ACTIVITY RECORDS
-- =============================================

CREATE POLICY "activity_records_select"
  ON public.activity_records FOR SELECT
  TO authenticated
  USING (is_active_member());

CREATE POLICY "activity_records_insert"
  ON public.activity_records FOR INSERT
  TO authenticated
  WITH CHECK (is_active_member());

CREATE POLICY "activity_records_update"
  ON public.activity_records FOR UPDATE
  TO authenticated
  USING (is_active_member() AND (created_by = auth.uid() OR is_admin()))
  WITH CHECK (is_active_member() AND (created_by = auth.uid() OR is_admin()));

CREATE POLICY "activity_records_delete"
  ON public.activity_records FOR DELETE
  TO authenticated
  USING (is_active_member() AND (created_by = auth.uid() OR is_admin()));

-- =============================================
-- 11. STORAGE BUCKET FOR DOG PHOTOS (ALREADY EXISTS)
-- =============================================

-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('dog-photos', 'dog-photos', true)
-- ON CONFLICT (id) DO NOTHING;

-- CREATE POLICY "Anyone can view dog photos"
-- ON storage.objects
-- FOR SELECT
-- USING (bucket_id = 'dog-photos');

-- CREATE POLICY "Active members can upload dog photos"
-- ON storage.objects
-- FOR INSERT
-- WITH CHECK (
--   bucket_id = 'dog-photos' 
--   AND auth.uid() IN (
--     SELECT user_id FROM public.members 
--     WHERE status = 'active' AND user_id IS NOT NULL
--   )
-- );

-- CREATE POLICY "Active members can update dog photos"
-- ON storage.objects
-- FOR UPDATE
-- USING (
--   bucket_id = 'dog-photos' 
--   AND auth.uid() IN (
--     SELECT user_id FROM public.members 
--     WHERE status = 'active' AND user_id IS NOT NULL
--   )
-- );

-- CREATE POLICY "Active members can delete dog photos"
-- ON storage.objects
-- FOR DELETE
-- USING (
--   bucket_id = 'dog-photos' 
--   AND auth.uid() IN (
--     SELECT user_id FROM public.members 
--     WHERE status = 'active' AND user_id IS NOT NULL
--   )
-- );

-- =============================================
-- 12. SEED: SUPER ADMIN
-- =============================================

INSERT INTO public.members (email, role, status, is_super_admin)
VALUES ('windylamay@gmail.com', 'admin', 'invited', true)
ON CONFLICT (email) DO NOTHING;
