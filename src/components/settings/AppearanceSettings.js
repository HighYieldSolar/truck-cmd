"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useSidebar } from "@/context/SidebarContext";
import {
  RefreshCw,
  Save,
  CheckCircle,
  AlertCircle,
  Moon,
  Sun,
  Check,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  LayoutDashboard,
  Truck,
  MapPin,
  FileText,
  Wallet,
  Users,
  Package,
  CheckCircle as CheckCircleIcon,
  Calculator,
  Fuel,
  Lock,
  Menu,
  GripVertical
} from "lucide-react";

// Icon mapping for sidebar items
const SIDEBAR_ICONS = {
  dashboard: LayoutDashboard,
  dispatching: Truck,
  mileage: MapPin,
  invoices: FileText,
  expenses: Wallet,
  customers: Users,
  fleet: Package,
  compliance: CheckCircleIcon,
  ifta: Calculator,
  fuel: Fuel,
};

export default function AppearanceSettings() {
  const [saving, setSaving] = useState(false);
  const [savingSidebar, setSavingSidebar] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [localSidebarConfig, setLocalSidebarConfig] = useState([]);
  const [sidebarHasChanges, setSidebarHasChanges] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dropPosition, setDropPosition] = useState('above'); // 'above' or 'below'

  // Touch drag state
  const [touchDragIndex, setTouchDragIndex] = useState(null);
  const [touchY, setTouchY] = useState(0);
  const touchStartY = useRef(0);
  const touchStartIndex = useRef(null);
  const longPressTimer = useRef(null);
  const scrollInterval = useRef(null);
  const itemRefs = useRef([]);
  const listContainerRef = useRef(null);

  // Auto-scroll settings
  const SCROLL_ZONE = 80; // pixels from edge to trigger scroll
  const SCROLL_SPEED = 8; // pixels per frame

  const { theme, updateTheme, loading } = useTheme();
  const {
    sidebarConfig,
    updateSidebarConfig,
    resetToDefaults,
    loading: sidebarLoading
  } = useSidebar();

  // Initialize selected theme from context
  useEffect(() => {
    if (theme) {
      setSelectedTheme(theme);
    }
  }, [theme]);

  // Initialize local sidebar config from context
  useEffect(() => {
    if (sidebarConfig && sidebarConfig.length > 0) {
      setLocalSidebarConfig(sidebarConfig);
      setSidebarHasChanges(false);
    }
  }, [sidebarConfig]);

  // Check if sidebar config has changed
  const checkSidebarChanges = useCallback((newConfig) => {
    const hasChanges = JSON.stringify(newConfig) !== JSON.stringify(sidebarConfig);
    setSidebarHasChanges(hasChanges);
  }, [sidebarConfig]);

  // Toggle item visibility
  const handleToggleVisibility = (itemId) => {
    // Dashboard should always be visible
    if (itemId === 'dashboard') return;

    const newConfig = localSidebarConfig.map(item =>
      item.id === itemId ? { ...item, visible: !item.visible } : item
    );
    setLocalSidebarConfig(newConfig);
    checkSidebarChanges(newConfig);
  };

  // Move item up
  const handleMoveUp = (index) => {
    if (index <= 0) return;

    const newConfig = [...localSidebarConfig];
    [newConfig[index - 1], newConfig[index]] = [newConfig[index], newConfig[index - 1]];
    const updatedConfig = newConfig.map((item, idx) => ({ ...item, order: idx }));
    setLocalSidebarConfig(updatedConfig);
    checkSidebarChanges(updatedConfig);
  };

  // Move item down
  const handleMoveDown = (index) => {
    if (index >= localSidebarConfig.length - 1) return;

    const newConfig = [...localSidebarConfig];
    [newConfig[index], newConfig[index + 1]] = [newConfig[index + 1], newConfig[index]];
    const updatedConfig = newConfig.map((item, idx) => ({ ...item, order: idx }));
    setLocalSidebarConfig(updatedConfig);
    checkSidebarChanges(updatedConfig);
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragEnd = () => {
    stopAutoScroll();
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropPosition('above');
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Auto-scroll when near top or bottom of viewport (desktop)
    const currentY = e.clientY;
    const viewportHeight = window.innerHeight;
    if (currentY < SCROLL_ZONE) {
      startAutoScroll(-1);
    } else if (currentY > viewportHeight - SCROLL_ZONE) {
      startAutoScroll(1);
    } else {
      stopAutoScroll();
    }

    if (index !== draggedIndex) {
      const rect = e.currentTarget.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const isBelow = e.clientY > midpoint;

      setDragOverIndex(index);
      setDropPosition(isBelow ? 'below' : 'above');
    }
  };

  const handleDragLeave = (e) => {
    // Only clear if leaving the container entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
      setDropPosition('above');
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    stopAutoScroll();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setDropPosition('above');
      return;
    }

    const newConfig = [...localSidebarConfig];
    const draggedItem = newConfig[draggedIndex];

    // Calculate actual insert position based on drop position
    let insertIndex = dropIndex;
    if (dropPosition === 'below') {
      insertIndex = dropIndex + 1;
    }

    // Adjust for the removal of the dragged item
    if (draggedIndex < insertIndex) {
      insertIndex--;
    }

    // Remove dragged item
    newConfig.splice(draggedIndex, 1);
    // Insert at new position
    newConfig.splice(insertIndex, 0, draggedItem);

    // Update order values
    const updatedConfig = newConfig.map((item, idx) => ({ ...item, order: idx }));
    setLocalSidebarConfig(updatedConfig);
    checkSidebarChanges(updatedConfig);

    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropPosition('above');
  };

  // Auto-scroll function for when dragging near edges
  const startAutoScroll = useCallback((direction) => {
    if (scrollInterval.current) return;

    scrollInterval.current = setInterval(() => {
      window.scrollBy(0, direction * SCROLL_SPEED);
    }, 16); // ~60fps
  }, [SCROLL_SPEED]);

  const stopAutoScroll = useCallback(() => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  }, []);

  // Touch drag handlers for mobile
  // We need to use refs and useEffect to properly handle preventDefault on touchmove
  // because React adds touch listeners as passive by default
  const activeTouchDragRef = useRef(null);

  const handleTouchStart = useCallback((e, index) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartIndex.current = index;

    // Start drag almost immediately (100ms hold time)
    longPressTimer.current = setTimeout(() => {
      activeTouchDragRef.current = index;
      setTouchDragIndex(index);
      setTouchY(e.touches[0].clientY);
      // Vibrate on mobile if supported
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    }, 100);
  }, []);

  const handleTouchMoveForCancel = useCallback((e) => {
    // Only cancel long press if drag hasn't started yet
    if (activeTouchDragRef.current === null && longPressTimer.current) {
      const moveDistance = Math.abs(e.touches[0].clientY - touchStartY.current);
      if (moveDistance > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Stop auto-scrolling
    stopAutoScroll();

    const currentTouchDragIndex = activeTouchDragRef.current;

    if (currentTouchDragIndex !== null && dragOverIndex !== null && currentTouchDragIndex !== dragOverIndex) {
      // Perform the reorder
      const newConfig = [...localSidebarConfig];
      const draggedItem = newConfig[currentTouchDragIndex];

      // Calculate actual insert position based on drop position
      let insertIndex = dragOverIndex;
      if (dropPosition === 'below') {
        insertIndex = dragOverIndex + 1;
      }

      // Adjust for the removal of the dragged item
      if (currentTouchDragIndex < insertIndex) {
        insertIndex--;
      }

      newConfig.splice(currentTouchDragIndex, 1);
      newConfig.splice(insertIndex, 0, draggedItem);

      const updatedConfig = newConfig.map((item, idx) => ({ ...item, order: idx }));
      setLocalSidebarConfig(updatedConfig);
      checkSidebarChanges(updatedConfig);
    }

    activeTouchDragRef.current = null;
    setTouchDragIndex(null);
    setDragOverIndex(null);
    setDropPosition('above');
    touchStartIndex.current = null;
  }, [dragOverIndex, dropPosition, localSidebarConfig, checkSidebarChanges, stopAutoScroll]);

  // Use effect to add non-passive touchmove listener for drag functionality
  useEffect(() => {
    const handleDocumentTouchMove = (e) => {
      if (activeTouchDragRef.current === null) return;

      // Prevent scrolling while dragging
      e.preventDefault();

      const currentY = e.touches[0].clientY;
      setTouchY(currentY);

      // Auto-scroll when near top or bottom of viewport
      const viewportHeight = window.innerHeight;
      if (currentY < SCROLL_ZONE) {
        startAutoScroll(-1);
      } else if (currentY > viewportHeight - SCROLL_ZONE) {
        startAutoScroll(1);
      } else {
        stopAutoScroll();
      }

      // Find which item we're over
      const containerRect = listContainerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      for (let i = 0; i < itemRefs.current.length; i++) {
        const itemEl = itemRefs.current[i];
        if (!itemEl) continue;

        const rect = itemEl.getBoundingClientRect();
        const itemMiddle = rect.top + rect.height / 2;

        if (currentY >= rect.top && currentY < rect.bottom && i !== activeTouchDragRef.current) {
          setDragOverIndex(i);
          setDropPosition(currentY > itemMiddle ? 'below' : 'above');
          return;
        }
      }
    };

    const handleDocumentTouchEnd = () => {
      handleTouchEnd();
    };

    // Add listeners with { passive: false } to allow preventDefault
    document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false });
    document.addEventListener('touchend', handleDocumentTouchEnd);

    return () => {
      document.removeEventListener('touchmove', handleDocumentTouchMove);
      document.removeEventListener('touchend', handleDocumentTouchEnd);
    };
  }, [handleTouchEnd, startAutoScroll, stopAutoScroll, SCROLL_ZONE]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
      }
    };
  }, []);

  // Save sidebar settings
  const saveSidebarSettings = async () => {
    try {
      setSavingSidebar(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      await updateSidebarConfig(localSidebarConfig);
      setSidebarHasChanges(false);
      setSuccessMessage('Sidebar preferences saved successfully!');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      setErrorMessage(`Failed to save sidebar settings: ${error.message}`);
    } finally {
      setSavingSidebar(false);
    }
  };

  // Reset sidebar to defaults
  const handleResetSidebar = async () => {
    try {
      setSavingSidebar(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      await resetToDefaults();
      setSidebarHasChanges(false);
      setSuccessMessage('Sidebar reset to default settings!');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      setErrorMessage(`Failed to reset sidebar: ${error.message}`);
    } finally {
      setSavingSidebar(false);
    }
  };

  // Save appearance settings
  const saveAppearance = async (e) => {
    e.preventDefault();

    if (!selectedTheme || selectedTheme === theme) {
      return; // No changes to save
    }

    try {
      setSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      // Update theme using context
      await updateTheme(selectedTheme);

      // Show success message
      setSuccessMessage('Theme preference saved successfully!');

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

    } catch (error) {
      setErrorMessage(`Failed to update appearance settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Theme option components for cleaner rendering
  const ThemeOption = ({ value, label, icon }) => (
    <div
      className={`relative flex flex-col items-center cursor-pointer border rounded-lg p-6 transition-all ${
        selectedTheme === value
          ? 'border-blue-500 bg-blue-50 shadow-md dark:bg-gray-800 dark:border-blue-400'
          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
      }`}
      onClick={() => setSelectedTheme(value)}
    >
      <div className={`p-4 rounded-full mb-3 ${
        selectedTheme === value 
          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
      }`}>
        {icon}
      </div>
      <div className="font-medium text-gray-900 dark:text-white text-lg">{label}</div>
      {selectedTheme === value && (
        <div className="absolute top-3 right-3 text-blue-600 dark:text-blue-400">
          <Check size={20} />
        </div>
      )}
    </div>
  );

  if (loading || sidebarLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
        <span className="ml-2 text-gray-700 dark:text-gray-300">Loading appearance settings...</span>
      </div>
    );
  }

  return (
    <div className="dark:text-white">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-4 rounded-md">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
            <span className="text-green-800 dark:text-green-300">{successMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
            <span className="text-red-800 dark:text-red-300">{errorMessage}</span>
          </div>
        </div>
      )}

      <form onSubmit={saveAppearance}>
        {/* Theme Settings */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-lg shadow-sm p-4 mb-6">
            <h3 className="text-lg font-medium text-white">Theme Preference</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Choose between light and dark theme for your dashboard</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
            <ThemeOption
              value="light"
              label="Light Mode"
              icon={<Sun size={32} />}
            />

            <ThemeOption
              value="dark"
              label="Dark Mode"
              icon={<Moon size={32} />}
            />
          </div>
        </div>


        {/* Save Theme Button */}
        <div className="flex justify-end mb-10">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <RefreshCw size={18} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Save Theme Preference
              </>
            )}
          </button>
        </div>
      </form>

      {/* Sidebar Customization Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center">
            <Menu size={20} className="text-white mr-2" />
            <h3 className="text-lg font-medium text-white">Sidebar Navigation</h3>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Customize which items appear in your sidebar and their display order.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
          Drag items to reorder, use arrow buttons, or toggle visibility. On mobile, tap and hold the grip handle.
        </p>

        {/* Sidebar Items List */}
        <div
          ref={listContainerRef}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden max-w-2xl shadow-sm"
        >
          {/* Header Row */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <div className="col-span-1"></div>
            <div className="col-span-5">Menu Item</div>
            <div className="col-span-3 text-center">Reorder</div>
            <div className="col-span-3 text-center">Visible</div>
          </div>

          {localSidebarConfig.map((item, index) => {
            const IconComponent = SIDEBAR_ICONS[item.id];
            const isDashboard = item.id === 'dashboard';
            const isDragging = draggedIndex === index || touchDragIndex === index;
            const isDragOver = dragOverIndex === index && (draggedIndex !== null || touchDragIndex !== null);
            const showDropIndicator = isDragOver && draggedIndex !== index && touchDragIndex !== index;
            const showDropAbove = showDropIndicator && dropPosition === 'above';
            const showDropBelow = showDropIndicator && dropPosition === 'below';
            const isTouchDragging = touchDragIndex === index;

            // Drop indicator component
            const DropIndicator = () => (
              <div className="absolute left-0 right-0 z-10 flex items-center pointer-events-none">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_3px_rgba(59,130,246,0.7)] animate-pulse" />
                <div className="flex-1 h-[3px] bg-blue-500 shadow-[0_0_10px_3px_rgba(59,130,246,0.6)]" />
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_3px_rgba(59,130,246,0.7)] animate-pulse" />
              </div>
            );

            return (
              <div
                key={item.id}
                className="relative"
                ref={(el) => itemRefs.current[index] = el}
              >
                {/* Glowing Drop Indicator Line - Above */}
                {showDropAbove && (
                  <div className="absolute -top-[2px] left-0 right-0 z-10">
                    <DropIndicator />
                  </div>
                )}

                {/* Glowing Drop Indicator Line - Below */}
                {showDropBelow && (
                  <div className="absolute -bottom-[2px] left-0 right-0 z-10">
                    <DropIndicator />
                  </div>
                )}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`group grid grid-cols-12 gap-2 items-center px-4 py-3.5 transition-all duration-150 ${
                    index !== localSidebarConfig.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''
                  } ${isDragging
                    ? 'scale-[1.02] bg-blue-100 dark:bg-blue-900/40 shadow-lg shadow-blue-500/30 ring-2 ring-blue-500 ring-opacity-50 z-20 rounded-lg'
                    : ''
                  } ${isTouchDragging ? 'opacity-90' : ''} ${
                    !item.visible && !isDragging ? 'bg-gray-50/50 dark:bg-gray-900/30' : ''
                  } ${
                    item.visible && !isDragging ? 'hover:bg-blue-50/50 dark:hover:bg-gray-700/30' : ''
                  }`}
                >
                  {/* Drag Handle */}
                  <div
                    className="col-span-1 flex justify-center touch-none"
                    onTouchStart={(e) => handleTouchStart(e, index)}
                    onTouchMove={handleTouchMoveForCancel}
                  >
                    <div className={`p-2 rounded cursor-grab active:cursor-grabbing transition-all select-none ${
                      isDragging
                        ? 'text-blue-600 dark:text-blue-400 scale-110 bg-blue-100 dark:bg-blue-900/50'
                        : item.visible
                          ? 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          : 'text-gray-300 dark:text-gray-600'
                    }`}>
                      <GripVertical size={20} />
                    </div>
                  </div>

                {/* Item Icon and Name */}
                <div className="col-span-5 flex items-center space-x-3 min-w-0">
                  <div className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                    item.visible
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                  }`}>
                    {IconComponent && <IconComponent size={18} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`font-medium block truncate ${
                      item.visible
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {item.name}
                    </span>
                    {isDashboard && (
                      <span className="inline-flex items-center text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
                        <Lock size={10} className="mr-1" />
                        Always visible
                      </span>
                    )}
                  </div>
                </div>

                {/* Reorder Buttons */}
                <div className="col-span-3 flex items-center justify-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className={`p-2 rounded-lg border transition-all duration-150 ${
                      index === 0
                        ? 'border-gray-100 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 active:scale-95'
                    }`}
                    title="Move up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === localSidebarConfig.length - 1}
                    className={`p-2 rounded-lg border transition-all duration-150 ${
                      index === localSidebarConfig.length - 1
                        ? 'border-gray-100 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 active:scale-95'
                    }`}
                    title="Move down"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>

                {/* Visibility Toggle Switch */}
                <div className="col-span-3 flex justify-center">
                  {isDashboard ? (
                    <div className="relative w-12 h-7 bg-green-500 rounded-full opacity-60 cursor-not-allowed" title="Dashboard is always visible">
                      <span className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-md" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(item.id)}
                      className={`relative w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${
                        item.visible
                          ? 'bg-green-500 dark:bg-green-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      role="switch"
                      aria-checked={item.visible}
                      title={item.visible ? 'Click to hide from sidebar' : 'Click to show in sidebar'}
                    >
                      <span
                        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ease-in-out ${
                          item.visible ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  )}
                </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg max-w-2xl">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> Hidden items are still accessible via direct URL. Changes take effect immediately after saving.
          </p>
        </div>

        {/* Unsaved Changes Warning */}
        {sidebarHasChanges && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg max-w-2xl flex items-center">
            <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 mr-2 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              You have unsaved changes. Don&apos;t forget to save!
            </p>
          </div>
        )}

        {/* Sidebar Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6 max-w-2xl">
          <button
            type="button"
            onClick={handleResetSidebar}
            disabled={savingSidebar}
            className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw size={16} className="mr-2" />
            Reset to Default
          </button>

          <button
            type="button"
            onClick={saveSidebarSettings}
            disabled={savingSidebar || !sidebarHasChanges}
            className={`inline-flex items-center justify-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 ${
              sidebarHasChanges
                ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 active:scale-[0.98]'
                : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
            }`}
          >
            {savingSidebar ? (
              <>
                <RefreshCw size={18} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Save Sidebar Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}