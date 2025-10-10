-- Create trigger to update loan status when payment is recorded
CREATE OR REPLACE TRIGGER update_loan_status_trigger
AFTER INSERT ON public.loan_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_loan_status();