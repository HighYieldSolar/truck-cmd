set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.api_create_expense(p_expense jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_expense_id UUID;
  new_expense JSONB;
BEGIN
  -- Insert the expense
  INSERT INTO expenses (
    user_id,
    date,
    amount,
    category,
    description,
    payment_method,
    vehicle_id,
    deductible,
    receipt_image,
    notes,
    load_id,
    driver_id,
    location,
    tax_category
  ) VALUES (
    auth.uid(),
    COALESCE((p_expense->>'date')::DATE, CURRENT_DATE),
    (p_expense->>'amount')::DECIMAL,
    p_expense->>'category',
    p_expense->>'description',
    p_expense->>'payment_method',
    (p_expense->>'vehicle_id')::UUID,
    COALESCE((p_expense->>'deductible')::BOOLEAN, TRUE),
    p_expense->>'receipt_image',
    p_expense->>'notes',
    (p_expense->>'load_id')::UUID,
    (p_expense->>'driver_id')::UUID,
    p_expense->>'location',
    p_expense->>'tax_category'
  )
  RETURNING id INTO new_expense_id;
  
  -- Get the full expense data
  SELECT row_to_json(e)::JSONB INTO new_expense
  FROM expenses e
  WHERE e.id = new_expense_id;
  
  RETURN new_expense;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.api_get_expense_report(p_filters jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
  query_text TEXT;
  filter_category TEXT;
  filter_start_date TEXT;
  filter_end_date TEXT;
  filter_vehicle_id TEXT;
  filter_driver_id TEXT;
  filter_deductible BOOLEAN;
BEGIN
  -- Extract filter parameters
  filter_category := p_filters->>'category';
  filter_start_date := p_filters->>'startDate';
  filter_end_date := p_filters->>'endDate';
  filter_vehicle_id := p_filters->>'vehicleId';
  filter_driver_id := p_filters->>'driverId';
  filter_deductible := (p_filters->>'deductible')::BOOLEAN;
  
  -- Build the query
  query_text := '
    WITH expense_data AS (
      SELECT
        category,
        SUM(amount) as total,
        COUNT(*) as count
      FROM expenses
      WHERE user_id = auth.uid()';
  
  -- Add filters
  IF filter_category IS NOT NULL THEN
    query_text := query_text || ' AND category = ' || quote_literal(filter_category);
  END IF;
  
  IF filter_start_date IS NOT NULL THEN
    query_text := query_text || ' AND date >= ' || quote_literal(filter_start_date);
  END IF;
  
  IF filter_end_date IS NOT NULL THEN
    query_text := query_text || ' AND date <= ' || quote_literal(filter_end_date);
  END IF;
  
  IF filter_vehicle_id IS NOT NULL THEN
    query_text := query_text || ' AND vehicle_id = ' || quote_literal(filter_vehicle_id);
  END IF;
  
  IF filter_driver_id IS NOT NULL THEN
    query_text := query_text || ' AND driver_id = ' || quote_literal(filter_driver_id);
  END IF;
  
  IF filter_deductible IS NOT NULL THEN
    query_text := query_text || ' AND deductible = ' || filter_deductible;
  END IF;
  
  -- Finish the query
  query_text := query_text || '
      GROUP BY category
      ORDER BY total DESC
    ),
    expense_total AS (
      SELECT COALESCE(SUM(total), 0) as grand_total
      FROM expense_data
    )
    SELECT jsonb_build_object(
      ''total'', (SELECT grand_total FROM expense_total),
      ''byCategory'', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            ''category'', category,
            ''total'', total,
            ''count'', count,
            ''percentage'', ROUND((total / NULLIF((SELECT grand_total FROM expense_total), 0)) * 100, 2)
          )
        ),
        ''[]''::jsonb
      )
    ) FROM expense_data';
  
  -- Execute the query
  EXECUTE query_text INTO result;
  
  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.api_upload_receipt(p_expense_id uuid, p_file_path text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  success BOOLEAN;
BEGIN
  -- Verify that the expense belongs to the user
  IF NOT EXISTS (SELECT 1 FROM expenses WHERE id = p_expense_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Expense not found or access denied';
  END IF;
  
  -- Update the expense with the receipt image
  UPDATE expenses
  SET 
    receipt_image = p_file_path,
    updated_at = NOW()
  WHERE id = p_expense_id AND user_id = auth.uid();
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE is_read = true 
        AND read_at < (CURRENT_TIMESTAMP - INTERVAL '90 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_factored_earnings()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only trigger when factored changes from false to true
  IF NEW.factored = TRUE AND (OLD.factored = FALSE OR OLD.factored IS NULL) THEN
    -- Insert an earnings record
    INSERT INTO earnings (
      user_id, 
      load_id, 
      amount, 
      date, 
      source, 
      description, 
      factoring_company, 
      created_at
    ) VALUES (
      NEW.user_id,
      NEW.id,
      COALESCE(NEW.factored_amount, NEW.rate, 0),
      COALESCE(NEW.factored_at, NEW.completed_at, CURRENT_DATE),
      'Factoring',
      'Factored load #' || NEW.load_number || ': ' || COALESCE(NEW.origin, '') || ' to ' || COALESCE(NEW.destination, ''),
      NEW.factoring_company,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_ifta_trip_records_table()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Check if the table already exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ifta_trip_records') THEN
    RETURN TRUE;
  END IF;

  -- Create the IFTA trip records table
  CREATE TABLE public.ifta_trip_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    quarter TEXT NOT NULL,
    trip_date DATE NOT NULL,
    vehicle_id TEXT,
    load_id TEXT,
    start_jurisdiction TEXT,
    end_jurisdiction TEXT,
    total_miles NUMERIC,
    gallons NUMERIC,
    fuel_cost NUMERIC,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Add RLS policy
  ALTER TABLE public.ifta_trip_records ENABLE ROW LEVEL SECURITY;

  -- Add policy for users to select their own records
  CREATE POLICY select_own_trips ON public.ifta_trip_records
    FOR SELECT USING (auth.uid() = user_id);

  -- Add policy for users to insert their own records
  CREATE POLICY insert_own_trips ON public.ifta_trip_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  -- Add policy for users to update their own records
  CREATE POLICY update_own_trips ON public.ifta_trip_records
    FOR UPDATE USING (auth.uid() = user_id);

  -- Add policy for users to delete their own records
  CREATE POLICY delete_own_trips ON public.ifta_trip_records
    FOR DELETE USING (auth.uid() = user_id);

  -- Create the IFTA reports table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ifta_reports') THEN
    CREATE TABLE public.ifta_reports (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      quarter TEXT NOT NULL,
      year INTEGER NOT NULL,
      total_miles NUMERIC DEFAULT 0,
      total_gallons NUMERIC DEFAULT 0,
      total_tax NUMERIC DEFAULT 0,
      status TEXT DEFAULT 'draft',
      submitted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Add RLS policy
    ALTER TABLE public.ifta_reports ENABLE ROW LEVEL SECURITY;

    -- Add policy for users to select their own records
    CREATE POLICY select_own_reports ON public.ifta_reports
      FOR SELECT USING (auth.uid() = user_id);

    -- Add policy for users to insert their own records
    CREATE POLICY insert_own_reports ON public.ifta_reports
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    -- Add policy for users to update their own records
    CREATE POLICY update_own_reports ON public.ifta_reports
      FOR UPDATE USING (auth.uid() = user_id);

    -- Add policy for users to delete their own records
    CREATE POLICY delete_own_reports ON public.ifta_reports
      FOR DELETE USING (auth.uid() = user_id);
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating IFTA tables: %', SQLERRM;
    RETURN FALSE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_notification(p_user_id uuid, p_title text, p_message text, p_notification_type text DEFAULT 'GENERAL_REMINDER'::text, p_entity_type text DEFAULT NULL::text, p_entity_id text DEFAULT NULL::text, p_link_to text DEFAULT NULL::text, p_due_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_urgency text DEFAULT 'NORMAL'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    notification_id uuid;
BEGIN
    INSERT INTO notifications (
        user_id,
        title,
        message,
        notification_type,
        entity_type,
        entity_id,
        link_to,
        due_date,
        urgency,
        is_read,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_title,
        p_message,
        p_notification_type,
        p_entity_type,
        p_entity_id,
        p_link_to,
        p_due_date,
        p_urgency,
        false,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_compliance_notifications()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    notification_count INTEGER := 0;
    compliance_record RECORD;
    driver_record RECORD;
    notification_title TEXT;
    notification_message TEXT;
    link_url TEXT;
    urgency_level TEXT;
    current_date DATE := CURRENT_DATE;
BEGIN
    -- Check compliance_items for expiring documents
    FOR compliance_record IN 
        SELECT 
            ci.*,
            (ci.expiration_date - current_date) as days_until_expiry
        FROM compliance_items ci
        WHERE ci.expiration_date IS NOT NULL 
            AND ci.expiration_date >= current_date
            AND (ci.expiration_date - current_date) IN (30, 7, 1, 0) -- 30 days, 7 days, 1 day, and today
            AND ci.status != 'Expired'
    LOOP
        -- Determine urgency and message based on days until expiry
        CASE compliance_record.days_until_expiry
            WHEN 30 THEN
                urgency_level := 'LOW';
                notification_title := format('%s - Expiring in 30 Days', compliance_record.title);
                notification_message := format('Your %s for %s (%s) will expire in 30 days on %s. Please plan for renewal.',
                    compliance_record.title,
                    compliance_record.entity_name,
                    compliance_record.entity_type,
                    to_char(compliance_record.expiration_date, 'Mon DD, YYYY')
                );
            WHEN 7 THEN
                urgency_level := 'MEDIUM';
                notification_title := format('%s - Expiring in 7 Days', compliance_record.title);
                notification_message := format('ATTENTION: Your %s for %s (%s) will expire in 7 days on %s. Please renew immediately.',
                    compliance_record.title,
                    compliance_record.entity_name,
                    compliance_record.entity_type,
                    to_char(compliance_record.expiration_date, 'Mon DD, YYYY')
                );
            WHEN 1 THEN
                urgency_level := 'HIGH';
                notification_title := format('%s - Expires Tomorrow!', compliance_record.title);
                notification_message := format('URGENT: Your %s for %s (%s) expires TOMORROW (%s). Immediate action required!',
                    compliance_record.title,
                    compliance_record.entity_name,
                    compliance_record.entity_type,
                    to_char(compliance_record.expiration_date, 'Mon DD, YYYY')
                );
            WHEN 0 THEN
                urgency_level := 'CRITICAL';
                notification_title := format('%s - EXPIRES TODAY!', compliance_record.title);
                notification_message := format('CRITICAL: Your %s for %s (%s) EXPIRES TODAY (%s). Take immediate action!',
                    compliance_record.title,
                    compliance_record.entity_name,
                    compliance_record.entity_type,
                    to_char(compliance_record.expiration_date, 'Mon DD, YYYY')
                );
            ELSE
                CONTINUE;
        END CASE;

        link_url := '/dashboard/compliance';

        -- Check if notification already exists for this item and time period
        IF NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE user_id = compliance_record.user_id 
                AND entity_type = 'compliance_item'
                AND entity_id = compliance_record.id::text
                AND notification_type = 'DOCUMENT_EXPIRY_COMPLIANCE'
                AND due_date = compliance_record.expiration_date
                AND urgency = urgency_level
        ) THEN
            -- Create notification
            PERFORM public.create_notification(
                compliance_record.user_id,
                notification_title,
                notification_message,
                'DOCUMENT_EXPIRY_COMPLIANCE',
                'compliance_item',
                compliance_record.id::text,
                link_url,
                compliance_record.expiration_date::timestamp with time zone,
                urgency_level
            );
            
            notification_count := notification_count + 1;
        END IF;
    END LOOP;

    -- Check drivers table for expiring licenses and medical cards
    FOR driver_record IN 
        SELECT 
            d.*,
            CASE 
                WHEN d.license_expiry IS NOT NULL AND (d.license_expiry - current_date) IN (30, 7, 1, 0) THEN 'license'
                WHEN d.medical_card_expiry IS NOT NULL AND (d.medical_card_expiry - current_date) IN (30, 7, 1, 0) THEN 'medical_card'
                ELSE NULL
            END as expiry_type,
            CASE 
                WHEN d.license_expiry IS NOT NULL THEN (d.license_expiry - current_date)
                WHEN d.medical_card_expiry IS NOT NULL THEN (d.medical_card_expiry - current_date)
                ELSE NULL
            END as days_until_expiry,
            CASE 
                WHEN d.license_expiry IS NOT NULL THEN d.license_expiry
                WHEN d.medical_card_expiry IS NOT NULL THEN d.medical_card_expiry
                ELSE NULL
            END as expiry_date
        FROM drivers d
        WHERE d.status = 'Active'
            AND (
                (d.license_expiry IS NOT NULL AND d.license_expiry >= current_date AND (d.license_expiry - current_date) IN (30, 7, 1, 0))
                OR
                (d.medical_card_expiry IS NOT NULL AND d.medical_card_expiry >= current_date AND (d.medical_card_expiry - current_date) IN (30, 7, 1, 0))
            )
    LOOP
        -- Skip if no expiry type determined
        CONTINUE WHEN driver_record.expiry_type IS NULL;

        -- Determine urgency and message based on days until expiry
        CASE driver_record.days_until_expiry
            WHEN 30 THEN
                urgency_level := 'LOW';
                IF driver_record.expiry_type = 'license' THEN
                    notification_title := format('Driver License - %s - Expiring in 30 Days', driver_record.name);
                    notification_message := format('Driver %s''s license will expire in 30 days on %s. Please plan for renewal.',
                        driver_record.name,
                        to_char(driver_record.expiry_date, 'Mon DD, YYYY')
                    );
                ELSE
                    notification_title := format('Medical Card - %s - Expiring in 30 Days', driver_record.name);
                    notification_message := format('Driver %s''s medical card will expire in 30 days on %s. Please schedule medical exam.',
                        driver_record.name,
                        to_char(driver_record.expiry_date, 'Mon DD, YYYY')
                    );
                END IF;
            WHEN 7 THEN
                urgency_level := 'MEDIUM';
                IF driver_record.expiry_type = 'license' THEN
                    notification_title := format('Driver License - %s - Expiring in 7 Days', driver_record.name);
                    notification_message := format('ATTENTION: Driver %s''s license will expire in 7 days on %s. Renew immediately.',
                        driver_record.name,
                        to_char(driver_record.expiry_date, 'Mon DD, YYYY')
                    );
                ELSE
                    notification_title := format('Medical Card - %s - Expiring in 7 Days', driver_record.name);
                    notification_message := format('ATTENTION: Driver %s''s medical card will expire in 7 days on %s. Schedule medical exam immediately.',
                        driver_record.name,
                        to_char(driver_record.expiry_date, 'Mon DD, YYYY')
                    );
                END IF;
            WHEN 1 THEN
                urgency_level := 'HIGH';
                IF driver_record.expiry_type = 'license' THEN
                    notification_title := format('Driver License - %s - Expires Tomorrow!', driver_record.name);
                    notification_message := format('URGENT: Driver %s''s license expires TOMORROW (%s). Immediate action required!',
                        driver_record.name,
                        to_char(driver_record.expiry_date, 'Mon DD, YYYY')
                    );
                ELSE
                    notification_title := format('Medical Card - %s - Expires Tomorrow!', driver_record.name);
                    notification_message := format('URGENT: Driver %s''s medical card expires TOMORROW (%s). Immediate action required!',
                        driver_record.name,
                        to_char(driver_record.expiry_date, 'Mon DD, YYYY')
                    );
                END IF;
            WHEN 0 THEN
                urgency_level := 'CRITICAL';
                IF driver_record.expiry_type = 'license' THEN
                    notification_title := format('Driver License - %s - EXPIRES TODAY!', driver_record.name);
                    notification_message := format('CRITICAL: Driver %s''s license EXPIRES TODAY (%s). Driver cannot operate!',
                        driver_record.name,
                        to_char(driver_record.expiry_date, 'Mon DD, YYYY')
                    );
                ELSE
                    notification_title := format('Medical Card - %s - EXPIRES TODAY!', driver_record.name);
                    notification_message := format('CRITICAL: Driver %s''s medical card EXPIRES TODAY (%s). Driver cannot operate!',
                        driver_record.name,
                        to_char(driver_record.expiry_date, 'Mon DD, YYYY')
                    );
                END IF;
            ELSE
                CONTINUE;
        END CASE;

        link_url := '/dashboard/fleet';

        -- Check if notification already exists for this driver and document type
        IF NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE user_id = driver_record.user_id 
                AND entity_type = 'driver'
                AND entity_id = driver_record.id::text
                AND notification_type = CASE 
                    WHEN driver_record.expiry_type = 'license' THEN 'DOCUMENT_EXPIRY_DRIVER_LICENSE'
                    ELSE 'DOCUMENT_EXPIRY_DRIVER_MEDICAL'
                END
                AND due_date = driver_record.expiry_date::timestamp with time zone
                AND urgency = urgency_level
        ) THEN
            -- Create notification
            PERFORM public.create_notification(
                driver_record.user_id,
                notification_title,
                notification_message,
                CASE 
                    WHEN driver_record.expiry_type = 'license' THEN 'DOCUMENT_EXPIRY_DRIVER_LICENSE'
                    ELSE 'DOCUMENT_EXPIRY_DRIVER_MEDICAL'
                END,
                'driver',
                driver_record.id::text,
                link_url,
                driver_record.expiry_date::timestamp with time zone,
                urgency_level
            );
            
            notification_count := notification_count + 1;
        END IF;
    END LOOP;

    RETURN notification_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_all_notifications(p_user_id uuid, p_page_number integer DEFAULT 1, p_page_size integer DEFAULT 15, p_filter_types text[] DEFAULT NULL::text[], p_filter_read_status boolean DEFAULT NULL::boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    notifications_data jsonb;
    total_count integer;
    offset_count integer;
BEGIN
    -- Calculate offset
    offset_count := (p_page_number - 1) * p_page_size;
    
    -- Get total count for pagination
    SELECT COUNT(*) INTO total_count
    FROM notifications 
    WHERE user_id = p_user_id
        AND (p_filter_types IS NULL OR notification_type = ANY(p_filter_types))
        AND (p_filter_read_status IS NULL OR is_read = p_filter_read_status);
    
    -- Get notifications data
    WITH notification_data AS (
        SELECT 
            id,
            title,
            message,
            notification_type,
            entity_type,
            entity_id,
            link_to,
            due_date,
            urgency,
            is_read,
            read_at,
            created_at,
            updated_at
        FROM notifications 
        WHERE user_id = p_user_id
            AND (p_filter_types IS NULL OR notification_type = ANY(p_filter_types))
            AND (p_filter_read_status IS NULL OR is_read = p_filter_read_status)
        ORDER BY 
            CASE WHEN urgency = 'CRITICAL' THEN 1
                 WHEN urgency = 'HIGH' THEN 2
                 WHEN urgency = 'MEDIUM' THEN 3
                 WHEN urgency = 'LOW' THEN 4
                 ELSE 5 END,
            is_read ASC,
            created_at DESC
        LIMIT p_page_size
        OFFSET offset_count
    )
    SELECT jsonb_build_object(
        'notifications', jsonb_agg(
            jsonb_build_object(
                'id', nd.id,
                'title', nd.title,
                'message', nd.message,
                'type', nd.notification_type,
                'entity_type', nd.entity_type,
                'entity_id', nd.entity_id,
                'link_to', nd.link_to,
                'due_date', nd.due_date,
                'urgency', nd.urgency,
                'is_read', nd.is_read,
                'read_at', nd.read_at,
                'created_at', nd.created_at,
                'updated_at', nd.updated_at
            )
        ),
        'pagination', jsonb_build_object(
            'current_page', p_page_number,
            'page_size', p_page_size,
            'total_count', total_count,
            'total_pages', CEIL(total_count::float / p_page_size::float)
        )
    ) INTO notifications_data
    FROM notification_data nd;
    
    -- Handle case where no notifications found
    IF notifications_data IS NULL THEN
        SELECT jsonb_build_object(
            'notifications', '[]'::jsonb,
            'pagination', jsonb_build_object(
                'current_page', p_page_number,
                'page_size', p_page_size,
                'total_count', 0,
                'total_pages', 0
            )
        ) INTO notifications_data;
    END IF;
    
    RETURN notifications_data;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_compliance_summary(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    summary jsonb;
    current_date DATE := CURRENT_DATE;
BEGIN
    WITH compliance_stats AS (
        SELECT 
            COUNT(*) as total_items,
            COUNT(CASE WHEN expiration_date < current_date THEN 1 END) as expired,
            COUNT(CASE WHEN expiration_date >= current_date AND expiration_date <= current_date + INTERVAL '30 days' THEN 1 END) as expiring_soon,
            COUNT(CASE WHEN expiration_date > current_date + INTERVAL '30 days' THEN 1 END) as active,
            COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending
        FROM compliance_items 
        WHERE user_id = p_user_id
    ),
    driver_stats AS (
        SELECT 
            COUNT(*) as total_drivers,
            COUNT(CASE WHEN license_expiry < current_date OR medical_card_expiry < current_date THEN 1 END) as expired_docs,
            COUNT(CASE WHEN 
                (license_expiry >= current_date AND license_expiry <= current_date + INTERVAL '30 days') OR
                (medical_card_expiry >= current_date AND medical_card_expiry <= current_date + INTERVAL '30 days')
                THEN 1 END) as expiring_soon_docs
        FROM drivers 
        WHERE user_id = p_user_id AND status = 'Active'
    ),
    recent_expirations AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', ordered_items.id,
                'title', ordered_items.title,
                'entity_name', ordered_items.entity_name,
                'entity_type', ordered_items.entity_type,
                'expiration_date', ordered_items.expiration_date,
                'days_until_expiry', ordered_items.days_until_expiry
            )
        ) as items
        FROM (
            SELECT 
                id,
                title,
                entity_name,
                entity_type,
                expiration_date,
                (expiration_date - current_date) as days_until_expiry
            FROM compliance_items
            WHERE user_id = p_user_id 
                AND expiration_date >= current_date
                AND expiration_date <= current_date + INTERVAL '30 days'
            ORDER BY expiration_date ASC
            LIMIT 10
        ) as ordered_items
    )
    SELECT jsonb_build_object(
        'compliance', jsonb_build_object(
            'total_items', COALESCE(cs.total_items, 0),
            'expired', COALESCE(cs.expired, 0),
            'expiring_soon', COALESCE(cs.expiring_soon, 0),
            'active', COALESCE(cs.active, 0),
            'pending', COALESCE(cs.pending, 0)
        ),
        'drivers', jsonb_build_object(
            'total_drivers', COALESCE(ds.total_drivers, 0),
            'expired_docs', COALESCE(ds.expired_docs, 0),
            'expiring_soon_docs', COALESCE(ds.expiring_soon_docs, 0)
        ),
        'recent_expirations', COALESCE(re.items, '[]'::jsonb)
    ) INTO summary
    FROM compliance_stats cs
    CROSS JOIN driver_stats ds
    CROSS JOIN recent_expirations re;
    
    RETURN summary;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_invoices_stats(p_user_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_status text DEFAULT NULL::text)
 RETURNS TABLE(total numeric, paid numeric, pending numeric, overdue numeric, count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  now_date DATE := CURRENT_DATE;
BEGIN
  RETURN QUERY
  WITH invoice_data AS (
    SELECT
      i.id,
      i.total,
      i.amount_paid,
      i.status,
      i.due_date,
      CASE
        WHEN i.status = 'Paid' OR i.status = 'Partially Paid' THEN i.amount_paid
        ELSE 0
      END as paid_amount,
      CASE
        WHEN i.status = 'Pending' AND i.due_date >= now_date THEN i.total - COALESCE(i.amount_paid, 0)
        ELSE 0
      END as pending_amount,
      CASE
        WHEN (i.status = 'Pending' OR i.status = 'Overdue') AND i.due_date < now_date THEN i.total - COALESCE(i.amount_paid, 0)
        ELSE 0
      END as overdue_amount
    FROM invoices i
    WHERE 
      i.user_id = p_user_id AND
      (p_start_date IS NULL OR i.invoice_date >= p_start_date) AND
      (p_end_date IS NULL OR i.invoice_date <= p_end_date) AND
      (p_status IS NULL OR i.status = p_status)
  )
  SELECT
    COALESCE(SUM(total), 0) as total,
    COALESCE(SUM(paid_amount), 0) as paid,
    COALESCE(SUM(pending_amount), 0) as pending,
    COALESCE(SUM(overdue_amount), 0) as overdue,
    COUNT(id)::INTEGER as count
  FROM invoice_data;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_recent_notifications(p_user_id uuid, p_limit integer DEFAULT 5)
 RETURNS SETOF notifications
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT *
  FROM notifications
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_unread_notifications_count(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM notifications
  WHERE user_id = p_user_id AND is_read = false;
  
  RETURN v_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_unread_notifications_summary(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    summary jsonb;
BEGIN
    WITH notification_stats AS (
        SELECT 
            COUNT(*) as total_unread,
            COUNT(CASE WHEN urgency = 'CRITICAL' THEN 1 END) as critical,
            COUNT(CASE WHEN urgency = 'HIGH' THEN 1 END) as high,
            COUNT(CASE WHEN urgency = 'MEDIUM' THEN 1 END) as medium,
            COUNT(CASE WHEN urgency = 'LOW' THEN 1 END) as low,
            COUNT(CASE WHEN notification_type LIKE 'DOCUMENT_EXPIRY%' THEN 1 END) as document_expiry,
            COUNT(CASE WHEN due_date <= CURRENT_DATE THEN 1 END) as overdue
        FROM notifications 
        WHERE user_id = p_user_id 
            AND is_read = false
    )
    SELECT jsonb_build_object(
        'total_unread', COALESCE(ns.total_unread, 0),
        'by_urgency', jsonb_build_object(
            'critical', COALESCE(ns.critical, 0),
            'high', COALESCE(ns.high, 0),
            'medium', COALESCE(ns.medium, 0),
            'low', COALESCE(ns.low, 0)
        ),
        'document_expiry', COALESCE(ns.document_expiry, 0),
        'overdue', COALESCE(ns.overdue, 0)
    ) INTO summary
    FROM notification_stats ns;
    
    RETURN summary;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (new.id, new.email, new.created_at, new.updated_at);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    updated_count integer;
BEGIN
    UPDATE notifications 
    SET 
        is_read = true,
        read_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id 
        AND is_read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_notification_as_read(p_notification_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE notifications 
    SET 
        is_read = true,
        read_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_notification_id 
        AND user_id = p_user_id
        AND is_read = false;
    
    RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_invoice_payment_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  invoice_record RECORD;
  total_paid DECIMAL(10, 2);
BEGIN
  -- Get the invoice
  SELECT * INTO invoice_record FROM invoices WHERE id = NEW.invoice_id;
  
  -- Calculate total paid amount including this payment
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM payments
  WHERE invoice_id = NEW.invoice_id AND status = 'completed';
  
  -- Add the new payment if it's being inserted and is completed
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    total_paid := total_paid + NEW.amount;
  END IF;
  
  -- Update the invoice amount_paid and status
  UPDATE invoices
  SET 
    amount_paid = total_paid,
    status = CASE
      WHEN total_paid >= invoice_record.total THEN 'Paid'
      WHEN total_paid > 0 THEN 'Partially Paid'
      ELSE invoice_record.status
    END,
    payment_date = CASE
      WHEN total_paid >= invoice_record.total THEN CURRENT_DATE
      ELSE invoice_record.payment_date
    END
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_invoice_status_on_due_date()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- If invoice is already paid, don't change
  IF NEW.status = 'Paid' THEN
    RETURN NEW;
  END IF;
  
  -- Check if due date has passed and update to Overdue
  IF NEW.due_date < CURRENT_DATE AND NEW.status = 'Pending' THEN
    NEW.status := 'Overdue';
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_load_completion_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  total_stops INTEGER;
  completed_stops INTEGER;
  load_record RECORD;
BEGIN
  -- Count total and completed stops
  SELECT COUNT(*) INTO total_stops
  FROM load_stops
  WHERE load_id = NEW.load_id;
  
  SELECT COUNT(*) INTO completed_stops
  FROM load_stops
  WHERE load_id = NEW.load_id AND status = 'Completed';
  
  -- If all stops are completed, update load status
  IF total_stops > 0 AND total_stops = completed_stops THEN
    SELECT * INTO load_record FROM loads WHERE id = NEW.load_id;
    
    -- Only update if load isn't already completed
    IF load_record.status != 'Completed' THEN
      UPDATE loads
      SET 
        status = 'Delivered',
        updated_at = NOW()
      WHERE id = NEW.load_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;


