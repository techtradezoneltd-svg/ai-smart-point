-- First, let's fix the admin access by updating RLS policies
-- Make sure admins have full access to everything

-- Update products table policies for full admin access
DROP POLICY IF EXISTS "Only authorized staff can create products" ON public.products;
DROP POLICY IF EXISTS "Staff can update products" ON public.products;
DROP POLICY IF EXISTS "Staff can delete products" ON public.products;

CREATE POLICY "Admins have full access to products" 
ON public.products 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Managers and supervisors can manage products" 
ON public.products 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('manager', 'supervisor')
  )
);

-- Update expenses policies for full admin access
DROP POLICY IF EXISTS "Supervisors can manage expenses" ON public.expenses;

CREATE POLICY "Admins have full access to expenses" 
ON public.expenses 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Managers and supervisors can manage expenses" 
ON public.expenses 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('manager', 'supervisor')
  )
);

-- Update stock movements policies
DROP POLICY IF EXISTS "Staff can create stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Only authorized staff can view stock movements" ON public.stock_movements;

CREATE POLICY "Admins have full access to stock movements" 
ON public.stock_movements 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Staff can manage stock movements" 
ON public.stock_movements 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('manager', 'supervisor', 'cashier')
  )
);

-- Update sales policies for admin access
DROP POLICY IF EXISTS "Only management can view sales data" ON public.sales;

CREATE POLICY "Admins have full access to sales" 
ON public.sales 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Management can view sales data" 
ON public.sales 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('manager', 'supervisor')
  )
);

-- Update profiles policies for admin access
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;

CREATE POLICY "Admins have full access to profiles" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p2
    WHERE p2.id = auth.uid() 
    AND p2.role = 'admin'
  )
);

-- Create a function to make specific email admin
CREATE OR REPLACE FUNCTION make_user_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET role = 'admin'
  WHERE email = user_email;
  
  -- If no profile exists, we'll let the trigger handle it on next login
  -- or create it manually if user exists in auth.users
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, email, role, full_name)
    SELECT au.id, au.email, 'admin', COALESCE(au.raw_user_meta_data->>'full_name', 'Admin User')
    FROM auth.users au 
    WHERE au.email = user_email
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  END IF;
END;
$$;

-- Make the specified email an admin
SELECT make_user_admin('krwibutso5@gmail.com');

-- Update the user creation trigger to handle admin assignment better
CREATE OR REPLACE FUNCTION handle_first_user_setup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'krwibutso5@gmail.com' THEN
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
$$;