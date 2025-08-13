-- Fix security issue: Remove public access to settings table
DROP POLICY IF EXISTS "All authenticated users can view settings" ON public.settings;

-- Create new restrictive policy for settings - only admin and manager roles
CREATE POLICY "Admin and managers can view settings" 
ON public.settings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Create products_daily_stats table for tracking daily product metrics
CREATE TABLE IF NOT EXISTS public.products_daily_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL DEFAULT CURRENT_DATE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  sales_count integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(date, product_id)
);

-- Enable RLS on products_daily_stats
ALTER TABLE public.products_daily_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for products_daily_stats
CREATE POLICY "All authenticated users can view daily stats" 
ON public.products_daily_stats 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert daily stats" 
ON public.products_daily_stats 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update daily stats" 
ON public.products_daily_stats 
FOR UPDATE 
USING (true);

-- Create function to update daily product stats
CREATE OR REPLACE FUNCTION public.update_daily_product_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert daily stats for the product
  INSERT INTO public.products_daily_stats (date, product_id, sales_count, revenue)
  VALUES (
    CURRENT_DATE, 
    NEW.product_id, 
    NEW.quantity, 
    NEW.total_price
  )
  ON CONFLICT (date, product_id) 
  DO UPDATE SET 
    sales_count = products_daily_stats.sales_count + NEW.quantity,
    revenue = products_daily_stats.revenue + NEW.total_price,
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update daily stats when sales are made
CREATE TRIGGER update_daily_stats_trigger
  AFTER INSERT ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_product_stats();

-- Create AI recommendations table
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL, -- 'restock', 'pricing', 'promotion', 'alert'
  title text NOT NULL,
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on ai_recommendations
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_recommendations
CREATE POLICY "All authenticated users can view recommendations" 
ON public.ai_recommendations 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can update recommendations" 
ON public.ai_recommendations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager', 'supervisor', 'cashier')
  )
);

-- Insert sample AI recommendations
INSERT INTO public.ai_recommendations (type, title, message, priority, data) VALUES 
('restock', 'Low Stock Alert', 'Multiple products are running low on stock. Consider restocking soon.', 'high', '{"threshold": 10}'),
('pricing', 'Dynamic Pricing Opportunity', 'AI suggests adjusting prices for better profit margins on popular items.', 'medium', '{"suggested_increase": 5}'),
('promotion', 'Promotion Opportunity', 'Slow-moving items detected. Consider running promotions to clear inventory.', 'medium', '{"discount_suggestion": 15}'),
('alert', 'Fraud Detection', 'Unusual return pattern detected in recent transactions.', 'high', '{"pattern": "multiple_returns"}');

-- Create function to automatically generate AI recommendations
CREATE OR REPLACE FUNCTION public.generate_ai_recommendations()
RETURNS void AS $$
DECLARE
  low_stock_count integer;
  today_sales_count integer;
BEGIN
  -- Check for low stock products
  SELECT COUNT(*) INTO low_stock_count
  FROM public.products 
  WHERE current_stock <= min_stock_level AND is_active = true;
  
  -- Get today's sales count
  SELECT COUNT(*) INTO today_sales_count
  FROM public.sales 
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Clear old recommendations
  DELETE FROM public.ai_recommendations WHERE created_at < NOW() - INTERVAL '24 hours';
  
  -- Generate new recommendations based on current data
  IF low_stock_count > 0 THEN
    INSERT INTO public.ai_recommendations (type, title, message, priority, data)
    VALUES (
      'restock', 
      'Restock Alert', 
      FORMAT('%s products are below minimum stock level. Immediate restocking recommended.', low_stock_count),
      CASE WHEN low_stock_count > 10 THEN 'critical' ELSE 'high' END,
      jsonb_build_object('low_stock_count', low_stock_count)
    );
  END IF;
  
  -- Add performance insights
  INSERT INTO public.ai_recommendations (type, title, message, priority, data)
  VALUES (
    'insight', 
    'Daily Performance', 
    FORMAT('Today: %s transactions completed. System performance optimal.', today_sales_count),
    'low',
    jsonb_build_object('sales_count', today_sales_count, 'date', CURRENT_DATE)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_daily_stats_date ON public.products_daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_products_daily_stats_product_id ON public.products_daily_stats(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_type ON public.ai_recommendations(type);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_priority ON public.ai_recommendations(priority);

-- Enable realtime for new tables
ALTER TABLE public.products_daily_stats REPLICA IDENTITY FULL;
ALTER TABLE public.ai_recommendations REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.products_daily_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_recommendations;