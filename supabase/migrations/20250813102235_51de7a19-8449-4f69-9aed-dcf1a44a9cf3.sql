-- Create a function to automatically create an admin profile for the first user
CREATE OR REPLACE FUNCTION handle_first_user_setup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the first user
  IF (SELECT COUNT(*) FROM auth.users) = 1 THEN
    -- Create admin profile for first user
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'System Admin'),
      NEW.email,
      'admin'
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name),
      email = NEW.email;
  ELSE
    -- For subsequent users, create with default cashier role
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.email,
      'cashier'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user setup
DROP TRIGGER IF EXISTS on_auth_user_created_setup ON auth.users;
CREATE TRIGGER on_auth_user_created_setup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_first_user_setup();

-- Update existing handle_new_user function to be more robust
DROP FUNCTION IF EXISTS public.handle_new_user();