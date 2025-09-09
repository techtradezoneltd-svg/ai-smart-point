-- Enable pg_cron extension for scheduling automated tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the loan reminder function to run daily at 9:00 AM
SELECT cron.schedule(
  'daily-loan-reminders',
  '0 9 * * *', -- Every day at 9:00 AM
  $$
  SELECT
    net.http_post(
        url:='https://nlghofpnwvmcevnmsiuj.supabase.co/functions/v1/loan-reminder-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sZ2hvZnBud3ZtY2V2bm1zaXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzM2NTcsImV4cCI6MjA2OTA0OTY1N30.btZ1D-MJT2c2GKCrJb7oKV5KDZVC-H6IrwWxFBlfbkk"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Also schedule an evening reminder check at 6:00 PM
SELECT cron.schedule(
  'evening-loan-reminders',
  '0 18 * * *', -- Every day at 6:00 PM
  $$
  SELECT
    net.http_post(
        url:='https://nlghofpnwvmcevnmsiuj.supabase.co/functions/v1/loan-reminder-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sZ2hvZnBud3ZtY2V2bm1zaXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzM2NTcsImV4cCI6MjA2OTA0OTY1N30.btZ1D-MJT2c2GKCrJb7oKV5KDZVC-H6IrwWxFBlfbkk"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Create a view for easy loan reminder monitoring
CREATE OR REPLACE VIEW loan_reminder_summary AS
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

-- Create a function to manually trigger loan reminders (for testing)
CREATE OR REPLACE FUNCTION trigger_loan_reminders()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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