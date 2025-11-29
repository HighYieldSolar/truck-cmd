# Fuel Tracker Page Design Specification

**Purpose**: This document serves as the definitive reference for the Fuel Tracker page's UI/UX patterns, component architecture, and backend implementation. All other dashboard pages should follow these exact patterns to maintain consistency across the Truck Command application.

---

## Table of Contents

1. [Page Architecture Overview](#1-page-architecture-overview)
2. [Layout Structure](#2-layout-structure)
3. [Color System & Dark/Light Mode](#3-color-system--darklight-mode)
4. [Component Catalog](#4-component-catalog)
5. [Form Patterns](#5-form-patterns)
6. [Modal Patterns](#6-modal-patterns)
7. [Table & Data Display](#7-table--data-display)
8. [Error Handling Standards](#8-error-handling-standards)
9. [Loading States](#9-loading-states)
10. [Backend Service Patterns](#10-backend-service-patterns)
11. [File Structure Reference](#11-file-structure-reference)

---

## 1. Page Architecture Overview

### File Organization

```
src/
├── app/(dashboard)/dashboard/fuel/
│   └── page.js              # Server wrapper with dynamic import
├── components/
│   ├── FuelTrackerPage.js   # Main page component (client-side)
│   └── fuel/                # Feature-specific components
│       ├── FuelEntryForm.js       # Add/Edit modal form
│       ├── ReceiptViewerModal.js  # Receipt image viewer
│       ├── FuelDeletionModal.js   # Delete confirmation
│       ├── FuelEntryItem.js       # Desktop table row
│       ├── FuelEntryCard.js       # Mobile card view
│       ├── FuelFilterBar.js       # Search & filters
│       ├── FuelStats.js           # Statistics cards
│       ├── StateSummary.js        # IFTA state breakdown
│       ├── TopFuelEntries.js      # Sidebar widget
│       ├── FuelChart.js           # Data visualization
│       ├── FuelCategories.js      # State category selector
│       └── VehicleSelector.js     # Smart vehicle dropdown
├── hooks/
│   └── useFuel.js           # Custom data hook
└── lib/services/
    └── fuelService.js       # Backend service layer
```

### Component Hierarchy

```
FuelTrackerPage (main container)
├── Header Section
│   ├── Page Title + Description
│   ├── Primary Action Button ("Add Fuel Purchase")
│   └── Secondary Action Button ("IFTA Calculator")
├── Operation Message Banner (success/error feedback)
├── Statistics Row (FuelStats - 4 cards)
└── Main Content Grid (4-column on desktop)
    ├── Left Sidebar (1 column)
    │   ├── TopFuelEntries
    │   └── FuelCategories
    └── Main Area (3 columns)
        ├── FuelFilterBar
        ├── Data Display
        │   ├── Mobile: Scrollable card grid
        │   └── Desktop: Scrollable table
        ├── StateSummary
        └── FuelChart
```

---

## 2. Layout Structure

### Page Container

```jsx
<div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Page content */}
  </div>
</div>
```

### Header Section Pattern

```jsx
{/* Header with gradient background */}
<div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-lg p-6 mb-6">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    {/* Left: Title & Description */}
    <div>
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <IconComponent className="h-6 w-6" />
        Page Title
      </h1>
      <p className="text-blue-100 mt-1">
        Brief description of page purpose
      </p>
    </div>

    {/* Right: Action Buttons */}
    <div className="flex flex-wrap gap-3">
      {/* Primary Action */}
      <button className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-sm">
        <Plus className="h-5 w-5 mr-2" />
        Primary Action
      </button>

      {/* Secondary Action (optional) */}
      <button className="inline-flex items-center px-4 py-2 bg-blue-500/20 text-white border border-white/30 rounded-lg font-medium hover:bg-blue-500/30 transition-colors">
        <Calculator className="h-5 w-5 mr-2" />
        Secondary Action
      </button>
    </div>
  </div>
</div>
```

### Main Content Grid

```jsx
{/* 4-column responsive grid */}
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
  {/* Sidebar - 1 column */}
  <div className="space-y-6">
    <SidebarWidget1 />
    <SidebarWidget2 />
  </div>

  {/* Main content - 3 columns */}
  <div className="lg:col-span-3 space-y-6">
    <FilterBar />
    <DataTable />
    <AdditionalContent />
  </div>
</div>
```

### Responsive Breakpoints

| Breakpoint | Width | Layout Behavior |
|------------|-------|-----------------|
| Mobile | < 640px | Single column, card display, stacked buttons |
| Tablet (sm) | ≥ 640px | Single column, horizontal button groups |
| Desktop (lg) | ≥ 1024px | 4-column grid, table display |
| Wide (xl) | ≥ 1280px | More spacious padding, wider columns |

---

## 3. Color System & Dark/Light Mode

### Core Color Palette

```jsx
// Primary colors (Blue)
"bg-blue-600"           // Primary buttons, headers
"bg-blue-500"           // Secondary actions
"text-blue-600"         // Links, interactive text
"border-blue-500"       // Focus states
"bg-blue-50"            // Light backgrounds (light mode)
"bg-blue-900/20"        // Light backgrounds (dark mode)

// Success colors (Emerald/Green)
"bg-emerald-500"        // Success badges
"text-emerald-600"      // Success text
"bg-emerald-50"         // Success backgrounds

// Warning colors (Amber/Yellow)
"bg-amber-500"          // Warning badges
"text-amber-600"        // Warning text
"bg-amber-50"           // Warning backgrounds

// Danger colors (Red)
"bg-red-500"            // Delete buttons
"text-red-600"          // Error text
"bg-red-50"             // Error backgrounds

// Neutral colors (Gray)
"bg-gray-50"            // Page background (light)
"bg-gray-900"           // Page background (dark)
"bg-white"              // Card background (light)
"bg-gray-800"           // Card background (dark)
"text-gray-900"         // Primary text (light)
"text-gray-100"         // Primary text (dark)
"text-gray-600"         // Secondary text (light)
"text-gray-400"         // Secondary text (dark)
"border-gray-200"       // Borders (light)
"border-gray-700"       // Borders (dark)
```

### Dark/Light Mode Classes

**CRITICAL**: Every color class must have a dark mode variant. Use this pattern:

```jsx
// Background colors
className="bg-white dark:bg-gray-800"
className="bg-gray-50 dark:bg-gray-900"
className="bg-gray-100 dark:bg-gray-700"

// Text colors
className="text-gray-900 dark:text-gray-100"
className="text-gray-600 dark:text-gray-400"
className="text-gray-500 dark:text-gray-500"

// Border colors
className="border-gray-200 dark:border-gray-700"
className="border-gray-300 dark:border-gray-600"

// Hover states
className="hover:bg-gray-100 dark:hover:bg-gray-700"
className="hover:bg-gray-50 dark:hover:bg-gray-700/50"

// Focus states
className="focus:ring-blue-500 dark:focus:ring-blue-400"
className="focus:border-blue-500 dark:focus:border-blue-400"
```

### Standard Component Styling

```jsx
// Card Container
"bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200"

// Card with hover
"bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"

// Input Fields
"w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"

// Select Dropdowns
"w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"

// Primary Button
"inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

// Secondary Button
"inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"

// Danger Button
"inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-colors"

// Icon Button (small)
"p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
```

---

## 4. Component Catalog

### Statistics Cards (FuelStats Pattern)

```jsx
{/* Stats Grid - 4 cards in a row */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <StatCard
    icon={Fuel}
    iconBgClass="bg-blue-100 dark:bg-blue-900/30"
    iconColorClass="text-blue-600 dark:text-blue-400"
    label="Total Gallons"
    value={stats.totalGallons.toLocaleString(undefined, { maximumFractionDigits: 1 })}
    suffix="gal"
  />
  {/* ... more stat cards */}
</div>

{/* Individual Stat Card Structure */}
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
  <div className="flex items-center gap-3">
    {/* Icon Container */}
    <div className={`p-2 rounded-lg ${iconBgClass}`}>
      <Icon className={`h-5 w-5 ${iconColorClass}`} />
    </div>

    {/* Text Content */}
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
        {value}
        {suffix && <span className="text-sm font-normal ml-1">{suffix}</span>}
      </p>
    </div>
  </div>
</div>
```

### Filter Bar Pattern

```jsx
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
  <div className="flex flex-col lg:flex-row gap-4">
    {/* Search Input */}
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type="text"
        placeholder="Search by location or vehicle..."
        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
      />
    </div>

    {/* Filter Dropdowns Row */}
    <div className="flex flex-wrap gap-3">
      {/* State Filter */}
      <select
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 min-w-[140px]"
        value={filters.state}
        onChange={(e) => setFilters({ ...filters, state: e.target.value })}
      >
        <option value="">All States</option>
        {states.map(state => (
          <option key={state.code} value={state.code}>{state.name}</option>
        ))}
      </select>

      {/* Date Range Filter */}
      <select
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        value={filters.dateRange}
        onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
      >
        <option value="This Quarter">This Quarter</option>
        <option value="Last Quarter">Last Quarter</option>
        <option value="This Year">This Year</option>
        <option value="Custom">Custom Range</option>
      </select>

      {/* Clear Filters Button */}
      <button
        onClick={clearFilters}
        className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  </div>
</div>
```

### Sidebar Widget Pattern

```jsx
{/* Sidebar Card with List */}
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
  {/* Header */}
  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
      <TrendingUp className="h-4 w-4 text-blue-500" />
      Top Fuel Purchases
    </h3>
  </div>

  {/* Content List */}
  <div className="divide-y divide-gray-200 dark:divide-gray-700">
    {items.map((item, index) => (
      <div key={index} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              {item.location}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(item.date)}
            </p>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            ${item.total_amount.toFixed(2)}
          </span>
        </div>
      </div>
    ))}
  </div>
</div>
```

### Status Badge Pattern

```jsx
{/* Success/Synced Badge */}
<span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
  <CheckCircle className="h-3.5 w-3.5 mr-1" />
  Synced
</span>

{/* Warning/Pending Badge */}
<span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
  <Clock className="h-3.5 w-3.5 mr-1" />
  Pending
</span>

{/* Error Badge */}
<span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
  <AlertCircle className="h-3.5 w-3.5 mr-1" />
  Error
</span>

{/* Info Badge */}
<span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
  <Info className="h-3.5 w-3.5 mr-1" />
  New
</span>
```

---

## 5. Form Patterns

### Form Container (Modal)

```jsx
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
  {/* Header */}
  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
      {isEditing ? 'Edit Fuel Purchase' : 'Add Fuel Purchase'}
    </h2>
    <button
      onClick={onClose}
      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
    >
      <X className="h-5 w-5" />
    </button>
  </div>

  {/* Scrollable Form Body */}
  <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  </div>

  {/* Footer Actions */}
  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
    <button
      type="button"
      onClick={onClose}
      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={isSubmitting}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {isSubmitting ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Check className="h-4 w-4" />
          {isEditing ? 'Update' : 'Save'}
        </>
      )}
    </button>
  </div>
</div>
```

### Form Field Patterns

```jsx
{/* Text Input with Label */}
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    Location <span className="text-red-500">*</span>
  </label>
  <input
    type="text"
    name="location"
    value={formData.location}
    onChange={handleChange}
    onBlur={handleBlur}
    placeholder="e.g., Flying J Truck Stop"
    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
      errors.location
        ? 'border-red-500 dark:border-red-400'
        : 'border-gray-300 dark:border-gray-600'
    }`}
  />
  {errors.location && (
    <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
      <AlertCircle className="h-4 w-4" />
      {errors.location}
    </p>
  )}
</div>

{/* Select Dropdown */}
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    State <span className="text-red-500">*</span>
  </label>
  <select
    name="state"
    value={formData.state}
    onChange={handleChange}
    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  >
    <option value="">Select a state</option>
    {states.map(state => (
      <option key={state.code} value={state.code}>{state.name}</option>
    ))}
  </select>
</div>

{/* Number Input with Suffix */}
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    Gallons <span className="text-red-500">*</span>
  </label>
  <div className="relative">
    <input
      type="number"
      name="gallons"
      value={formData.gallons}
      onChange={handleChange}
      step="0.001"
      min="0"
      placeholder="0.000"
      className="w-full px-3 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">
      gal
    </span>
  </div>
</div>

{/* Currency Input with Prefix */}
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    Total Amount
  </label>
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
      $
    </span>
    <input
      type="number"
      name="total_amount"
      value={formData.total_amount}
      onChange={handleChange}
      step="0.01"
      min="0"
      placeholder="0.00"
      className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
</div>

{/* Textarea */}
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    Notes
  </label>
  <textarea
    name="notes"
    value={formData.notes}
    onChange={handleChange}
    rows={3}
    placeholder="Optional notes..."
    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
  />
</div>

{/* File Upload with Preview */}
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    Receipt Image
  </label>
  <div
    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
      isDragging
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
    }`}
    onDragOver={handleDragOver}
    onDrop={handleDrop}
  >
    {previewUrl ? (
      <div className="relative inline-block">
        <img src={previewUrl} alt="Preview" className="max-h-40 rounded-lg" />
        <button
          type="button"
          onClick={removeImage}
          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    ) : (
      <>
        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Drag and drop or{' '}
          <label className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
            browse
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          PNG, JPG up to 10MB
        </p>
      </>
    )}
  </div>
</div>
```

### Form Layout Grid

```jsx
{/* Two-column grid for form fields */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div>{/* Field 1 */}</div>
  <div>{/* Field 2 */}</div>
</div>

{/* Three-column grid */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  <div>{/* Field 1 */}</div>
  <div>{/* Field 2 */}</div>
  <div>{/* Field 3 */}</div>
</div>

{/* Full-width field */}
<div className="col-span-full">
  {/* Textarea or wide field */}
</div>
```

### Form Validation Rules

| Field | Validation | Error Message |
|-------|------------|---------------|
| Required text | `!value.trim()` | "This field is required" |
| Number > 0 | `!value \|\| parseFloat(value) <= 0` | "Please enter a value greater than 0" |
| Valid date | `!value \|\| !isValidDate(value)` | "Please select a valid date" |
| Email | `!emailRegex.test(value)` | "Please enter a valid email address" |
| Phone | `!phoneRegex.test(value)` | "Please enter a valid phone number" |
| Currency | `parseFloat(value) < 0` | "Amount cannot be negative" |

---

## 6. Modal Patterns

### Modal Overlay Structure

```jsx
{/* Modal Container */}
{isOpen && (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    {/* Backdrop */}
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    />

    {/* Modal Positioning */}
    <div className="flex min-h-full items-center justify-center p-4">
      {/* Modal Content */}
      <div
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal body */}
      </div>
    </div>
  </div>
)}
```

### Confirmation Modal (Delete Pattern)

```jsx
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
  {/* Icon Header */}
  <div className="pt-6 px-6 text-center">
    <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
      <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
      Delete Fuel Entry?
    </h3>
  </div>

  {/* Content */}
  <div className="px-6 py-4">
    <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
      This action cannot be undone. The following entry will be permanently deleted:
    </p>

    {/* Entry Details Card */}
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">Date:</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">{entry.date}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">Amount:</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">${entry.total_amount}</span>
      </div>
    </div>

    {/* Optional Checkbox (for linked items) */}
    {entry.linkedExpense && (
      <label className="flex items-start gap-3 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg cursor-pointer">
        <input
          type="checkbox"
          checked={deleteLinked}
          onChange={(e) => setDeleteLinked(e.target.checked)}
          className="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Also delete linked expense record
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            This fuel entry has a linked expense that will also be removed.
          </p>
        </div>
      </label>
    )}
  </div>

  {/* Actions */}
  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex gap-3 justify-end">
    <button
      onClick={onClose}
      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      Cancel
    </button>
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
    >
      {isDeleting ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Deleting...
        </>
      ) : (
        <>
          <Trash2 className="h-4 w-4" />
          Delete
        </>
      )}
    </button>
  </div>
</div>
```

### Viewer Modal (Receipt/Document Pattern)

```jsx
<div className={`bg-white dark:bg-gray-800 shadow-xl ${isFullscreen ? 'fixed inset-0 rounded-none' : 'rounded-xl max-w-4xl w-full mx-4 max-h-[90vh]'}`}>
  {/* Header with Actions */}
  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
      Receipt Details
    </h3>
    <div className="flex items-center gap-2">
      {/* Action buttons */}
      <button
        onClick={handleDownload}
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Download"
      >
        <Download className="h-5 w-5" />
      </button>
      <button
        onClick={handlePrint}
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Print"
      >
        <Printer className="h-5 w-5" />
      </button>
      <button
        onClick={toggleFullscreen}
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
      </button>
      <button
        onClick={onClose}
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  </div>

  {/* Image Display */}
  <div className="flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900" style={{ height: isFullscreen ? 'calc(100vh - 180px)' : '60vh' }}>
    <img
      src={imageUrl}
      alt="Receipt"
      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
    />
  </div>

  {/* Metadata Cards */}
  <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <MetadataCard label="Date" value={formatDate(entry.date)} />
      <MetadataCard label="Location" value={entry.location} />
      <MetadataCard label="Amount" value={`$${entry.total_amount.toFixed(2)}`} />
      <MetadataCard label="Gallons" value={`${entry.gallons.toFixed(3)} gal`} />
    </div>
  </div>
</div>
```

---

## 7. Table & Data Display

### Desktop Table Structure (with Pagination)

```jsx
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
  {/* Table Header (Sticky) */}
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
            Location
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
            Date
          </th>
          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
            Gallons
          </th>
          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
            Amount
          </th>
          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
            Status
          </th>
          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>

      {/* Scrollable Body - LIMITED TO 10 ROWS */}
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {paginatedData.map((entry) => (
          <tr
            key={entry.id}
            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <td className="px-4 py-3">
              <div className="font-medium text-gray-900 dark:text-gray-100">{entry.location}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{entry.state}</div>
            </td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
              {formatDate(entry.date)}
            </td>
            <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 font-medium">
              {entry.gallons.toFixed(3)}
            </td>
            <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 font-semibold">
              ${entry.total_amount.toFixed(2)}
            </td>
            <td className="px-4 py-3 text-center">
              <StatusBadge status={entry.status} />
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onEdit(entry)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(entry)}
                  className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Table Footer with Pagination */}
  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
    {/* Summary */}
    <p className="text-sm text-gray-600 dark:text-gray-400">
      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
      <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of{' '}
      <span className="font-medium">{totalItems}</span> entries
    </p>

    {/* Pagination Controls */}
    <div className="flex items-center gap-2">
      <button
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Page Numbers */}
      {pageNumbers.map((pageNum) => (
        <button
          key={pageNum}
          onClick={() => setPage(pageNum)}
          className={`px-3 py-1 rounded-lg transition-colors ${
            pageNum === page
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
        >
          {pageNum}
        </button>
      ))}

      <button
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages}
        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  </div>
</div>
```

### Pagination Hook

```jsx
// usePagination.js
export function usePagination(data, itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedData = data.slice(startIndex, endIndex);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    paginatedData,
    pageNumbers: getPageNumbers(),
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}
```

### Mobile Card Grid (with Pagination)

```jsx
<div className="lg:hidden space-y-4">
  {/* Cards Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {paginatedData.map((entry) => (
      <div
        key={entry.id}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Card Header */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {entry.location}
          </h4>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            ${entry.total_amount.toFixed(2)}
          </span>
        </div>

        {/* Card Body - 2x2 Grid */}
        <div className="p-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatDate(entry.date)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Gallons</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {entry.gallons.toFixed(3)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Price/Gal</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              ${entry.price_per_gallon.toFixed(3)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">State</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {entry.state}
            </p>
          </div>
        </div>

        {/* Card Footer */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <StatusBadge status={entry.status} />
          <div className="flex items-center gap-2">
            {entry.receipt_image && (
              <button
                onClick={() => onViewReceipt(entry)}
                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="View Receipt"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => onEdit(entry)}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(entry)}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>

  {/* Mobile Pagination */}
  <div className="flex items-center justify-between px-2">
    <p className="text-sm text-gray-600 dark:text-gray-400">
      Page {currentPage} of {totalPages}
    </p>
    <div className="flex gap-2">
      <button
        onClick={() => setPage(page - 1)}
        disabled={!hasPrevPage}
        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
      >
        Previous
      </button>
      <button
        onClick={() => setPage(page + 1)}
        disabled={!hasNextPage}
        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
</div>
```

### Empty State Pattern

```jsx
{data.length === 0 && (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
    <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
      <Fuel className="h-8 w-8 text-gray-400 dark:text-gray-500" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
      No fuel purchases yet
    </h3>
    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
      Start tracking your fuel purchases to monitor expenses and generate IFTA reports.
    </p>
    <button
      onClick={onAddNew}
      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
    >
      <Plus className="h-5 w-5 mr-2" />
      Add Fuel Purchase
    </button>
  </div>
)}
```

---

## 8. Error Handling Standards

### User-Friendly Error Messages

**CRITICAL**: Replace all technical error messages with user-friendly versions.

```javascript
// errorMessages.js - Centralized error message mapping

export const ERROR_MESSAGES = {
  // Database errors
  'PGRST116': 'Unable to find the requested record. It may have been deleted.',
  'PGRST204': 'No data was returned. Please try refreshing the page.',
  '23505': 'This record already exists. Please check for duplicates.',
  '23503': 'This item is linked to other records and cannot be deleted.',
  '42501': 'You do not have permission to perform this action.',
  '42P01': 'We encountered a database configuration issue. Please contact support.',

  // Network errors
  'NETWORK_ERROR': 'Unable to connect to the server. Please check your internet connection.',
  'TIMEOUT': 'The request took too long. Please try again.',
  'FETCH_FAILED': 'Failed to load data. Please refresh the page.',

  // Authentication errors
  'AUTH_EXPIRED': 'Your session has expired. Please log in again.',
  'AUTH_INVALID': 'Invalid credentials. Please check your login information.',
  'AUTH_REQUIRED': 'Please log in to continue.',

  // Validation errors
  'INVALID_DATE': 'Please enter a valid date.',
  'INVALID_AMOUNT': 'Please enter a valid amount.',
  'REQUIRED_FIELD': 'This field is required.',
  'INVALID_FORMAT': 'Please check the format of your input.',

  // Upload errors
  'FILE_TOO_LARGE': 'The file is too large. Maximum size is 10MB.',
  'INVALID_FILE_TYPE': 'Please upload an image file (PNG, JPG, or JPEG).',
  'UPLOAD_FAILED': 'Failed to upload the file. Please try again.',

  // Generic fallback
  'UNKNOWN': 'Something went wrong. Please try again or contact support if the problem persists.',
};

export function getUserFriendlyError(error) {
  // If it's already a user-friendly message, return it
  if (typeof error === 'string' && !error.includes('_') && error.length < 100) {
    return error;
  }

  // Extract error code or message
  const errorCode = error?.code || error?.message || error;

  // Check for known error codes
  if (ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }

  // Check for partial matches in error message
  const errorStr = String(errorCode).toLowerCase();

  if (errorStr.includes('network') || errorStr.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  if (errorStr.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT;
  }
  if (errorStr.includes('auth') || errorStr.includes('unauthorized')) {
    return ERROR_MESSAGES.AUTH_REQUIRED;
  }
  if (errorStr.includes('permission') || errorStr.includes('denied')) {
    return ERROR_MESSAGES['42501'];
  }
  if (errorStr.includes('duplicate') || errorStr.includes('unique')) {
    return ERROR_MESSAGES['23505'];
  }
  if (errorStr.includes('foreign key') || errorStr.includes('reference')) {
    return ERROR_MESSAGES['23503'];
  }

  // Return generic message for unknown errors
  return ERROR_MESSAGES.UNKNOWN;
}
```

### Error Display Component

```jsx
// ErrorMessage.js
export function ErrorMessage({ error, onDismiss, className = '' }) {
  if (!error) return null;

  const message = getUserFriendlyError(error);

  return (
    <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            {message}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 text-red-400 hover:text-red-600 dark:hover:text-red-200 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
```

### Operation Message Banner

```jsx
// OperationMessage.js - For success/error feedback after operations
export function OperationMessage({ message, onDismiss }) {
  if (!message) return null;

  const isSuccess = message.type === 'success';

  return (
    <div className={`rounded-lg p-4 mb-6 flex items-center justify-between ${
      isSuccess
        ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
    }`}>
      <div className="flex items-center gap-3">
        {isSuccess ? (
          <CheckCircle className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
        )}
        <p className={`text-sm font-medium ${
          isSuccess
            ? 'text-emerald-800 dark:text-emerald-200'
            : 'text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className={`p-1 rounded transition-colors ${
          isSuccess
            ? 'text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-200'
            : 'text-red-400 hover:text-red-600 dark:hover:text-red-200'
        }`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
```

### Service Layer Error Handling

```javascript
// In service files - remove console.log, use proper error handling

export async function createFuelEntry(data) {
  try {
    const { data: entry, error } = await supabase
      .from('fuel_entries')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return entry;
  } catch (error) {
    // Log to error tracking service in production (not console)
    // logError('createFuelEntry', error, { data });

    // Throw with context for component to handle
    throw {
      code: error.code || 'UNKNOWN',
      message: error.message,
      context: 'creating fuel entry'
    };
  }
}
```

### Component Error Handling Pattern

```jsx
const handleSave = async () => {
  setError(null);
  setIsSubmitting(true);

  try {
    await createFuelEntry(formData);
    setOperationMessage({
      type: 'success',
      text: 'Fuel purchase saved successfully'
    });
    onClose();
  } catch (error) {
    // Use user-friendly error
    setError(getUserFriendlyError(error));
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## 9. Loading States

### Page Loading Skeleton

```jsx
// PageSkeleton.js
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6" />

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-4">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
          <div className="lg:col-span-3 space-y-4">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Button Loading State

```jsx
<button
  disabled={isLoading}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isLoading ? (
    <>
      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
      Processing...
    </>
  ) : (
    <>
      <Plus className="h-4 w-4 mr-2" />
      Add Entry
    </>
  )}
</button>
```

### Inline Loading Spinner

```jsx
{loading && (
  <div className="flex items-center justify-center py-8">
    <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
  </div>
)}
```

### Table Row Loading

```jsx
{loading && (
  <tr>
    <td colSpan={6} className="px-4 py-8 text-center">
      <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
        <RefreshCw className="h-5 w-5 animate-spin" />
        Loading records...
      </div>
    </td>
  </tr>
)}
```

---

## 10. Backend Service Patterns

### Service File Structure

```javascript
// src/lib/services/[feature]Service.js

import { supabase, formatError } from '../supabaseClient';
import { getUserFriendlyError } from '../utils/errorMessages';

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Fetch all entries for a user with optional filters
 * @param {string} userId - User ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of entries
 */
export async function fetchEntries(userId, filters = {}) {
  try {
    let query = supabase
      .from('table_name')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.dateRange) {
      const { start, end } = getDateRange(filters.dateRange);
      query = query.gte('date', start).lte('date', end);
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw {
      code: error.code || 'FETCH_FAILED',
      message: error.message,
      context: 'fetching entries'
    };
  }
}

/**
 * Get a single entry by ID
 * @param {string} id - Entry ID
 * @returns {Promise<Object>} Entry object
 */
export async function getEntryById(id) {
  try {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw {
      code: error.code || 'FETCH_FAILED',
      message: error.message,
      context: 'fetching entry'
    };
  }
}

// ============================================
// WRITE OPERATIONS
// ============================================

/**
 * Create a new entry
 * @param {Object} entryData - Entry data
 * @returns {Promise<Object>} Created entry
 */
export async function createEntry(entryData) {
  try {
    const { data, error } = await supabase
      .from('table_name')
      .insert([{
        ...entryData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw {
      code: error.code || 'CREATE_FAILED',
      message: error.message,
      context: 'creating entry'
    };
  }
}

/**
 * Update an existing entry
 * @param {string} id - Entry ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated entry
 */
export async function updateEntry(id, updates) {
  try {
    const { data, error } = await supabase
      .from('table_name')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw {
      code: error.code || 'UPDATE_FAILED',
      message: error.message,
      context: 'updating entry'
    };
  }
}

/**
 * Delete an entry
 * @param {string} id - Entry ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteEntry(id) {
  try {
    const { error } = await supabase
      .from('table_name')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    throw {
      code: error.code || 'DELETE_FAILED',
      message: error.message,
      context: 'deleting entry'
    };
  }
}

// ============================================
// STATISTICS / AGGREGATION
// ============================================

/**
 * Get aggregated statistics for a user
 * @param {string} userId - User ID
 * @param {string} period - Time period
 * @returns {Promise<Object>} Statistics object
 */
export async function getStats(userId, period = 'This Quarter') {
  try {
    const { start, end } = getDateRange(period);

    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end);

    if (error) throw error;

    // Calculate aggregations
    return {
      totalCount: data.length,
      totalAmount: data.reduce((sum, item) => sum + (item.amount || 0), 0),
      avgAmount: data.length > 0
        ? data.reduce((sum, item) => sum + (item.amount || 0), 0) / data.length
        : 0,
      // ... more stats
    };
  } catch (error) {
    throw {
      code: error.code || 'STATS_FAILED',
      message: error.message,
      context: 'calculating statistics'
    };
  }
}

// ============================================
// FILE UPLOADS
// ============================================

/**
 * Upload an image file
 * @param {string} userId - User ID
 * @param {File} file - File to upload
 * @param {string} folder - Storage folder
 * @returns {Promise<string|null>} Public URL or null
 */
export async function uploadImage(userId, file, folder = 'uploads') {
  try {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${folder}/${timestamp}_${safeName}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    // Upload failures shouldn't block main operations
    // Return null and let component decide how to handle
    return null;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get date range boundaries for a period
 * @param {string} period - Period name
 * @returns {Object} { start, end } ISO date strings
 */
function getDateRange(period) {
  const now = new Date();
  let start, end;

  switch (period) {
    case 'This Quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      end = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      break;
    case 'Last Quarter':
      const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
      const year = lastQuarter < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const adjustedQuarter = lastQuarter < 0 ? 3 : lastQuarter;
      start = new Date(year, adjustedQuarter * 3, 1);
      end = new Date(year, (adjustedQuarter + 1) * 3, 0);
      break;
    case 'This Year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      break;
    case 'Last Year':
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear() - 1, 11, 31);
      break;
    default:
      start = new Date(now.getFullYear(), 0, 1);
      end = now;
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}
```

### Custom Hook Pattern

```javascript
// src/hooks/use[Feature].js

import { useState, useEffect, useCallback } from 'react';
import {
  fetchEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  getStats
} from '../lib/services/[feature]Service';

export function useFeature(userId) {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load entries
  const loadEntries = useCallback(async (filters = {}) => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchEntries(userId, filters);
      setEntries(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load stats
  const loadStats = useCallback(async (period) => {
    if (!userId) return;

    try {
      const data = await getStats(userId, period);
      setStats(data);
    } catch (err) {
      // Stats errors shouldn't block main functionality
      setStats(null);
    }
  }, [userId]);

  // Add entry
  const addEntry = useCallback(async (entryData) => {
    const newEntry = await createEntry({ ...entryData, user_id: userId });
    setEntries(prev => [newEntry, ...prev]);
    return newEntry;
  }, [userId]);

  // Update entry
  const editEntry = useCallback(async (id, updates) => {
    const updated = await updateEntry(id, updates);
    setEntries(prev => prev.map(e => e.id === id ? updated : e));
    return updated;
  }, []);

  // Remove entry
  const removeEntry = useCallback(async (id) => {
    await deleteEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  // Initial load
  useEffect(() => {
    if (userId) {
      loadEntries();
      loadStats();
    }
  }, [userId, loadEntries, loadStats]);

  return {
    entries,
    stats,
    loading,
    error,
    loadEntries,
    loadStats,
    addEntry,
    editEntry,
    removeEntry,
  };
}
```

---

## 11. File Structure Reference

### Complete Feature Module Structure

```
src/
├── app/(dashboard)/dashboard/[feature]/
│   └── page.js                    # Server wrapper with dynamic import
├── components/
│   ├── [Feature]Page.js           # Main page component
│   └── [feature]/                  # Feature-specific components
│       ├── [Feature]Form.js       # Add/Edit form modal
│       ├── [Feature]Item.js       # Desktop table row
│       ├── [Feature]Card.js       # Mobile card view
│       ├── [Feature]FilterBar.js  # Search and filters
│       ├── [Feature]Stats.js      # Statistics cards
│       ├── [Feature]DeletionModal.js  # Delete confirmation
│       └── [Other specific components]
├── hooks/
│   └── use[Feature].js            # Custom data hook
└── lib/
    ├── services/
    │   └── [feature]Service.js    # Backend service layer
    └── utils/
        └── errorMessages.js       # Centralized error messages
```

### Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Page component | `[Feature]Page.js` | `FuelTrackerPage.js` |
| Server wrapper | `page.js` | `app/(dashboard)/dashboard/fuel/page.js` |
| Form component | `[Feature]Form.js` | `FuelEntryForm.js` |
| Item/Row component | `[Feature]Item.js` | `FuelEntryItem.js` |
| Card component | `[Feature]Card.js` | `FuelEntryCard.js` |
| Service file | `[feature]Service.js` | `fuelService.js` |
| Custom hook | `use[Feature].js` | `useFuel.js` |

---

## Summary Checklist

When building a new page to match the Fuel Tracker pattern:

### UI/UX
- [ ] Header with gradient background (blue-600 to blue-500, dark variants)
- [ ] Primary action button (white bg, blue text)
- [ ] Secondary action button (transparent bg, white text/border)
- [ ] Operation message banner for success/error feedback
- [ ] Statistics cards row (4 cards, 2x2 on mobile)
- [ ] 4-column grid layout (1 sidebar + 3 main on desktop)
- [ ] Sidebar widgets with lists
- [ ] Filter bar with search input and dropdowns
- [ ] Desktop table with sticky header, scrollable body
- [ ] Mobile card grid
- [ ] **Pagination: 10 items per page**
- [ ] Empty state with icon, message, and CTA
- [ ] All elements have dark mode variants

### Forms
- [ ] Modal container with header, scrollable body, footer
- [ ] Field validation on blur and submit
- [ ] Error messages under fields
- [ ] Loading state on submit button
- [ ] File upload with drag-and-drop

### Error Handling
- [ ] Remove all `console.log` statements
- [ ] Use `getUserFriendlyError()` for all error displays
- [ ] Operation feedback via success/error banner
- [ ] Field-level validation with clear messages

### Backend
- [ ] Service file with CRUD operations
- [ ] Custom hook for state management
- [ ] Proper error throwing with codes
- [ ] No console.log in production code

---

*Last Updated: November 2024*
*Version: 1.0*
