"use client";

import { Eye, Edit, Trash2, CheckCircle, MoreVertical } from "lucide-react";

/**
 * Standardized Table Action Buttons
 *
 * Consistent styling across all dashboard tables:
 * - View: Blue
 * - Edit: Amber
 * - Delete: Red
 * - Complete: Green
 *
 * @param {function} onView - Handler for view action (optional)
 * @param {function} onEdit - Handler for edit action (optional)
 * @param {function} onDelete - Handler for delete action (optional)
 * @param {function} onComplete - Handler for complete/approve action (optional)
 * @param {object} customActions - Array of custom action objects: { icon, onClick, color, label }
 * @param {string} size - 'sm' | 'md' | 'lg' - Button size (default: 'md')
 * @param {boolean} showLabels - Show text labels on mobile (default: false)
 */
export default function TableActions({
  onView,
  onEdit,
  onDelete,
  onComplete,
  customActions = [],
  size = "md",
  showLabels = false,
  disabled = false
}) {
  // Size configurations
  const sizes = {
    sm: { icon: 14, padding: "p-1.5", mobilePadding: "p-2" },
    md: { icon: 16, padding: "p-2", mobilePadding: "p-2.5" },
    lg: { icon: 18, padding: "p-2.5", mobilePadding: "p-3" }
  };

  const { icon: iconSize, padding, mobilePadding } = sizes[size];

  // Base button classes
  const baseClasses = `
    ${padding} md:${mobilePadding}
    rounded-lg
    transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
  `.trim();

  // Color configurations
  const colors = {
    view: "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30",
    edit: "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30",
    delete: "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30",
    complete: "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30",
    gray: "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/30"
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {/* View Button */}
      {onView && (
        <button
          onClick={onView}
          disabled={disabled}
          className={`${baseClasses} ${colors.view}`}
          title="View"
          aria-label="View"
        >
          <Eye size={iconSize} />
          {showLabels && <span className="sr-only md:not-sr-only md:ml-1 text-xs">View</span>}
        </button>
      )}

      {/* Complete Button */}
      {onComplete && (
        <button
          onClick={onComplete}
          disabled={disabled}
          className={`${baseClasses} ${colors.complete}`}
          title="Complete"
          aria-label="Mark as complete"
        >
          <CheckCircle size={iconSize} />
          {showLabels && <span className="sr-only md:not-sr-only md:ml-1 text-xs">Complete</span>}
        </button>
      )}

      {/* Edit Button */}
      {onEdit && (
        <button
          onClick={onEdit}
          disabled={disabled}
          className={`${baseClasses} ${colors.edit}`}
          title="Edit"
          aria-label="Edit"
        >
          <Edit size={iconSize} />
          {showLabels && <span className="sr-only md:not-sr-only md:ml-1 text-xs">Edit</span>}
        </button>
      )}

      {/* Custom Actions */}
      {customActions.map((action, index) => {
        const ActionIcon = action.icon;
        const colorClass = colors[action.color] || colors.gray;
        return (
          <button
            key={index}
            onClick={action.onClick}
            disabled={disabled || action.disabled}
            className={`${baseClasses} ${colorClass}`}
            title={action.label}
            aria-label={action.label}
          >
            <ActionIcon size={iconSize} />
            {showLabels && <span className="sr-only md:not-sr-only md:ml-1 text-xs">{action.label}</span>}
          </button>
        );
      })}

      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={onDelete}
          disabled={disabled}
          className={`${baseClasses} ${colors.delete}`}
          title="Delete"
          aria-label="Delete"
        >
          <Trash2 size={iconSize} />
          {showLabels && <span className="sr-only md:not-sr-only md:ml-1 text-xs">Delete</span>}
        </button>
      )}
    </div>
  );
}

/**
 * Individual Action Button - for use when you need just one action
 */
export function ActionButton({
  icon: Icon,
  onClick,
  color = "gray",
  label,
  size = "md",
  disabled = false
}) {
  const sizes = {
    sm: { icon: 14, padding: "p-1.5" },
    md: { icon: 16, padding: "p-2" },
    lg: { icon: 18, padding: "p-2.5" }
  };

  const colors = {
    view: "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30",
    edit: "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30",
    delete: "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30",
    complete: "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30",
    gray: "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/30",
    blue: "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30",
    amber: "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30",
    red: "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30",
    green: "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
  };

  const { icon: iconSize, padding } = sizes[size];
  const colorClass = colors[color] || colors.gray;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${padding} rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colorClass}`}
      title={label}
      aria-label={label}
    >
      <Icon size={iconSize} />
    </button>
  );
}
