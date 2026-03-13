-- Migration: Add email bounce tracking columns to users table
-- Purpose: Track undeliverable emails from Resend webhook events

-- Add columns for bounce tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_undeliverable BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_bounce_reason TEXT;

-- Add index for quick lookup of undeliverable emails
CREATE INDEX IF NOT EXISTS idx_users_email_undeliverable ON users (email_undeliverable) WHERE email_undeliverable = TRUE;

-- Add marketing_emails column to notification_preferences if not exists
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT TRUE;
