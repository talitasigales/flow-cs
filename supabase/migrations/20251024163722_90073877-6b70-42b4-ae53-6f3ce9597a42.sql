-- Add password change tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP WITH TIME ZONE;

-- Set existing users to require password change
UPDATE public.profiles 
SET password_changed = false 
WHERE password_changed IS NULL;

-- Update the handle_new_user function to set password_changed to false
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, password_changed)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', false);
  RETURN NEW;
END;
$$;