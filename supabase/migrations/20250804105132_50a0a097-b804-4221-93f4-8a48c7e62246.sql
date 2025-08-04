-- Update RLS policy to allow authenticated users to create products
-- This will allow any authenticated user to create products, but maintain restrictions for sensitive operations

DROP POLICY "Staff can manage products" ON public.products;

-- Allow all authenticated users to insert products
CREATE POLICY "Authenticated users can create products" 
ON public.products 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow staff to update/delete products
CREATE POLICY "Staff can manage existing products" 
ON public.products 
FOR UPDATE, DELETE
TO authenticated
USING (is_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['manager'::user_role, 'supervisor'::user_role]))))));

-- Ensure all authenticated users can view products (this policy already exists but let's make sure)
-- The existing "All authenticated users can view products" policy should handle SELECT operations