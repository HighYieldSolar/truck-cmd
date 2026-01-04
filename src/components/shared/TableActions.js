"use client";

import { useState, useRef, useEffect } from "react";
import { Eye, Edit, Trash2, CheckCircle, MoreVertical, MoreHorizontal, ChevronDown } from "lucide-react";

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

/**
 * Dropdown variant of TableActions
 * Shows a single button that opens a dropdown menu with all actions
 *
 * @param {function} onView - Handler for view action (optional)
 * @param {function} onEdit - Handler for edit action (optional)
 * @param {function} onDelete - Handler for delete action (optional)
 * @param {function} onComplete - Handler for complete/approve action (optional)
 * @param {object} customActions - Array of custom action objects: { icon, onClick, color, label }
 * @param {string} size - 'sm' | 'md' | 'lg' - Button size (default: 'md')
 * @param {string} buttonStyle - 'dots' | 'text' | 'icon' - Style of trigger button (default: 'dots')
 * @param {string} buttonLabel - Label for text button style (default: 'Actions')
 * @param {boolean} disabled - Disable all actions
 */
export function TableActionsDropdown({
  onView,
  onEdit,
  onDelete,
  onComplete,
  customActions = [],
  size = "md",
  buttonStyle = "dots",
  buttonLabel = "Actions",
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  // Size configurations
  const sizes = {
    sm: { icon: 14, padding: "p-1.5", text: "text-xs" },
    md: { icon: 16, padding: "p-2", text: "text-sm" },
    lg: { icon: 18, padding: "p-2.5", text: "text-sm" }
  };

  const { icon: iconSize, padding, text: textSize } = sizes[size];

  // Action handler wrapper
  const handleAction = (action) => {
    if (action) {
      action();
    }
    setIsOpen(false);
  };

  // Build actions list
  const actions = [];

  if (onView) {
    actions.push({
      icon: Eye,
      label: "View Details",
      onClick: onView,
      color: "blue"
    });
  }

  if (onComplete) {
    actions.push({
      icon: CheckCircle,
      label: "Mark Complete",
      onClick: onComplete,
      color: "green"
    });
  }

  if (onEdit) {
    actions.push({
      icon: Edit,
      label: "Edit",
      onClick: onEdit,
      color: "amber"
    });
  }

  // Add custom actions
  customActions.forEach((action) => {
    actions.push({
      icon: action.icon,
      label: action.label,
      onClick: action.onClick,
      color: action.color || "gray",
      disabled: action.disabled
    });
  });

  if (onDelete) {
    actions.push({
      icon: Trash2,
      label: "Delete",
      onClick: onDelete,
      color: "red",
      divider: actions.length > 0
    });
  }

  // Color configurations for dropdown items
  const itemColors = {
    blue: "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30",
    amber: "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30",
    red: "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30",
    green: "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30",
    gray: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
  };

  // Render trigger button based on style
  const renderTriggerButton = () => {
    const baseClasses = `
      ${padding}
      rounded-lg
      transition-colors
      border border-gray-200 dark:border-gray-600
      bg-white dark:bg-gray-800
      hover:bg-gray-50 dark:hover:bg-gray-700
      text-gray-600 dark:text-gray-400
      disabled:opacity-50 disabled:cursor-not-allowed
      flex items-center gap-1
    `.trim();

    switch (buttonStyle) {
      case "text":
        return (
          <button
            ref={buttonRef}
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className={`${baseClasses} px-3 py-1.5 ${textSize} font-medium`}
          >
            {buttonLabel}
            <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        );

      case "icon":
        return (
          <button
            ref={buttonRef}
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className={`${baseClasses}`}
          >
            <MoreHorizontal size={iconSize} />
          </button>
        );

      case "dots":
      default:
        return (
          <button
            ref={buttonRef}
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className={`
              ${padding}
              rounded-lg
              transition-colors
              hover:bg-gray-100 dark:hover:bg-gray-700
              text-gray-500 dark:text-gray-400
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title="Actions"
            aria-label="Actions menu"
          >
            <MoreVertical size={iconSize} />
          </button>
        );
    }
  };

  if (actions.length === 0) return null;

  return (
    <div className="relative inline-block">
      {renderTriggerButton()}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-[999] animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {actions.map((action, index) => {
            const ActionIcon = action.icon;
            const colorClass = itemColors[action.color] || itemColors.gray;

            return (
              <div key={index}>
                {action.divider && (
                  <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                )}
                <button
                  onClick={() => handleAction(action.onClick)}
                  disabled={disabled || action.disabled}
                  className={`
                    w-full px-3 py-2
                    flex items-center gap-2
                    ${textSize}
                    transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${colorClass}
                  `}
                >
                  <ActionIcon size={iconSize - 2} />
                  <span>{action.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
