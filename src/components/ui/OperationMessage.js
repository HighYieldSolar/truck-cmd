'use client';

import { useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';

/**
 * Operation Message Banner
 *
 * Displays success, error, warning, or info messages after operations.
 * Auto-dismisses after a configurable timeout for success messages.
 *
 * @param {Object} message - The message object { type: 'success'|'error'|'warning'|'info', text: string }
 * @param {Function} onDismiss - Callback when message is dismissed
 * @param {number} autoHideDelay - Auto-hide delay in ms for success messages (default: 5000, 0 to disable)
 * @param {string} className - Additional CSS classes
 *
 * @example
 * <OperationMessage
 *   message={{ type: 'success', text: 'Fuel entry saved successfully' }}
 *   onDismiss={() => setMessage(null)}
 * />
 */
export function OperationMessage({
  message,
  onDismiss,
  autoHideDelay = 5000,
  className = '',
}) {
  // Auto-dismiss success messages
  useEffect(() => {
    if (message?.type === 'success' && autoHideDelay > 0 && onDismiss) {
      const timer = setTimeout(onDismiss, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [message, autoHideDelay, onDismiss]);

  if (!message) return null;

  const configs = {
    success: {
      icon: CheckCircle,
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-800 dark:text-emerald-200',
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      dismissColor: 'text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-200',
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-500 dark:text-red-400',
      dismissColor: 'text-red-400 hover:text-red-600 dark:hover:text-red-200',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-200',
      iconColor: 'text-amber-500 dark:text-amber-400',
      dismissColor: 'text-amber-400 hover:text-amber-600 dark:hover:text-amber-200',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      iconColor: 'text-blue-500 dark:text-blue-400',
      dismissColor: 'text-blue-400 hover:text-blue-600 dark:hover:text-blue-200',
    },
  };

  const config = configs[message.type] || configs.info;
  const Icon = config.icon;

  return (
    <div
      className={`rounded-lg p-4 mb-6 border ${config.bg} ${config.border} ${className}`}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
          </div>
          <p className={`text-sm font-medium ${config.text}`}>
            {message.text}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 p-1 rounded transition-colors ${config.dismissColor}`}
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Inline Error Message
 *
 * For displaying errors below form fields or in specific locations.
 *
 * @example
 * <ErrorMessage error="Please enter a valid amount" />
 */
export function ErrorMessage({ error, className = '' }) {
  if (!error) return null;

  return (
    <p className={`text-sm text-red-500 dark:text-red-400 flex items-center gap-1 mt-1 ${className}`}>
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{error}</span>
    </p>
  );
}

/**
 * Toast-style notification (positioned fixed)
 *
 * @example
 * <Toast
 *   message={{ type: 'success', text: 'Changes saved!' }}
 *   onDismiss={() => setToast(null)}
 *   position="bottom-right"
 * />
 */
export function Toast({
  message,
  onDismiss,
  position = 'bottom-right',
  autoHideDelay = 4000,
}) {
  useEffect(() => {
    if (message && autoHideDelay > 0 && onDismiss) {
      const timer = setTimeout(onDismiss, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [message, autoHideDelay, onDismiss]);

  if (!message) return null;

  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  const configs = {
    success: {
      icon: CheckCircle,
      bg: 'bg-emerald-600',
      text: 'text-white',
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-red-600',
      text: 'text-white',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-amber-500',
      text: 'text-white',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-600',
      text: 'text-white',
    },
  };

  const config = configs[message.type] || configs.info;
  const Icon = config.icon;

  return (
    <div
      className={`fixed ${positions[position]} z-50 animate-in fade-in slide-in-from-bottom-2 duration-200`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${config.bg} ${config.text}`}
        role="alert"
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="text-sm font-medium">{message.text}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Empty State Component
 *
 * Display when no data is available.
 *
 * @example
 * <EmptyState
 *   icon={Fuel}
 *   title="No fuel purchases yet"
 *   description="Start tracking your fuel purchases to monitor expenses."
 *   action={{ label: 'Add Fuel Purchase', onClick: handleAdd }}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center ${className}`}>
      {Icon && (
        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {action.icon && <action.icon className="h-5 w-5 mr-2" />}
          {action.label}
        </button>
      )}
    </div>
  );
}

export default OperationMessage;
