// src/app/api/search/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { globalSearch, SEARCH_ENTITY_TYPES } from '@/lib/services/searchService';

// Create an authenticated Supabase client with the user's token
function createAuthenticatedClient(accessToken) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  );
}

export async function POST(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Unauthorized - No valid authorization header'
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create authenticated client with user's token
    const supabase = createAuthenticatedClient(token);

    // Verify the user's session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({
        error: 'Unauthorized - Invalid session'
      }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { query, types, limitPerType } = body;

    // Validate query
    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        error: 'Query parameter is required'
      }, { status: 400 });
    }

    if (query.trim().length < 2) {
      return NextResponse.json({
        error: 'Query must be at least 2 characters'
      }, { status: 400 });
    }

    // Validate types if provided
    const validTypes = Object.values(SEARCH_ENTITY_TYPES);
    let searchTypes = validTypes;

    if (types && Array.isArray(types)) {
      searchTypes = types.filter(t => validTypes.includes(t));
      if (searchTypes.length === 0) {
        searchTypes = validTypes;
      }
    }

    // Validate limitPerType
    const limit = typeof limitPerType === 'number' && limitPerType > 0 && limitPerType <= 20
      ? limitPerType
      : 5;

    // Perform the search with the authenticated supabase client
    const searchResults = await globalSearch(user.id, query, {
      types: searchTypes,
      limitPerType: limit,
      supabaseClient: supabase
    });

    return NextResponse.json(searchResults);

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}

// Also support GET for simpler requests
export async function GET(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Unauthorized - No valid authorization header'
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create authenticated client with user's token
    const supabase = createAuthenticatedClient(token);

    // Verify the user's session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({
        error: 'Unauthorized - Invalid session'
      }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query');
    const typesParam = searchParams.get('types');
    const limitParam = searchParams.get('limit');

    // Validate query
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        error: 'Query must be at least 2 characters'
      }, { status: 400 });
    }

    // Parse types
    const validTypes = Object.values(SEARCH_ENTITY_TYPES);
    let searchTypes = validTypes;

    if (typesParam) {
      const requestedTypes = typesParam.split(',').map(t => t.trim());
      searchTypes = requestedTypes.filter(t => validTypes.includes(t));
      if (searchTypes.length === 0) {
        searchTypes = validTypes;
      }
    }

    // Parse limit
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 5, 1), 20) : 5;

    // Perform the search with the authenticated supabase client
    const searchResults = await globalSearch(user.id, query, {
      types: searchTypes,
      limitPerType: limit,
      supabaseClient: supabase
    });

    return NextResponse.json(searchResults);

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}
