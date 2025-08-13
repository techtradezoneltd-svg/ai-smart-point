-- Fix security issue: Restrict stock_movements access to authorized staff only
-- Drop the overly permissive policy that allows all authenticated users to view stock movements
DROP POLICY IF EXISTS "All authenticated users can view stock movements" ON public.stock_movements;

-- Create a new restrictive policy that only allows authorized staff to view stock movements
CREATE POLICY "Only authorized staff can view stock movements" 
ON public.stock_movements 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager', 'supervisor')
  )
);