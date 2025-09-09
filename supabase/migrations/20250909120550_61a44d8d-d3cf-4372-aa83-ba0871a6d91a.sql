-- Fix the function return type issue
CREATE OR REPLACE FUNCTION get_loans_needing_reminders()
RETURNS TABLE(
  loan_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  total_amount NUMERIC,
  remaining_balance NUMERIC,
  due_date DATE,
  status loan_status,
  reminder_status TEXT,
  reminders_sent_today BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 
    l.id as loan_id,
    c.name as customer_name,
    c.phone as customer_phone,
    l.total_amount,
    l.remaining_balance,
    l.due_date,
    l.status,
    CASE 
      WHEN l.due_date = CURRENT_DATE + INTERVAL '2 days' THEN 'due_in_2_days'
      WHEN l.due_date = CURRENT_DATE THEN 'due_today'
      WHEN l.due_date < CURRENT_DATE THEN 'overdue'
      ELSE 'future'
    END as reminder_status,
    (SELECT COUNT(*) FROM loan_reminders lr WHERE lr.loan_id = l.id AND DATE(lr.created_at) = CURRENT_DATE) as reminders_sent_today
  FROM loans l
  JOIN customers c ON l.customer_id = c.id
  WHERE l.status IN ('active', 'overdue')
  ORDER BY l.due_date ASC;
$$;