-- Fix security issue: Restrict product creation to authorized staff only
-- Drop the overly permissive policy that allows anyone to create products
DROP POLICY IF EXISTS "Anyone can create products" ON public.products;

-- Create a new restrictive policy that only allows authorized staff to create products
CREATE POLICY "Only authorized staff can create products" 
ON public.products 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager', 'supervisor')
  )
);