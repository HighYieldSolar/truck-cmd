"use client";

import { useState } from 'react';
import { Link2, Loader2, ExternalLink } from 'lucide-react';

/**
 * TerminalLinkButton - Triggers OAuth connection flow with Terminal API
 *
 * @param {function} onSuccess - Callback when link is generated
 * @param {function} onError - Callback on error
 * @param {string} className - Additional CSS classes
 * @param {string} variant - 'primary' | 'secondary' | 'outline'
 * @param {boolean} disabled - Whether button is disabled
 */
export default function TerminalLinkButton({
  onSuccess,
  onError,
  className = '',
  variant = 'primary',
  disabled = false,
  children
}) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (loading || disabled) return;

    setLoading(true);

    try {
      // Request a Terminal Link URL from our API
      const response = await fetch('/api/eld/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-link' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate connection link');
      }

      if (data.linkUrl) {
        // Open Terminal Link in a new window/tab
        window.open(data.linkUrl, '_blank', 'width=600,height=700');
        onSuccess?.(data);
      } else {
        throw new Error('No link URL returned');
      }
    } catch (err) {
      console.error('Failed to connect ELD:', err);
      onError?.(err.message || 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const variantStyles = {
    primary: 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 border-transparent',
    secondary: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600',
    outline: 'bg-transparent text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-600 dark:border-blue-400'
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading || disabled}
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2.5
        font-medium text-sm rounded-lg border transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <Link2 size={18} />
          {children || (
            <>
              <span>Connect ELD Provider</span>
              <ExternalLink size={14} className="ml-1 opacity-70" />
            </>
          )}
        </>
      )}
    </button>
  );
}
