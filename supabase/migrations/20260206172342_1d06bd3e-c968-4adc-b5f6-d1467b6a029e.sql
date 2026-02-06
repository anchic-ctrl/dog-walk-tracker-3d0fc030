-- Add expires_at column to members table (default 7 days from creation)
ALTER TABLE public.members 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days');

-- Update existing invited members to have an expiration date
UPDATE public.members 
SET expires_at = created_at + INTERVAL '7 days' 
WHERE status = 'invited' AND expires_at IS NULL;

-- Create validation function that ALWAYS returns exactly one row
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
  -- Normalize email to lowercase for comparison
  SELECT m.* INTO v_member
  FROM public.members m
  WHERE LOWER(m.email) = LOWER(invite_email)
  LIMIT 1;

  -- If no member found, return NOT_FOUND
  IF v_member IS NULL THEN
    RETURN QUERY SELECT 'NOT_FOUND'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  -- Get inviter's display name if exists
  IF v_member.invited_by IS NOT NULL THEN
    SELECT p.display_name INTO v_inviter_name
    FROM public.profiles p
    JOIN public.members inv ON inv.user_id = p.user_id
    WHERE inv.id = v_member.invited_by;
  END IF;

  -- Check various states
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

-- Update link_member_on_signup to use case-insensitive email matching
CREATE OR REPLACE FUNCTION public.link_member_on_signup()
RETURNS trigger
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