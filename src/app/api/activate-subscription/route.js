// src/app/api/activate-subscription/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Helper function to generate a consistent ID for deduplication
 */
function generateIdempotencyKey(userId, sessionId) {
  return `${userId}_${sessionId}`;
}

/**
 * Checks if a session has already been processed
 */
async function hasProcessedSession(userId, sessionId) {
  // Generate a unique key for this operation
  const idempotencyKey = generateIdempotencyKey(userId, sessionId);
  
  try {
    // Use a table to track processed sessions
    const { data, error } = await supabase
      .from('processed_sessions')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned"
      console.error('Error checking for processed session:', error);
      // If there's an error, assume we haven't processed it yet
      return false;
    }
    
    // If we found a record, this session has already been processed
    return !!data;
  } catch (err) {
    console.error('Error in hasProcessedSession:', err);
    // If the processed_sessions table doesn't exist yet, assume not processed
    return false;
  }
}

/**
 * Records that a session has been processed to prevent duplicates
 */
async function markSessionAsProcessed(userId, sessionId) {
  // Generate a unique key for this operation
  const idempotencyKey = generateIdempotencyKey(userId, sessionId);
  
  try {
    const { error } = await supabase
      .from('processed_sessions')
      .insert([{
        idempotency_key: idempotencyKey,
        user_id: userId,
        session_id: sessionId,
        processed_at: new Date().toISOString()
      }]);
      
    if (error) {
      console.error('Error marking session as processed:', error);
    }
  } catch (err) {
    // If the table doesn't exist, that's ok for now
    console.warn('Could not mark session as processed:', err);
  }
}

export async function POST(request) {
  try {
    // Get data from the request
    const { userId, sessionId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }
    
    console.log(`Checking if subscription for user ${userId} with session ${sessionId} has already been processed`);
    
    // Check if we've already processed this session for this user
    if (await hasProcessedSession(userId, sessionId)) {
      console.log(`Session ${sessionId} has already been processed for user ${userId}, skipping`);
      return NextResponse.json({ 
        success: true, 
        message: 'Session already processed',
        alreadyProcessed: true 
      });
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
    
    let result;
    
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
      result = { success: true, message: 'All subscription records updated to active' };
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
      result = { success: true, message: 'New active subscription record created' };
    }
    
    // Mark this session as processed to prevent duplicate processing
    await markSessionAsProcessed(userId, sessionId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}