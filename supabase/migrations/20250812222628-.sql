-- Temporarily allow product creation without authentication
-- Drop the current restrictive policy
DROP POLICY IF EXISTS "Authenticated users can create products" ON public.products;

-- Create a new policy that allows anyone to create products (temporary solution)
CREATE POLICY "Anyone can create products" 
ON public.products 
FOR INSERT 
WITH CHECK (true);

-- Also make created_by column nullable to avoid issues
ALTER TABLE public.products ALTER COLUMN created_by DROP NOT NULL;