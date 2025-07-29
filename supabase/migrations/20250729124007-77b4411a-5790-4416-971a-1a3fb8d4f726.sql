-- Fix all remaining functions with search_path issues
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.type = 'in' OR NEW.type = 'return' THEN
    UPDATE public.products 
    SET current_stock = current_stock + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.product_id;
  ELSIF NEW.type = 'out' OR NEW.type = 'damage' THEN
    UPDATE public.products 
    SET current_stock = current_stock - NEW.quantity,
        updated_at = now()
    WHERE id = NEW.product_id;
  ELSIF NEW.type = 'adjustment' THEN
    UPDATE public.products 
    SET current_stock = NEW.quantity,
        updated_at = now()
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_sale_stock_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.stock_movements (product_id, type, quantity, reference_number, created_by)
  VALUES (NEW.product_id, 'out', NEW.quantity, 'SALE-' || (SELECT sale_number FROM public.sales WHERE id = NEW.sale_id), auth.uid());
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    'cashier'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_settings_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;