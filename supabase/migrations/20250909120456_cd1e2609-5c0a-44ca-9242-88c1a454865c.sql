-- Fix security issues

-- 1. Update the view to remove SECURITY DEFINER (it's not needed for views)
DROP VIEW IF EXISTS loan_reminder_summary;
CREATE VIEW loan_reminder_summary AS
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

-- 2. Update the function to set search_path
CREATE OR REPLACE FUNCTION trigger_loan_reminders()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT
    net.http_post(
        url:='https://nlghofpnwvmcevnmsiuj.supabase.co/functions/v1/loan-reminder-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sZ2hvZnBud3ZtY2V2bm1zaXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzM2NTcsImV4cCI6MjA2OTA0OTY1N30.btZ1D-MJT2c2GKCrJb7oKV5KDZVC-H6IrwWxFBlfbkk"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) INTO result;
  
  RETURN result;
END;
$$;

-- 3. Enable RLS on the view (though it inherits from base tables)
-- Note: Views don't need explicit RLS, they inherit from underlying tables

-- 4. Create a test function to manually check loan reminders (for debugging)
CREATE OR REPLACE FUNCTION get_loans_needing_reminders()
RETURNS TABLE(
  loan_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  due_date DATE,
  reminder_status TEXT,
  reminders_sent_today BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT * FROM loan_reminder_summary;
$$;