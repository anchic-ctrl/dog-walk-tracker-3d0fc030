-- =============================================
-- 1. DROP OLD POLICIES AND OBJECTS (in correct order)
-- =============================================

-- Drop old policies on dogs
DROP POLICY IF EXISTS "dogs_delete_boss" ON public.dogs;
DROP POLICY IF EXISTS "dogs_insert_boss" ON public.dogs;
DROP POLICY IF EXISTS "dogs_select" ON public.dogs;
DROP POLICY IF EXISTS "dogs_update_boss" ON public.dogs;

-- Drop old policies on activity_records
DROP POLICY IF EXISTS "activity_records_delete" ON public.activity_records;
DROP POLICY IF EXISTS "activity_records_insert" ON public.activity_records;
DROP POLICY IF EXISTS "activity_records_select" ON public.activity_records;
DROP POLICY IF EXISTS "activity_records_update" ON public.activity_records;

-- Drop old policies on user_roles
DROP POLICY IF EXISTS "user_roles_delete_boss" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_boss" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_boss" ON public.user_roles;

-- Now we can drop the function and table
DROP FUNCTION IF EXISTS public.is_boss();
DROP TABLE IF EXISTS public.user_roles;
DROP TYPE IF EXISTS public.app_role;

-- =============================================
-- 2. CREATE NEW TYPES
-- =============================================

CREATE TYPE public.member_role AS ENUM ('admin', 'staff');
CREATE TYPE public.member_status AS ENUM ('invited', 'active', 'disabled');

-- =============================================
-- 3. CREATE MEMBERS TABLE
-- =============================================

CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role member_role NOT NULL DEFAULT 'staff',
  status member_status NOT NULL DEFAULT 'invited',
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  invited_by UUID REFERENCES public.members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one active super_admin allowed
CREATE UNIQUE INDEX only_one_active_super_admin 
  ON public.members (is_super_admin) 
  WHERE is_super_admin = true AND status = 'active';

-- Enable RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. HELPER FUNCTIONS
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

-- =============================================
-- 5. SUPER ADMIN PROTECTION (using session variable)
-- =============================================

-- Trigger function that protects super_admin changes
-- Only allows changes when session variable 'app.transfer_super_admin' = 'allowed'
CREATE OR REPLACE FUNCTION public.protect_super_admin_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is an authorized transfer operation
  IF current_setting('app.transfer_super_admin', true) = 'allowed' THEN
    RETURN NEW;
  END IF;

  -- Block direct modification of is_super_admin
  IF OLD.is_super_admin IS DISTINCT FROM NEW.is_super_admin THEN
    RAISE EXCEPTION 'Cannot directly modify is_super_admin. Use transfer_super_admin() function.';
  END IF;

  -- Block disabling an active super_admin
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
-- 6. TRANSFER SUPER ADMIN FUNCTION
-- =============================================

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
  -- Verify caller is the current super_admin
  SELECT id INTO current_super_id
  FROM public.members
  WHERE user_id = auth.uid()
    AND is_super_admin = true
    AND status = 'active';

  IF current_super_id IS NULL THEN
    RAISE EXCEPTION 'Only the current super_admin can transfer the role.';
  END IF;

  -- Verify target is an active admin
  SELECT status, role INTO target_status, target_role
  FROM public.members
  WHERE id = target_member_id;

  IF target_status IS NULL THEN
    RAISE EXCEPTION 'Target member not found.';
  END IF;

  IF target_status != 'active' THEN
    RAISE EXCEPTION 'Target member must be active.';
  END IF;

  IF target_role != 'admin' THEN
    RAISE EXCEPTION 'Target must be an admin.';
  END IF;

  -- Set session variable to allow the transfer
  PERFORM set_config('app.transfer_super_admin', 'allowed', true);

  -- Atomic transfer
  UPDATE public.members SET is_super_admin = false, updated_at = now()
  WHERE id = current_super_id;

  UPDATE public.members SET is_super_admin = true, updated_at = now()
  WHERE id = target_member_id;

  -- Reset session variable
  PERFORM set_config('app.transfer_super_admin', '', true);
END;
$$;

-- =============================================
-- 7. MEMBER LINKING ON SIGNUP
-- =============================================

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
  WHERE email = NEW.email
    AND status = 'invited';
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_link_member
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_member_on_signup();

-- =============================================
-- 8. MEMBERS RLS POLICIES
-- =============================================

-- SELECT: Only active members can view the list
CREATE POLICY "members_select"
  ON public.members FOR SELECT
  TO authenticated
  USING (is_active_member());

-- INSERT: Admin can invite staff, Super admin can invite admin
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

-- UPDATE: Admin can update staff, Super admin can update admin
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

-- DELETE: Admin can delete staff, Super admin can delete admin (but not super_admin)
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
-- 9. DOGS RLS POLICIES
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
-- 10. ACTIVITY_RECORDS RLS POLICIES
-- =============================================

CREATE POLICY "activity_records_select"
  ON public.activity_records FOR SELECT
  TO authenticated
  USING (is_active_member());

-- INSERT: active member, trigger handles created_by
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
-- 11. INITIALIZE FIRST SUPER ADMIN
-- =============================================

INSERT INTO public.members (email, role, status, is_super_admin)
VALUES ('windylamay@gmail.com', 'admin', 'invited', true)
ON CONFLICT (email) DO NOTHING;