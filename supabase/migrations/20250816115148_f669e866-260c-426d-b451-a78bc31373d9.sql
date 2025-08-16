-- Fix security issue: Customer Personal Information Could Be Stolen
-- Update RLS policies for sales table to properly protect customer PII

-- First, drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Staff can create sales" ON public.sales;
DROP POLICY IF EXISTS "Admins have full access to sales" ON public.sales;
DROP POLICY IF EXISTS "Management can view sales data" ON public.sales;

-- Create comprehensive RLS policies for sales table
-- Policy 1: Only authenticated staff can create sales
CREATE POLICY "Authenticated staff can create sales" 
ON public.sales 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager', 'supervisor', 'cashier')
    AND is_active = true
  )
);

-- Policy 2: Admins have full access to all sales data
CREATE POLICY "Admins have full access to sales" 
ON public.sales 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND is_active = true
  )
);

-- Policy 3: Managers and supervisors can view all sales data
CREATE POLICY "Management can view all sales data" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'supervisor')
    AND is_active = true
  )
);

-- Policy 4: Cashiers can only view sales they created (protecting customer PII from other cashiers)
CREATE POLICY "Cashiers can view their own sales" 
ON public.sales 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'cashier'
    AND is_active = true
  )
  AND created_by = auth.uid()
);

-- Policy 5: Management can update sales (for corrections, refunds, etc.)
CREATE POLICY "Management can update sales" 
ON public.sales 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager', 'supervisor')
    AND is_active = true
  )
);

-- Policy 6: Only admins can delete sales (for data protection)
CREATE POLICY "Only admins can delete sales" 
ON public.sales 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND is_active = true
  )
);