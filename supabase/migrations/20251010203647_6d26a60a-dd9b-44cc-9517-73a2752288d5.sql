-- Add status column to sales table for tracking refunds and cancellations
ALTER TABLE public.sales 
ADD COLUMN status text DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'cancelled'));