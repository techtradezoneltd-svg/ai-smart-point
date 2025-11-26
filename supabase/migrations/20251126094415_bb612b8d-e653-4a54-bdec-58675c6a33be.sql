-- Create table for AI alert thresholds and configuration
CREATE TABLE IF NOT EXISTS public.ai_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view AI config"
  ON public.ai_config FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage AI config"
  ON public.ai_config FOR ALL
  USING (is_admin(auth.uid()));

-- Create table for voice command templates
CREATE TABLE IF NOT EXISTS public.voice_commands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  command TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_commands ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view voice commands"
  ON public.voice_commands FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage voice commands"
  ON public.voice_commands FOR ALL
  USING (is_admin(auth.uid()));

-- Create table for dashboard quick actions
CREATE TABLE IF NOT EXISTS public.quick_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  action TEXT NOT NULL,
  icon TEXT NOT NULL,
  color_class TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quick_actions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view quick actions"
  ON public.quick_actions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage quick actions"
  ON public.quick_actions FOR ALL
  USING (is_admin(auth.uid()));

-- Insert default AI configuration
INSERT INTO public.ai_config (key, value, category, description) VALUES
('alert_thresholds', '{"large_sale": 1000, "large_expense": 500, "low_stock": 10, "overdue_loan": 7}'::jsonb, 'alerts', 'Threshold values for triggering AI alerts'),
('monitoring_settings', '{"real_time_enabled": true, "notification_delay_minutes": 5}'::jsonb, 'monitoring', 'Real-time monitoring configuration'),
('report_settings', '{"auto_generate": true, "send_time": "18:00", "include_ai_insights": true}'::jsonb, 'reporting', 'Automated report generation settings');

-- Insert default voice commands
INSERT INTO public.voice_commands (command, description, category, display_order) VALUES
('What were today''s sales?', 'Get today''s total sales', 'sales', 1),
('How many low stock items do we have?', 'Check inventory alerts', 'inventory', 2),
('How many active loans are there?', 'View active loan count', 'loans', 3),
('What''s our total revenue today?', 'Get revenue summary', 'sales', 4),
('Show me customer statistics', 'View customer metrics', 'customers', 5),
('What products need restocking?', 'Get low stock items', 'inventory', 6),
('Show top selling products', 'View best sellers', 'sales', 7),
('What are today''s expenses?', 'Get expense summary', 'expenses', 8);

-- Insert default quick actions
INSERT INTO public.quick_actions (label, action, icon, color_class, display_order) VALUES
('New Sale', 'pos', 'ShoppingCart', 'bg-gradient-primary', 1),
('Inventory', 'inventory', 'Package', 'bg-gradient-accent', 2),
('Customers', 'customers', 'Users', 'bg-secondary', 3),
('Analytics', 'analytics', 'BarChart3', 'bg-success', 4);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_ai_config_updated_at
  BEFORE UPDATE ON public.ai_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_commands_updated_at
  BEFORE UPDATE ON public.voice_commands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quick_actions_updated_at
  BEFORE UPDATE ON public.quick_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_ai_config_key ON public.ai_config(key);
CREATE INDEX idx_ai_config_category ON public.ai_config(category);
CREATE INDEX idx_voice_commands_category ON public.voice_commands(category);
CREATE INDEX idx_voice_commands_active ON public.voice_commands(is_active);
CREATE INDEX idx_quick_actions_active ON public.quick_actions(is_active);
CREATE INDEX idx_quick_actions_order ON public.quick_actions(display_order);