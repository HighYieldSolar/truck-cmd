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
}) {
  const [objectUrl, setObjectUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Use refs to prevent unnecessary re-renders
  const mountedRef = useRef(true);
  const urlCacheRef = useRef(new Map());

  // Helper to extract bucket and path from Supabase URL
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
    
    // Store blob URLs for cleanup
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
        // Check cache first to prevent unnecessary fetches
        if (urlCacheRef.current.has(src)) {
          const cachedUrl = urlCacheRef.current.get(src);
          console.log('Using cached blob URL:', cachedUrl);
          setObjectUrl(cachedUrl);
          setLoading(false);
          return;
        }

        // Set loading only on initial fetch
        if (mountedRef.current && !objectUrl) {
          setLoading(true);
          setError(false);
        }

        // Handle Supabase storage URLs
        if (src.includes('supabase.co/storage/v1/object/public')) {
          const parsedUrl = parseSupabaseUrl(src);
          
          if (!parsedUrl) {
            throw new Error('Failed to parse Supabase URL');
          }
          
          const { bucket, filePath } = parsedUrl;
          console.log('Downloading from Supabase storage:', { bucket, filePath });
          
          // Use the Supabase client to download the file
          const { data, error } = await supabase.storage
            .from(bucket)
            .download(filePath);
          
          if (error) {
            throw error;
          }
          
          if (!data) {
            throw new Error('No data received from Supabase');
          }
          
          // Create a blob URL and store it in cache
          const blobUrl = URL.createObjectURL(data);
          blobUrlsToCleanup.push(blobUrl);
          urlCacheRef.current.set(src, blobUrl);
          
          if (mountedRef.current) {
            setObjectUrl(blobUrl);
            setLoading(false);
          }
        } else {
          // For regular URLs, use as is
          urlCacheRef.current.set(src, src);
          if (mountedRef.current) {
            setObjectUrl(src);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error fetching image from Supabase:', err);
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
      
      // Clean up any blob URLs created in this render cycle
      blobUrlsToCleanup.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // Ignore errors when revoking
        }
      });
    };
  }, [src, onError]); // Remove objectUrl from dependencies to prevent re-renders

  // Handle image events
  const handleLoad = (e) => {
    if (!error) onLoad(e);
  };

  const handleError = (e) => {
    setError(true);
    onError(e);
  };

  // Loading state with stable dimensions
  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`} 
        style={{
          ...style,
          minHeight: '200px',
          minWidth: '200px'
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
          minHeight: '200px',
          minWidth: '200px'
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

  // Render image with key to prevent React from reusing the element
  return (
    <img
      key={`img-${src.substring(0, 20)}`}
      src={objectUrl}
      alt={alt}
      className={className}
      style={{
        ...style,
        backgroundColor: "#ffffff"
      }}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}