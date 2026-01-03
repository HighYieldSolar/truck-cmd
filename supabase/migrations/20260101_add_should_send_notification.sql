-- Migration: Add should_send_notification function for email/SMS delivery
-- This function checks user preferences to determine if a notification should be sent

-- Function to check if a notification should be sent via a specific channel
CREATE OR REPLACE FUNCTION should_send_notification(
  p_user_id UUID,
  p_notification_type TEXT,
  p_channel TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_preferences JSONB;
  v_category TEXT;
  v_channel_prefs JSONB;
BEGIN
  -- Get user's notification preferences
  SELECT preferences INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;

  -- If no preferences found, default to true for email, false for SMS
  IF v_preferences IS NULL THEN
    RETURN CASE
      WHEN p_channel = 'email' THEN TRUE
      WHEN p_channel = 'sms' THEN FALSE
      ELSE TRUE
    END;
  END IF;

  -- Map notification types to categories
  v_category := CASE
    WHEN p_notification_type LIKE 'DOCUMENT_EXPIRY%' THEN 'documents'
    WHEN p_notification_type LIKE 'INVOICE%' OR p_notification_type = 'PAYMENT_RECEIVED' THEN 'invoices'
    WHEN p_notification_type LIKE 'LOAD%' OR p_notification_type = 'DELIVERY_UPCOMING' THEN 'reminders'
    WHEN p_notification_type IN ('MAINTENANCE_DUE', 'FUEL_REMINDER') THEN 'reminders'
    WHEN p_notification_type = 'IFTA_DEADLINE' THEN 'reminders'
    WHEN p_notification_type LIKE 'EXPENSE%' THEN 'expenses'
    ELSE 'reminders'
  END;

  -- Get channel preferences
  v_channel_prefs := v_preferences->p_channel;

  IF v_channel_prefs IS NULL THEN
    RETURN CASE
      WHEN p_channel = 'email' THEN TRUE
      WHEN p_channel = 'sms' THEN FALSE
      ELSE TRUE
    END;
  END IF;

  -- Return the preference for this category, defaulting to true for email
  RETURN COALESCE((v_channel_prefs->>v_category)::BOOLEAN, p_channel = 'email');
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION should_send_notification(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION should_send_notification(UUID, TEXT, TEXT) TO service_role;
