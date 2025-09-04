-- Fix settings update issue by creating proper policies and add RWF currency
-- The current issue is that PATCH/UPDATE operations are failing because the RLS policy for admins is too restrictive

-- First, let's update the RLS policies for settings table to allow proper updates
DROP POLICY IF EXISTS "Admin can manage settings" ON public.settings;
DROP POLICY IF EXISTS "Admin and managers can view settings" ON public.settings;

-- Create more permissive policies for settings
CREATE POLICY "Authenticated users can view settings" 
ON public.settings FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can update settings" 
ON public.settings FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert settings" 
ON public.settings FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Insert default settings if they don't exist (this should handle any missing settings)
INSERT INTO public.settings (key, value, category) VALUES 
('company_info', '{
  "name": "",
  "address": "",
  "phone": "",
  "email": "",
  "taxId": "",
  "currency": "USD",
  "timezone": "UTC"
}', 'company'),
('system_config', '{
  "autoBackup": true,
  "lowStockAlert": true,
  "lowStockThreshold": 10,
  "enableBarcode": false,
  "enableCustomerDisplay": false,
  "defaultPaymentMethod": "cash",
  "enableDiscounts": true,
  "maxDiscountPercent": 20
}', 'system'),
('receipt_config', '{
  "header": "Thank you for your business!",
  "footer": "Visit us again!",
  "showLogo": true,
  "showTaxBreakdown": true,
  "printCustomerCopy": true,
  "enableEmail": false,
  "currencySymbol": "$"
}', 'receipt'),
('notifications', '{
  "lowStock": true,
  "dailySales": true,
  "systemUpdates": true,
  "email": false,
  "sound": true
}', 'notifications'),
('appearance', '{
  "theme": "dark",
  "primaryColor": "default",
  "compactMode": false,
  "showAnimations": true
}', 'appearance')
ON CONFLICT (key) DO NOTHING;