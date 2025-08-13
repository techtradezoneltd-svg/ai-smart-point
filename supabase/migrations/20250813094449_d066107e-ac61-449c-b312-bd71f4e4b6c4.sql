-- Fix security issue: Restrict sales table access to authorized staff only
-- Drop the overly permissive policy that allows all authenticated users to view sales
DROP POLICY IF EXISTS "All authenticated users can view sales" ON public.sales;

-- Create a new restrictive policy that only allows authorized staff to view sales data
CREATE POLICY "Only authorized staff can view sales" 
ON public.sales 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager', 'supervisor', 'cashier')
  )
);