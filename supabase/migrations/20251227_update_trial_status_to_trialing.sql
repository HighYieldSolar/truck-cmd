-- Migration: Update trial status to trialing (Stripe standard)
-- This aligns our subscription status with Stripe's standard 'trialing' status

-- Update existing subscriptions with 'trial' status to 'trialing'
UPDATE subscriptions SET status = 'trialing' WHERE status = 'trial';

-- Update the default value for new subscriptions
ALTER TABLE subscriptions ALTER COLUMN status SET DEFAULT 'trialing';
