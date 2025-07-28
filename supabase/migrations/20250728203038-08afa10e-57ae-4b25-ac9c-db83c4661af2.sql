-- Create settings table for storing application-wide configuration
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT 'general',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies for settings access
CREATE POLICY "All authenticated users can view settings" 
ON public.settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage settings" 
ON public.settings 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create function to update settings timestamp
CREATE OR REPLACE FUNCTION public.update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_settings_updated_at();

-- Insert default settings
INSERT INTO public.settings (key, value, category) VALUES
('company_info', '{
  "name": "My Store",
  "address": "123 Main Street",
  "phone": "+1234567890",
  "email": "info@mystore.com",
  "taxId": "TAX123456",
  "currency": "USD",
  "timezone": "UTC"
}', 'company'),
('system_config', '{
  "autoBackup": true,
  "lowStockAlert": true,
  "lowStockThreshold": 10,
  "enableBarcode": true,
  "enableCustomerDisplay": false,
  "defaultPaymentMethod": "cash",
  "enableDiscounts": true,
  "maxDiscountPercent": 50
}', 'system'),
('receipt_config', '{
  "header": "Thank you for your purchase!",
  "footer": "Please come again!",
  "showLogo": true,
  "showTaxBreakdown": true,
  "printCustomerCopy": true,
  "enableEmail": false,
  "primaryLogo": null,
  "secondaryLogo": null,
  "primaryLogoSize": 100,
  "secondaryLogoSize": 60,
  "logoPosition": "top",
  "receiptWidth": 80,
  "fontSize": 12,
  "fontFamily": "monospace",
  "paperType": "thermal",
  "showDateTime": true,
  "showOrderNumber": true,
  "showCashierName": true,
  "showQRCode": false,
  "qrCodeData": "receipt-url",
  "showItemCodes": true,
  "showItemDescription": true,
  "showUnitPrice": true,
  "showSubtotal": true,
  "showDiscounts": true,
  "currencySymbol": "$",
  "customFooterText": "",
  "showSocialMedia": false,
  "website": "",
  "facebook": "",
  "instagram": "",
  "twitter": "",
  "backgroundColor": "#ffffff",
  "textColor": "#000000",
  "headerColor": "#333333",
  "borderColor": "#cccccc"
}', 'receipt'),
('notifications', '{
  "lowStock": true,
  "dailySales": true,
  "systemUpdates": true,
  "email": true,
  "sound": true
}', 'notifications'),
('appearance', '{
  "theme": "light",
  "primaryColor": "blue",
  "compactMode": false,
  "showAnimations": true
}', 'appearance');

-- Create function to get setting value
CREATE OR REPLACE FUNCTION public.get_setting(setting_key text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM public.settings WHERE key = setting_key LIMIT 1;
$$;

-- Create function to update setting value
CREATE OR REPLACE FUNCTION public.update_setting(setting_key text, setting_value jsonb)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.settings 
  SET value = setting_value, updated_at = now() 
  WHERE key = setting_key;
$$;