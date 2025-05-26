-- Add the missing get_compliance_summary function
-- This function provides compliance data for the dashboard

CREATE OR REPLACE FUNCTION public.get_compliance_summary(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_compliance_summary(uuid) TO authenticated; 