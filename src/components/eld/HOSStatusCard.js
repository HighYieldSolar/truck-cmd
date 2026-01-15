"use client";

import {
  Clock,
  AlertTriangle,
  Pause,
  Coffee,
  Truck,
  User,
  MapPin,
  Timer
} from 'lucide-react';

// HOS Status configuration
const HOS_STATUS_CONFIG = {
  DRIVING: {
    label: 'Driving',
    icon: Truck,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
    badgeColor: 'bg-green-500',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  ON_DUTY: {
    label: 'On Duty',
    icon: Clock,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    badgeColor: 'bg-blue-500',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  OFF_DUTY: {
    label: 'Off Duty',
    icon: Coffee,
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    textColor: 'text-gray-600 dark:text-gray-400',
    badgeColor: 'bg-gray-500',
    borderColor: 'border-gray-200 dark:border-gray-700'
  },
  SLEEPER: {
    label: 'Sleeper Berth',
    icon: Pause,
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    badgeColor: 'bg-purple-500',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  YARD_MOVES: {
    label: 'Yard Moves',
    icon: Truck,
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    badgeColor: 'bg-amber-500',
    borderColor: 'border-amber-200 dark:border-amber-800'
  },
  PERSONAL_CONVEYANCE: {
    label: 'Personal Use',
    icon: User,
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    textColor: 'text-cyan-600 dark:text-cyan-400',
    badgeColor: 'bg-cyan-500',
    borderColor: 'border-cyan-200 dark:border-cyan-800'
  }
};

/**
 * Format minutes to hours/minutes display
 */
function formatTime(minutes) {
  if (minutes === null || minutes === undefined) return '--:--';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

/**
 * Get time progress percentage
 */
function getTimeProgress(remaining, max) {
  if (!remaining || !max) return 0;
  return Math.max(0, Math.min(100, ((max - remaining) / max) * 100));
}

/**
 * Get time warning class based on remaining time
 */
function getTimeWarningClass(remaining, max) {
  if (!remaining) return 'text-gray-500';
  const percentage = (remaining / max) * 100;
  if (percentage <= 10) return 'text-red-600 dark:text-red-400 font-bold';
  if (percentage <= 25) return 'text-amber-600 dark:text-amber-400';
  return 'text-green-600 dark:text-green-400';
}

/**
 * HOSStatusCard - Individual driver HOS status card
 *
 * @param {object} driver - Driver HOS data
 * @param {function} onClick - Callback when card is clicked
 * @param {boolean} compact - Use compact display mode
 * @param {string} className - Additional CSS classes
 */
export default function HOSStatusCard({
  driver,
  onClick,
  compact = false,
  className = ''
}) {
  if (!driver) return null;

  const statusConfig = HOS_STATUS_CONFIG[driver.status] || HOS_STATUS_CONFIG.OFF_DUTY;
  const StatusIcon = statusConfig.icon;

  // Max times in minutes (11 hours drive, 14 hours shift, 70 hours cycle)
  const MAX_DRIVE = 660;
  const MAX_SHIFT = 840;
  const MAX_CYCLE = 4200;

  if (compact) {
    // Compact card for grid/list views
    return (
      <div
        onClick={() => onClick?.(driver)}
        className={`
          bg-white dark:bg-gray-800 rounded-lg border ${statusConfig.borderColor}
          p-3 cursor-pointer hover:shadow-md transition-all
          ${className}
        `}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusConfig.badgeColor}`} />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
              {driver.name}
            </span>
          </div>
          {driver.hasViolation && (
            <AlertTriangle size={14} className="text-red-500" />
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className={statusConfig.textColor}>{statusConfig.label}</span>
          <span className={getTimeWarningClass(driver.driveTimeRemaining, MAX_DRIVE)}>
            {formatTime(driver.driveTimeRemaining)} drive
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              getTimeProgress(MAX_DRIVE - driver.driveTimeRemaining, MAX_DRIVE) > 90
                ? 'bg-red-500'
                : getTimeProgress(MAX_DRIVE - driver.driveTimeRemaining, MAX_DRIVE) > 75
                  ? 'bg-amber-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${getTimeProgress(MAX_DRIVE - driver.driveTimeRemaining, MAX_DRIVE)}%` }}
          />
        </div>
      </div>
    );
  }

  // Full card with detailed information
  return (
    <div
      onClick={() => onClick?.(driver)}
      className={`
        bg-white dark:bg-gray-800 rounded-xl border ${statusConfig.borderColor}
        overflow-hidden cursor-pointer hover:shadow-lg transition-all
        ${className}
      `}
    >
      {/* Header */}
      <div className={`${statusConfig.bgColor} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white/50 dark:bg-black/20`}>
            <StatusIcon size={20} className={statusConfig.textColor} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              {driver.name}
            </h4>
            <p className={`text-sm ${statusConfig.textColor}`}>
              {statusConfig.label}
            </p>
          </div>
        </div>

        {driver.hasViolation && (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
            <AlertTriangle size={12} />
            Violation
          </span>
        )}
      </div>

      {/* Time Remaining */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Drive Time */}
          <div className="text-center">
            <div className="relative h-16 w-16 mx-auto mb-2">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  strokeWidth="6"
                  fill="none"
                  className="stroke-gray-200 dark:stroke-gray-700"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${((driver.driveTimeRemaining || 0) / MAX_DRIVE) * 175.9} 175.9`}
                  className={
                    (driver.driveTimeRemaining / MAX_DRIVE) <= 0.1
                      ? 'stroke-red-500'
                      : (driver.driveTimeRemaining / MAX_DRIVE) <= 0.25
                        ? 'stroke-amber-500'
                        : 'stroke-green-500'
                  }
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Truck size={16} className="text-gray-400" />
              </div>
            </div>
            <p className={`text-sm font-semibold ${getTimeWarningClass(driver.driveTimeRemaining, MAX_DRIVE)}`}>
              {formatTime(driver.driveTimeRemaining)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Drive</p>
          </div>

          {/* Shift Time */}
          <div className="text-center">
            <div className="relative h-16 w-16 mx-auto mb-2">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  strokeWidth="6"
                  fill="none"
                  className="stroke-gray-200 dark:stroke-gray-700"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${((driver.shiftTimeRemaining || 0) / MAX_SHIFT) * 175.9} 175.9`}
                  className={
                    (driver.shiftTimeRemaining / MAX_SHIFT) <= 0.1
                      ? 'stroke-red-500'
                      : (driver.shiftTimeRemaining / MAX_SHIFT) <= 0.25
                        ? 'stroke-amber-500'
                        : 'stroke-blue-500'
                  }
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Clock size={16} className="text-gray-400" />
              </div>
            </div>
            <p className={`text-sm font-semibold ${getTimeWarningClass(driver.shiftTimeRemaining, MAX_SHIFT)}`}>
              {formatTime(driver.shiftTimeRemaining)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Shift</p>
          </div>

          {/* Cycle Time */}
          <div className="text-center">
            <div className="relative h-16 w-16 mx-auto mb-2">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  strokeWidth="6"
                  fill="none"
                  className="stroke-gray-200 dark:stroke-gray-700"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${((driver.cycleTimeRemaining || 0) / MAX_CYCLE) * 175.9} 175.9`}
                  className={
                    (driver.cycleTimeRemaining / MAX_CYCLE) <= 0.1
                      ? 'stroke-red-500'
                      : (driver.cycleTimeRemaining / MAX_CYCLE) <= 0.25
                        ? 'stroke-amber-500'
                        : 'stroke-purple-500'
                  }
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Timer size={16} className="text-gray-400" />
              </div>
            </div>
            <p className={`text-sm font-semibold ${getTimeWarningClass(driver.cycleTimeRemaining, MAX_CYCLE)}`}>
              {formatTime(driver.cycleTimeRemaining)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Cycle</p>
          </div>
        </div>

        {/* Location (if available) */}
        {driver.location && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
            <MapPin size={14} />
            <span className="truncate">{driver.location}</span>
          </div>
        )}
      </div>
    </div>
  );
}
