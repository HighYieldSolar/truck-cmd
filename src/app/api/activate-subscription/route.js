// src/app/api/activate-subscription/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    // Get data from the request
    const { userId, sessionId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }
    
    console.log(`Activating subscription for user ${userId}`);
    
    // Query to see if user has subscription records
    const { data: existingSubscriptions, error: queryError } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', userId);
      
    if (queryError) {
      console.error('Error querying subscriptions:', queryError);
      return NextResponse.json({ success: false, error: queryError.message }, { status: 500 });
    }
    
    console.log('Existing subscriptions:', existingSubscriptions);
    
    // If multiple records exist, update them all to 'active'
    if (existingSubscriptions && existingSubscriptions.length > 0) {
      // Update all subscription records for this user to 'active'
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          trial_ends_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
        
      if (updateError) {
        console.error('Error updating subscriptions:', updateError);
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }
      
      console.log('Updated all subscription records to active');
      return NextResponse.json({ success: true, message: 'All subscription records updated to active' });
    } else {
      // No records found, create a new one with 'active' status
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert([{
          user_id: userId,
          status: 'active',
          checkout_session_id: sessionId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
        
      if (insertError) {
        console.error('Error creating subscription:', insertError);
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
      }
      
      console.log('Created new active subscription record');
      return NextResponse.json({ success: true, message: 'New active subscription record created' });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}