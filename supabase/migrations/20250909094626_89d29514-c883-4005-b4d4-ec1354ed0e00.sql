-- Create loan management tables
CREATE TYPE loan_status AS ENUM ('active', 'paid', 'overdue', 'defaulted');
CREATE TYPE payment_type AS ENUM ('full', 'partial', 'loan_only');
CREATE TYPE reminder_type AS ENUM ('before_due', 'on_due', 'overdue', 'escalation');

-- Customer profiles table for loan management
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  email text,
  address text,
  repayment_behavior jsonb DEFAULT '{"score": 0, "payment_history": [], "risk_level": "low"}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Loans table
CREATE TABLE public.loans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES public.customers(id) NOT NULL,
  sale_id uuid REFERENCES public.sales(id),
  total_amount numeric NOT NULL,
  paid_amount numeric DEFAULT 0,
  remaining_balance numeric NOT NULL,
  due_date date NOT NULL,
  status loan_status DEFAULT 'active',
  agreement_terms text,
  ai_risk_assessment jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Loan payments table
CREATE TABLE public.loan_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id uuid REFERENCES public.loans(id) NOT NULL,
  amount numeric NOT NULL,
  payment_date timestamp with time zone DEFAULT now(),
  payment_method text DEFAULT 'cash',
  notes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- AI loan reminders table
CREATE TABLE public.loan_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id uuid REFERENCES public.loans(id) NOT NULL,
  reminder_type reminder_type NOT NULL,
  message_content text NOT NULL,
  scheduled_date timestamp with time zone NOT NULL,
  sent_date timestamp with time zone,
  is_sent boolean DEFAULT false,
  whatsapp_message_id text,
  ai_personalization jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for customers
CREATE POLICY "All authenticated users can view customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Staff can manage customers" ON public.customers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'supervisor', 'cashier'))
);

-- RLS policies for loans
CREATE POLICY "All authenticated users can view loans" ON public.loans FOR SELECT USING (true);
CREATE POLICY "Staff can manage loans" ON public.loans FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'supervisor', 'cashier'))
);

-- RLS policies for loan payments
CREATE POLICY "All authenticated users can view loan payments" ON public.loan_payments FOR SELECT USING (true);
CREATE POLICY "Staff can manage loan payments" ON public.loan_payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'supervisor', 'cashier'))
);

-- RLS policies for loan reminders
CREATE POLICY "All authenticated users can view loan reminders" ON public.loan_reminders FOR SELECT USING (true);
CREATE POLICY "System can manage loan reminders" ON public.loan_reminders FOR ALL USING (true);

-- Function to update loan status and customer behavior
CREATE OR REPLACE FUNCTION public.update_loan_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_balance numeric;
  customer_behavior jsonb;
  payment_record jsonb;
BEGIN
  -- Calculate new remaining balance
  SELECT total_amount - COALESCE(SUM(amount), 0) INTO new_balance
  FROM public.loan_payments
  WHERE loan_id = NEW.loan_id;

  -- Update loan balance and status
  UPDATE public.loans 
  SET 
    paid_amount = COALESCE((SELECT SUM(amount) FROM public.loan_payments WHERE loan_id = NEW.loan_id), 0),
    remaining_balance = new_balance,
    status = CASE 
      WHEN new_balance <= 0 THEN 'paid'::loan_status
      WHEN due_date < CURRENT_DATE AND new_balance > 0 THEN 'overdue'::loan_status
      ELSE 'active'::loan_status
    END,
    updated_at = now()
  WHERE id = NEW.loan_id;

  -- Update customer repayment behavior
  SELECT repayment_behavior INTO customer_behavior
  FROM public.customers c
  JOIN public.loans l ON l.customer_id = c.id
  WHERE l.id = NEW.loan_id;

  -- Create payment record for behavior analysis
  payment_record := jsonb_build_object(
    'date', NEW.payment_date,
    'amount', NEW.amount,
    'on_time', NEW.payment_date <= (SELECT due_date FROM public.loans WHERE id = NEW.loan_id)
  );

  -- Update customer behavior
  UPDATE public.customers 
  SET 
    repayment_behavior = jsonb_set(
      customer_behavior,
      '{payment_history}',
      COALESCE(customer_behavior->'payment_history', '[]'::jsonb) || payment_record::jsonb
    ),
    updated_at = now()
  WHERE id = (SELECT customer_id FROM public.loans WHERE id = NEW.loan_id);

  RETURN NEW;
END;
$$;

-- Trigger for loan status updates
CREATE TRIGGER update_loan_status_trigger
  AFTER INSERT ON public.loan_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loan_status();

-- Function to generate AI loan reminders
CREATE OR REPLACE FUNCTION public.generate_loan_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  loan_record RECORD;
  customer_behavior jsonb;
  reminder_message text;
  personalization jsonb;
BEGIN
  -- Loop through active loans
  FOR loan_record IN 
    SELECT l.*, c.name, c.phone, c.repayment_behavior
    FROM public.loans l
    JOIN public.customers c ON l.customer_id = c.id
    WHERE l.status IN ('active', 'overdue')
  LOOP
    customer_behavior := loan_record.repayment_behavior;
    
    -- Determine personalization based on customer behavior
    personalization := jsonb_build_object(
      'risk_level', COALESCE(customer_behavior->>'risk_level', 'low'),
      'payment_history_count', jsonb_array_length(COALESCE(customer_behavior->'payment_history', '[]'::jsonb)),
      'usually_late', false -- Will be enhanced with AI analysis
    );

    -- Generate different reminders based on due date proximity
    IF loan_record.due_date = CURRENT_DATE + INTERVAL '2 days' THEN
      -- 2 days before due date
      reminder_message := format('Dear %s, your loan balance of %s is due on %s. Please prepare to pay. Thank you!', 
        loan_record.name, loan_record.remaining_balance, loan_record.due_date);
      
      INSERT INTO public.loan_reminders (loan_id, reminder_type, message_content, scheduled_date, ai_personalization)
      VALUES (loan_record.id, 'before_due', reminder_message, CURRENT_DATE + INTERVAL '2 days', personalization);
      
    ELSIF loan_record.due_date = CURRENT_DATE THEN
      -- On due date
      reminder_message := format('Reminder: Your loan balance of %s is due today. Please settle at your earliest convenience.', 
        loan_record.remaining_balance);
      
      INSERT INTO public.loan_reminders (loan_id, reminder_type, message_content, scheduled_date, ai_personalization)
      VALUES (loan_record.id, 'on_due', reminder_message, CURRENT_DATE, personalization);
      
    ELSIF loan_record.due_date < CURRENT_DATE THEN
      -- Overdue
      reminder_message := format('Your loan balance of %s is overdue since %s. Please settle soon to avoid restrictions. Contact us for assistance.', 
        loan_record.remaining_balance, loan_record.due_date);
      
      INSERT INTO public.loan_reminders (loan_id, reminder_type, message_content, scheduled_date, ai_personalization)
      VALUES (loan_record.id, 'overdue', reminder_message, CURRENT_DATE, personalization);
    END IF;
  END LOOP;
END;
$$;

-- Add payment_type column to sales table
ALTER TABLE public.sales ADD COLUMN payment_type payment_type DEFAULT 'full';
ALTER TABLE public.sales ADD COLUMN customer_id uuid REFERENCES public.customers(id);
ALTER TABLE public.sales ADD COLUMN loan_id uuid REFERENCES public.loans(id);