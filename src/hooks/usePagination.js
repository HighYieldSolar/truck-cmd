'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Custom hook for managing pagination state
 *
 * Provides all the logic needed to paginate any array of data
 * with configurable items per page and page number display.
 *
 * @param {Array} data - The full array of data to paginate
 * @param {Object} options - Configuration options
 * @param {number} options.itemsPerPage - Items to show per page (default: 10)
 * @param {number} options.maxVisiblePages - Max page buttons to show (default: 5)
 * @param {boolean} options.resetOnDataChange - Reset to page 1 when data changes (default: true)
 *
 * @returns {Object} Pagination state and controls
 *
 * @example
 * const {
 *   paginatedData,
 *   currentPage,
 *   totalPages,
 *   goToPage,
 *   nextPage,
 *   prevPage,
 *   pageNumbers,
 *   startIndex,
 *   endIndex,
 *   totalItems,
 *   hasNextPage,
 *   hasPrevPage,
 * } = usePagination(fuelEntries, { itemsPerPage: 10 });
 */
export function usePagination(data = [], options = {}) {
  const {
    itemsPerPage = 10,
    maxVisiblePages = 5,
    resetOnDataChange = true,
  } = options;

  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total items and pages
  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Calculate slice indices
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Get paginated data slice
  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  // Navigation flags
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  // Reset to page 1 when data length changes (e.g., after filtering)
  useEffect(() => {
    if (resetOnDataChange && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalItems, resetOnDataChange, currentPage, totalPages]);

  // Generate array of page numbers to display
  const pageNumbers = useMemo(() => {
    const pages = [];

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination with ellipsis
      const halfVisible = Math.floor(maxVisiblePages / 2);

      if (currentPage <= halfVisible + 1) {
        // Near the start: show first pages + ellipsis + last
        for (let i = 1; i <= maxVisiblePages - 2; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - halfVisible) {
        // Near the end: show first + ellipsis + last pages
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - (maxVisiblePages - 3); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle: show first + ellipsis + current area + ellipsis + last
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages, maxVisiblePages]);

  // Navigation functions
  const goToPage = useCallback((page) => {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPrevPage]);

  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  // Reset pagination
  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    // Data
    paginatedData,
    totalItems,
    totalPages,
    itemsPerPage,

    // Current state
    currentPage,
    startIndex,
    endIndex,

    // Navigation flags
    hasNextPage,
    hasPrevPage,
    isFirstPage,
    isLastPage,

    // Page numbers for rendering
    pageNumbers,

    // Navigation functions
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setCurrentPage,
    reset,

    // Computed display values
    showingFrom: totalItems > 0 ? startIndex + 1 : 0,
    showingTo: endIndex,
    showingText: totalItems > 0
      ? `Showing ${startIndex + 1} to ${endIndex} of ${totalItems}`
      : 'No items to display',
  };
}

/**
 * Pagination component for rendering page controls
 *
 * @example
 * <Pagination
 *   currentPage={currentPage}
 *   totalPages={totalPages}
 *   pageNumbers={pageNumbers}
 *   onPageChange={goToPage}
 *   hasNextPage={hasNextPage}
 *   hasPrevPage={hasPrevPage}
 *   showingText={showingText}
 * />
 */
export function Pagination({
  currentPage,
  totalPages,
  pageNumbers,
  onPageChange,
  hasNextPage,
  hasPrevPage,
  showingText,
  className = '',
}) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Summary text */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {showingText}
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage}
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-200"
          aria-label="Previous page"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        {pageNumbers.map((page, index) => (
          page === '...' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-3 py-1 text-gray-400 dark:text-gray-500"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        ))}

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-200"
          aria-label="Next page"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Simple pagination for mobile - just prev/next buttons
 */
export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPrevPage,
  className = '',
}) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default usePagination;
