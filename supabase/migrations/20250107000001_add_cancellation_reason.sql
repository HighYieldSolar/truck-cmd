-- Add cancellation reason and feedback columns to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_feedback TEXT;

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.cancellation_reason IS 'Reason provided by user for cancelling subscription';
COMMENT ON COLUMN subscriptions.cancellation_feedback IS 'Additional feedback provided by user when cancelling';