-- Migration: SMS consent columns + create missing tables from migration 005
-- Purpose: TCPA compliance - track explicit SMS consent per user

-- Add SMS consent columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_consent boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_consent_at timestamptz;

-- Create SMS opt-outs table (from migration 005 that was never applied)
CREATE TABLE IF NOT EXISTS sms_opt_outs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  opted_out_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT DEFAULT 'STOP'
);

CREATE INDEX IF NOT EXISTS idx_sms_opt_outs_phone ON sms_opt_outs (phone_number);

ALTER TABLE sms_opt_outs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sms_opt_outs' AND policyname = 'Service role only') THEN
    CREATE POLICY "Service role only" ON sms_opt_outs FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Create marketing emails sent table (from migration 005)
CREATE TABLE IF NOT EXISTS marketing_emails_sent (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email_type)
);

CREATE INDEX IF NOT EXISTS idx_marketing_emails_user ON marketing_emails_sent (user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_emails_type ON marketing_emails_sent (email_type);

ALTER TABLE marketing_emails_sent ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketing_emails_sent' AND policyname = 'Service role only') THEN
    CREATE POLICY "Service role only" ON marketing_emails_sent FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;
