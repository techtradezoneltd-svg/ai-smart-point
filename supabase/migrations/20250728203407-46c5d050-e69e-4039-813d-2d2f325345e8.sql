-- Fix security issues - Update functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_setting(setting_key text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT value FROM public.settings WHERE key = setting_key LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.update_setting(setting_key text, setting_value jsonb)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.settings 
  SET value = setting_value, updated_at = now() 
  WHERE key = setting_key;
$$;