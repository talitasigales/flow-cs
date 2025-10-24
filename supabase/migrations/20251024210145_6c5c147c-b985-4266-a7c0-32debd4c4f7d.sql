-- Create user_invites table for tracking user invitations
CREATE TABLE public.user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  role app_role DEFAULT 'user'::app_role,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_invites
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_invites
CREATE POLICY "Admins can view all invites"
ON public.user_invites FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert invites"
ON public.user_invites FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update invites"
ON public.user_invites FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete invites"
ON public.user_invites FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create audit_logs table for system activity tracking
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit_logs
CREATE POLICY "Admins can view all logs"
ON public.audit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- Create function to log user actions
CREATE OR REPLACE FUNCTION public.log_user_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the action based on TG_OP (INSERT, UPDATE, DELETE)
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for important tables
CREATE TRIGGER audit_user_roles_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_user_action();

CREATE TRIGGER audit_module_materials_changes
AFTER INSERT OR UPDATE OR DELETE ON public.module_materials
FOR EACH ROW EXECUTE FUNCTION public.log_user_action();

CREATE TRIGGER audit_modules_changes
AFTER INSERT OR UPDATE OR DELETE ON public.modules
FOR EACH ROW EXECUTE FUNCTION public.log_user_action();

-- Add RLS policy for admins to manage user_roles (insert only)
CREATE POLICY "Admins can insert user roles"
ON public.user_roles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user roles"
ON public.user_roles FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user roles"
ON public.user_roles FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'));