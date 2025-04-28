// src/components/ui/tabs.js
"use client";

import React, { useState, createContext, useContext } from 'react';

const TabsContext = createContext();

export function Tabs({ children, defaultValue, value, onValueChange, className = "" }) {
  const [activeTab, setActiveTab] = useState(value || defaultValue);
  
  const contextValue = {
    value: activeTab,
    onValueChange: (newValue) => {
      setActiveTab(newValue);
      if (onValueChange) {
        onValueChange(newValue);
      }
    }
  };
  
  return (
    <TabsContext.Provider value={contextValue}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = "" }) {
  return (
    <div className={`inline-flex items-center justify-start p-1 border-b border-gray-200 w-full ${className}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({ children, value, className = "" }) {
  const { value: activeValue, onValueChange } = useContext(TabsContext);
  const isActive = activeValue === value;
  
  return (
    <button
      type="button"
      className={`py-3 px-5 font-medium text-sm relative focus:outline-none transition
        ${isActive 
          ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600' 
          : 'text-gray-500 hover:text-gray-700 hover:after:absolute hover:after:bottom-0 hover:after:left-0 hover:after:right-0 hover:after:h-0.5 hover:after:bg-gray-300'
        } ${className}`}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, value, className = "" }) {
  const { value: activeValue } = useContext(TabsContext);
  
  if (activeValue !== value) {
    return null;
  }
  
  return (
    <div className={`mt-4 ${className}`}>
      {children}
    </div>
  );
}