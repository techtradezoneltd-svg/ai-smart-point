-- Make the current user an admin
UPDATE profiles SET role = 'admin' WHERE email = 'kevllatest@gmail.com';

-- Also update the first user setup function to include this email as admin
CREATE OR REPLACE FUNCTION public.handle_first_user_setup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'krwibutso5@gmail.com' OR NEW.email = 'kevllatest@gmail.com' THEN
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
  -- Check if this is the first user
  ELSIF (SELECT COUNT(*) FROM auth.users) = 1 THEN
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
$function$;