-- Migration: Marketing email tracking + SMS opt-out tables
-- Purpose: Prevent duplicate marketing emails and respect SMS opt-outs

-- Marketing emails sent tracking (prevent duplicate sends)
CREATE TABLE IF NOT EXISTS marketing_emails_sent (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email_type)
);

CREATE INDEX IF NOT EXISTS idx_marketing_emails_user ON marketing_emails_sent (user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_emails_type ON marketing_emails_sent (email_type);

-- Enable RLS
ALTER TABLE marketing_emails_sent ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (cron jobs)
CREATE POLICY "Service role only" ON marketing_emails_sent
  FOR ALL USING (auth.role() = 'service_role');

-- SMS opt-out tracking (Twilio STOP/START compliance)
CREATE TABLE IF NOT EXISTS sms_opt_outs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  opted_out_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT DEFAULT 'STOP'
);

CREATE INDEX IF NOT EXISTS idx_sms_opt_outs_phone ON sms_opt_outs (phone_number);

-- Enable RLS
ALTER TABLE sms_opt_outs ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table
CREATE POLICY "Service role only" ON sms_opt_outs
  FOR ALL USING (auth.role() = 'service_role');
