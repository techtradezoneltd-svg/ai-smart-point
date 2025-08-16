-- Fix security warnings by updating function search paths

-- Update get_current_user_role function with proper search path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role 
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Update is_current_user_admin function with proper search path
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean 
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin', false);
$$;