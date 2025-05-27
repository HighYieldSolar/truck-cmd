-- Add cancellation-related columns to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS canceled_at timestamp with time zone DEFAULT null,
ADD COLUMN IF NOT EXISTS checkout_session_id character varying(255) DEFAULT null,
ADD COLUMN IF NOT EXISTS checkout_initiated_at timestamp with time zone DEFAULT null;

-- Add comments for clarity
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Whether the subscription will be canceled at the end of the current period';
COMMENT ON COLUMN subscriptions.canceled_at IS 'When the subscription was canceled';
COMMENT ON COLUMN subscriptions.checkout_session_id IS 'Stripe checkout session ID used to create this subscription';
COMMENT ON COLUMN subscriptions.checkout_initiated_at IS 'When the checkout process was initiated'; 