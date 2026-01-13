-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  rating NUMERIC(2,1) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_value NUMERIC(12,2) DEFAULT 0,
  last_order_date DATE,
  payment_terms TEXT,
  lead_time INTEGER DEFAULT 7,
  products TEXT[],
  reliability INTEGER DEFAULT 100,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies for suppliers
CREATE POLICY "Authenticated users can view active suppliers" 
ON public.suppliers 
FOR SELECT 
TO authenticated
USING (is_active = true);

CREATE POLICY "Authenticated users can create suppliers" 
ON public.suppliers 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update suppliers" 
ON public.suppliers 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete suppliers" 
ON public.suppliers 
FOR DELETE 
TO authenticated
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();