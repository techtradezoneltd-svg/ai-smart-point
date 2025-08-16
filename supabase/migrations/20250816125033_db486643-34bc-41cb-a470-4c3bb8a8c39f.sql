-- Fix infinite recursion in profiles table RLS policies
-- Create security definer function to safely check user roles without triggering RLS

-- First, create a security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean AS $$
  SELECT COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin', false);
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policies using security definer functions
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins have full access to profiles" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (public.is_current_user_admin());

-- Also update the is_admin function to use security definer properly
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public', 'pg_temp'
AS $function$
  SELECT COALESCE((
    SELECT role = 'admin' 
    FROM public.profiles 
    WHERE id = user_id 
    LIMIT 1
  ), false);
$function$;