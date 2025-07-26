-- Fix infinite recursion in profiles RLS policies
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policies without recursion
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Create a security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- Admin policy using the security definer function
CREATE POLICY "Admin can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Fix other policies that might have recursion issues
DROP POLICY IF EXISTS "Staff can manage products" ON public.products;
CREATE POLICY "Staff can manage products" 
ON public.products 
FOR ALL 
USING (public.is_admin(auth.uid()) OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('manager', 'supervisor')
));

DROP POLICY IF EXISTS "Supervisors can manage expenses" ON public.expenses;
CREATE POLICY "Supervisors can manage expenses" 
ON public.expenses 
FOR ALL 
USING (public.is_admin(auth.uid()) OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('manager', 'supervisor')
));

DROP POLICY IF EXISTS "Staff can create stock movements" ON public.stock_movements;
CREATE POLICY "Staff can create stock movements" 
ON public.stock_movements 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'manager', 'supervisor', 'cashier')
));

DROP POLICY IF EXISTS "Admin can manage categories" ON public.categories;
CREATE POLICY "Admin can manage categories" 
ON public.categories 
FOR ALL 
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can manage units" ON public.units;
CREATE POLICY "Admin can manage units" 
ON public.units 
FOR ALL 
USING (public.is_admin(auth.uid()));