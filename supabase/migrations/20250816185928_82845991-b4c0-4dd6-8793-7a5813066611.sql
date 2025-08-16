-- Fix remaining functions without proper search paths

-- Update generate_ai_recommendations function
CREATE OR REPLACE FUNCTION public.generate_ai_recommendations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
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
$function$;

-- Update update_daily_product_stats function  
CREATE OR REPLACE FUNCTION public.update_daily_product_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
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
$function$;