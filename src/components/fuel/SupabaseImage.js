// src/components/fuel/SupabaseImage.js
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Component that uses Supabase client library to properly fetch images
 * with stable rendering and no flickering
 */
export default function SupabaseImage({ 
  src, 
  alt = "Image", 
  className = "", 
  style = {}, 
  onLoad = () => {}, 
  onError = () => {} 
,
  timestamp // Add timestamp prop
}) {
  const [objectUrl, setObjectUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Use refs to prevent unnecessary re-renders
  const mountedRef = useRef(true);
  const urlCacheRef = useRef(new Map());

  // Helper to extract bucket and path from Supabase URL (kept in case needed elsewhere)
  const parseSupabaseUrl = (url) => {
    try {
      const urlObj = new URL(url);
      let path = urlObj.pathname;
      path = path.replace('/storage/v1/object/public/', '');
      const [bucket, ...restParts] = path.split('/');
      const filePath = restParts.join('/');
      return { bucket, filePath };
    } catch (err) {
      console.error('Error parsing Supabase URL:', err);
      return null;
    }
  };

  useEffect(() => {
    // Set mounted ref to true when component mounts
    mountedRef.current = true;
    
    // Store blob URLs for cleanup (no longer needed for Supabase URLs with this change)
    const blobUrlsToCleanup = [];
    
    async function fetchSupabaseFile() {
      if (!src) {
        if (mountedRef.current) {
          setLoading(false);
          setError(true);
        }
        return;
      }

      try {
        // Use timestamp in cache key if available
        const cacheKey = timestamp ? `${src}?t=${timestamp}` : src;
        // Check cache first to prevent unnecessary fetches
        if (urlCacheRef.current.has(cacheKey)) {
          const cachedUrl = urlCacheRef.current.get(cacheKey); // Use cacheKey here
          console.log('Using cached URL:', cachedUrl);
          if (mountedRef.current) { // Check mountedRef before setting state
             setObjectUrl(cachedUrl);
             setLoading(false);
          }
          return;
        }

        // Set loading only on initial fetch
        if (mountedRef.current && !objectUrl) {
          setLoading(true);
          setError(false);
        }

        // Handle Supabase storage URLs
        if (src.includes('supabase.co/storage/v1/object/public')) {
           // *** MODIFICATION START ***
           // Directly use the public URL since download button works
           console.log('Using public Supabase URL directly:', src);
           const imageUrl = timestamp ? `${src}?t=${timestamp}` : src; // Add timestamp for cache busting
           urlCacheRef.current.set(cacheKey, imageUrl); // Cache the direct URL
 
           if (mountedRef.current) {
             setObjectUrl(imageUrl); // Use the direct URL
             setLoading(false);
           }
           // *** MODIFICATION END ***
        } else {
          // For regular URLs, use as is (existing logic)
          console.log('Using regular URL:', src);
          const imageUrl = timestamp ? `${src}?t=${timestamp}` : src; // Add timestamp for cache busting
          urlCacheRef.current.set(cacheKey, imageUrl); // Cache the URL
          if (mountedRef.current) {
            setObjectUrl(imageUrl);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error processing image source:', err);
        if (mountedRef.current) {
          setError(true);
          setLoading(false);
          onError(err);
        }
      }
    }

    fetchSupabaseFile();
    
    // Cleanup function
    return () => {
      // Mark component as unmounted
      mountedRef.current = false;
      
      // Clean up any blob URLs created (though none should be created for Supabase now)
      blobUrlsToCleanup.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // Ignore errors when revoking
        }
      });
    }; 
  }, [src, timestamp, onError]); // Added timestamp to dependencies

  // Handle image events
  const handleLoad = (e) => {
    if (mountedRef.current && !error) {
       setLoading(false); // Ensure loading is false on successful load
       onLoad(e);
    }
  };

  const handleError = (e) => {
     console.error("Image failed to load:", src, e)
    if (mountedRef.current) {
       setError(true);
       setLoading(false);
       onError(e);
    }
  };

  // Loading state with stable dimensions
  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`} 
        style={{
          ...style,
          minHeight: style.height || '200px', // Use provided height or default
          minWidth: style.width || '200px' // Use provided width or default
        }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state with stable dimensions
  if (error || !objectUrl) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`} 
        style={{
           ...style,
           minHeight: style.height || '200px', // Use provided height or default
           minWidth: style.width || '200px' // Use provided width or default
        }}
      >
        <div className="text-center p-4">
          <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="text-gray-500 text-sm">Image not available</p>
        </div>
      </div>
    );
  }

  // Render image using the objectUrl (which is now the direct public URL for Supabase images)
  return (
    <img
      key={objectUrl} // Use objectUrl as key to force re-render if URL changes
      src={objectUrl}
      alt={alt}
      className={className}
      style={{
        ...style,
        backgroundColor: "#ffffff" // Optional: background for transparency
      }}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}
