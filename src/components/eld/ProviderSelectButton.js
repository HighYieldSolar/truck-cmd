"use client";

import { useState, useRef, useEffect } from 'react';
import { Link2, Loader2, ChevronDown, Check, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

/**
 * Provider metadata for display
 */
const PROVIDERS = [
  {
    id: 'motive',
    name: 'Motive',
    subtitle: '(KeepTruckin)',
    description: 'The #1 ELD provider with dedicated IFTA endpoints',
    logo: '/images/eld/motive.webp',
    color: 'bg-green-500',
    features: ['IFTA Mileage', 'HOS Logs', 'GPS Tracking', 'Fuel Data', 'Diagnostics']
  },
  {
    id: 'samsara',
    name: 'Samsara',
    subtitle: '',
    description: 'Leading fleet management with real-time GPS',
    logo: '/images/eld/samsara.webp',
    color: 'bg-blue-500',
    features: ['IFTA Mileage', 'HOS Logs', 'GPS Tracking', 'Real-time Feed', 'Diagnostics']
  }
];

/**
 * ProviderSelectButton - Opens dropdown to select and connect ELD provider
 *
 * @param {function} onSuccess - Callback when OAuth redirect is initiated
 * @param {function} onError - Callback on error
 * @param {string} className - Additional CSS classes
 * @param {string} variant - 'primary' | 'secondary' | 'outline'
 * @param {boolean} disabled - Whether button is disabled
 * @param {Array} existingProviders - Array of provider IDs already connected
 */
export default function ProviderSelectButton({
  onSuccess,
  onError,
  className = '',
  variant = 'primary',
  disabled = false,
  existingProviders = [],
  children
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleProviderSelect = async (provider) => {
    if (loading || disabled) return;

    // Check if already connected
    if (existingProviders.includes(provider.id)) {
      onError?.(`${provider.name} is already connected`);
      setIsOpen(false);
      return;
    }

    setLoading(provider.id);

    try {
      // Get auth token for API request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please log in to connect an ELD provider');
      }

      // Request OAuth URL from our API
      const response = await fetch('/api/eld/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'initiate-oauth',
          provider: provider.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate connection');
      }

      if (data.authUrl) {
        // Redirect to OAuth provider
        onSuccess?.({ provider: provider.id, message: 'Redirecting to provider...' });
        window.location.href = data.authUrl;
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (err) {
      console.error('Failed to connect ELD:', err);
      onError?.(err.message || 'Failed to connect');
    } finally {
      setLoading(null);
      setIsOpen(false);
    }
  };

  const variantStyles = {
    primary: 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 border-transparent',
    secondary: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600',
    outline: 'bg-transparent text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-600 dark:border-blue-400'
  };

  // Filter out already connected providers for display
  const availableProviders = PROVIDERS.filter(p => !existingProviders.includes(p.id));
  const allConnected = availableProviders.length === 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && !allConnected && setIsOpen(!isOpen)}
        disabled={disabled || allConnected}
        className={`
          inline-flex items-center justify-center gap-2 px-4 py-2.5
          font-medium text-sm rounded-lg border transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${className}
        `}
      >
        <Link2 size={18} />
        {children || (
          <>
            <span>{allConnected ? 'All Providers Connected' : 'Connect ELD'}</span>
            {!allConnected && <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 sm:right-0 left-0 sm:left-auto top-full mt-2 w-auto sm:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-[50] overflow-hidden">
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Select ELD Provider</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Choose your ELD provider to connect via OAuth
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {PROVIDERS.map((provider) => {
              const isConnected = existingProviders.includes(provider.id);
              const isLoading = loading === provider.id;

              return (
                <button
                  key={provider.id}
                  onClick={() => handleProviderSelect(provider)}
                  disabled={isLoading || isConnected}
                  className={`
                    w-full p-4 text-left border-b border-gray-100 dark:border-gray-700 last:border-b-0
                    hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                    disabled:opacity-60 disabled:cursor-not-allowed
                    ${isConnected ? 'bg-green-50 dark:bg-green-900/10' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Provider Logo */}
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {isLoading ? (
                        <div className={`w-full h-full ${provider.color} flex items-center justify-center`}>
                          <Loader2 size={20} className="text-white animate-spin" />
                        </div>
                      ) : (
                        <Image
                          src={provider.logo}
                          alt={`${provider.name} logo`}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Provider Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          {provider.name}
                          {provider.subtitle && (
                            <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                              {provider.subtitle}
                            </span>
                          )}
                        </h5>
                        {isConnected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                            <Check size={12} />
                            Connected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {provider.description}
                      </p>

                      {/* Features */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {provider.features.slice(0, 3).map((feature) => (
                          <span
                            key={feature}
                            className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                          >
                            {feature}
                          </span>
                        ))}
                        {provider.features.length > 3 && (
                          <span className="px-1.5 py-0.5 text-gray-500 dark:text-gray-400 text-xs">
                            +{provider.features.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    {!isConnected && !isLoading && (
                      <ExternalLink size={16} className="text-gray-400 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              More providers coming soon. <a href="mailto:support@truckcommand.com" className="text-blue-600 dark:text-blue-400 hover:underline">Request a provider</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
