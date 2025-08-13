-- Fix security issue: Restrict sales data access to management roles only
-- Drop the current policy that allows cashiers to view sales data
DROP POLICY IF EXISTS "Only authorized staff can view sales" ON public.sales;

-- Create a new restrictive policy that only allows management roles to view sales data
-- This prevents cashiers from accessing customer personal information
CREATE POLICY "Only management can view sales data" 
ON public.sales 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager', 'supervisor')
  )
);