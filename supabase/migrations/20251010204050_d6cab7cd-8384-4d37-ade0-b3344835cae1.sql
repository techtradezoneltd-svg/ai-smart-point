-- Fix the update_loan_status function to get total_amount from loans table
CREATE OR REPLACE FUNCTION public.update_loan_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  loan_total numeric;
  new_balance numeric;
  total_paid numeric;
  customer_behavior jsonb;
  payment_record jsonb;
BEGIN
  -- Get loan total amount
  SELECT total_amount INTO loan_total
  FROM public.loans
  WHERE id = NEW.loan_id;

  -- Calculate total paid
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.loan_payments
  WHERE loan_id = NEW.loan_id;

  -- Calculate new remaining balance
  new_balance := loan_total - total_paid;

  -- Update loan balance and status
  UPDATE public.loans 
  SET 
    paid_amount = total_paid,
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
$function$;