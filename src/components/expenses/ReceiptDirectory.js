'use client';

import { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileImage,
  Download,
  ChevronRight,
  ChevronDown,
  Calendar,
  Filter,
  Image,
  Eye,
  Loader2,
  FolderArchive,
  CheckSquare,
  Square,
  X,
  Search,
  RefreshCw
} from 'lucide-react';
import JSZip from 'jszip';

/**
 * Receipt Directory Component
 *
 * A file directory-style interface for organizing and downloading expense receipts.
 * Organizes receipts into folders by year and month.
 */
export default function ReceiptDirectory({
  expenses = [],
  onViewReceipt,
  isLoading = false
}) {
  // Filter state
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedReceipts, setSelectedReceipts] = useState(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

  // Get only expenses with receipts
  const expensesWithReceipts = useMemo(() => {
    return expenses.filter(expense => expense.receipt_image && expense.receipt_image.length > 0);
  }, [expenses]);

  // Get unique years from expenses
  const availableYears = useMemo(() => {
    const years = new Set();
    expensesWithReceipts.forEach(expense => {
      if (expense.date) {
        years.add(new Date(expense.date).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [expensesWithReceipts]);

  // Get unique categories
  const availableCategories = useMemo(() => {
    const categories = new Set();
    expensesWithReceipts.forEach(expense => {
      if (expense.category) {
        categories.add(expense.category);
      }
    });
    return Array.from(categories).sort();
  }, [expensesWithReceipts]);

  // Filter and organize receipts into folder structure
  const folderStructure = useMemo(() => {
    let filtered = expensesWithReceipts;

    // Apply year filter
    if (selectedYear !== 'all') {
      filtered = filtered.filter(expense => {
        const year = new Date(expense.date).getFullYear();
        return year === parseInt(selectedYear);
      });
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(expense =>
        (expense.description && expense.description.toLowerCase().includes(query)) ||
        (expense.category && expense.category.toLowerCase().includes(query))
      );
    }

    // Organize into year > month structure
    const structure = {};

    filtered.forEach(expense => {
      if (!expense.date) return;

      const date = new Date(expense.date);
      const year = date.getFullYear();
      const month = date.toLocaleString('en-US', { month: 'long' });
      const monthNum = date.getMonth();

      if (!structure[year]) {
        structure[year] = { months: {}, total: 0 };
      }

      if (!structure[year].months[monthNum]) {
        structure[year].months[monthNum] = {
          name: month,
          receipts: [],
          total: 0
        };
      }

      structure[year].months[monthNum].receipts.push(expense);
      structure[year].months[monthNum].total += parseFloat(expense.amount) || 0;
      structure[year].total += parseFloat(expense.amount) || 0;
    });

    return structure;
  }, [expensesWithReceipts, selectedYear, selectedCategory, searchQuery]);

  // Toggle folder expansion
  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Toggle receipt selection
  const toggleReceiptSelection = (receiptId) => {
    setSelectedReceipts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(receiptId)) {
        newSet.delete(receiptId);
      } else {
        newSet.add(receiptId);
      }
      return newSet;
    });
  };

  // Select all receipts in a folder
  const selectAllInFolder = (receipts) => {
    setSelectedReceipts(prev => {
      const newSet = new Set(prev);
      receipts.forEach(r => newSet.add(r.id));
      return newSet;
    });
  };

  // Deselect all receipts in a folder
  const deselectAllInFolder = (receipts) => {
    setSelectedReceipts(prev => {
      const newSet = new Set(prev);
      receipts.forEach(r => newSet.delete(r.id));
      return newSet;
    });
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedReceipts(new Set());
  };

  // Sanitize text for filename
  const sanitizeFilename = (text, maxLength = 30) => {
    if (!text) return 'receipt';
    return text
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .slice(0, maxLength) // Limit length
      .replace(/_+$/, ''); // Remove trailing underscores
  };

  // Download a single receipt
  const downloadSingleReceipt = async (expense) => {
    if (!expense.receipt_image) return;

    try {
      const response = await fetch(expense.receipt_image);
      const blob = await response.blob();

      const contentType = blob.type || 'image/jpeg';
      let extension = 'jpg';
      if (contentType.includes('png')) extension = 'png';
      else if (contentType.includes('pdf')) extension = 'pdf';

      const date = new Date(expense.date).toISOString().split('T')[0];
      const description = sanitizeFilename(expense.description);
      const filename = `${date}-${description}.${extension}`;

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Download folder as ZIP
  const downloadFolderAsZip = async (year, monthNum = null) => {
    setIsDownloading(true);

    try {
      const zip = new JSZip();
      let receiptsToDownload = [];
      let folderName = '';

      if (monthNum !== null) {
        // Download specific month
        const monthData = folderStructure[year]?.months[monthNum];
        if (!monthData) return;
        receiptsToDownload = monthData.receipts;
        folderName = `receipts-${year}-${monthData.name}`;
      } else {
        // Download entire year
        const yearData = folderStructure[year];
        if (!yearData) return;
        Object.values(yearData.months).forEach(month => {
          receiptsToDownload.push(...month.receipts);
        });
        folderName = `receipts-${year}`;
      }

      setDownloadProgress({ current: 0, total: receiptsToDownload.length });

      // Fetch all receipts
      for (let i = 0; i < receiptsToDownload.length; i++) {
        const expense = receiptsToDownload[i];
        if (!expense.receipt_image) continue;

        try {
          const response = await fetch(expense.receipt_image);
          const blob = await response.blob();

          const contentType = blob.type || 'image/jpeg';
          let extension = 'jpg';
          if (contentType.includes('png')) extension = 'png';
          else if (contentType.includes('pdf')) extension = 'pdf';

          const date = new Date(expense.date).toISOString().split('T')[0];
          const description = sanitizeFilename(expense.description);
          const filename = `${date}-${description}.${extension}`;

          zip.file(filename, blob);
          setDownloadProgress({ current: i + 1, total: receiptsToDownload.length });
        } catch (err) {
          console.error(`Failed to download receipt ${expense.id}:`, err);
        }
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const blobUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${folderName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('ZIP download failed:', error);
    } finally {
      setIsDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  // Download selected receipts as ZIP
  const downloadSelectedAsZip = async () => {
    if (selectedReceipts.size === 0) return;

    setIsDownloading(true);

    try {
      const zip = new JSZip();
      const receiptsToDownload = expensesWithReceipts.filter(e => selectedReceipts.has(e.id));

      setDownloadProgress({ current: 0, total: receiptsToDownload.length });

      for (let i = 0; i < receiptsToDownload.length; i++) {
        const expense = receiptsToDownload[i];
        if (!expense.receipt_image) continue;

        try {
          const response = await fetch(expense.receipt_image);
          const blob = await response.blob();

          const contentType = blob.type || 'image/jpeg';
          let extension = 'jpg';
          if (contentType.includes('png')) extension = 'png';
          else if (contentType.includes('pdf')) extension = 'pdf';

          const date = new Date(expense.date).toISOString().split('T')[0];
          const description = sanitizeFilename(expense.description);
          const filename = `${date}-${description}.${extension}`;

          zip.file(filename, blob);
          setDownloadProgress({ current: i + 1, total: receiptsToDownload.length });
        } catch (err) {
          console.error(`Failed to download receipt ${expense.id}:`, err);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const blobUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `selected-receipts-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      // Clear selections after download
      clearSelections();
    } catch (error) {
      console.error('ZIP download failed:', error);
    } finally {
      setIsDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      Fuel: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      Maintenance: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      Insurance: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      Tolls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      Office: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      Permits: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
      Meals: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      Other: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    };
    return colors[category] || colors.Other;
  };

  // Count total receipts
  const totalReceiptsCount = useMemo(() => {
    let count = 0;
    Object.values(folderStructure).forEach(year => {
      Object.values(year.months).forEach(month => {
        count += month.receipts.length;
      });
    });
    return count;
  }, [folderStructure]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex justify-center items-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-700 dark:to-emerald-600">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <FolderArchive className="h-5 w-5" />
            Receipt Directory
          </h3>
          <span className="text-emerald-100 text-sm">
            {totalReceiptsCount} receipts
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search receipts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Years</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Categories</option>
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Selection Actions Bar */}
      {selectedReceipts.size > 0 && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-between">
          <span className="text-sm text-emerald-700 dark:text-emerald-300">
            {selectedReceipts.size} receipt{selectedReceipts.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadSelectedAsZip}
              disabled={isDownloading}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-1.5" />
              )}
              Download Selected
            </button>
            <button
              onClick={clearSelections}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Download Progress */}
      {isDownloading && downloadProgress.total > 0 && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Downloading receipts...
            </span>
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {downloadProgress.current} / {downloadProgress.total}
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Directory Content */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
        {expensesWithReceipts.length === 0 ? (
          <div className="text-center py-12">
            <FolderArchive className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              No Receipts Found
            </h4>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Upload receipts when adding expenses to see them here.
            </p>
          </div>
        ) : Object.keys(folderStructure).length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              No Matching Receipts
            </h4>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(folderStructure)
              .sort(([a], [b]) => parseInt(b) - parseInt(a))
              .map(([year, yearData]) => {
                const yearFolderId = `year-${year}`;
                const isYearExpanded = expandedFolders.has(yearFolderId);

                return (
                  <div key={year} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {/* Year Folder */}
                    <div
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => toggleFolder(yearFolderId)}
                    >
                      <div className="flex items-center gap-2">
                        {isYearExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        {isYearExpanded ? (
                          <FolderOpen className="h-5 w-5 text-amber-500" />
                        ) : (
                          <Folder className="h-5 w-5 text-amber-500" />
                        )}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{year}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({Object.values(yearData.months).reduce((sum, m) => sum + m.receipts.length, 0)} receipts)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {formatCurrency(yearData.total)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadFolderAsZip(year);
                          }}
                          disabled={isDownloading}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors disabled:opacity-50"
                          title={`Download all ${year} receipts`}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Month Folders */}
                    {isYearExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-700">
                        {Object.entries(yearData.months)
                          .sort(([a], [b]) => parseInt(b) - parseInt(a))
                          .map(([monthNum, monthData]) => {
                            const monthFolderId = `month-${year}-${monthNum}`;
                            const isMonthExpanded = expandedFolders.has(monthFolderId);
                            const allSelected = monthData.receipts.every(r => selectedReceipts.has(r.id));
                            const someSelected = monthData.receipts.some(r => selectedReceipts.has(r.id));

                            return (
                              <div key={monthNum} className="border-t border-gray-100 dark:border-gray-700 first:border-t-0">
                                {/* Month Header */}
                                <div
                                  className="flex items-center justify-between px-3 py-2 pl-8 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                  onClick={() => toggleFolder(monthFolderId)}
                                >
                                  <div className="flex items-center gap-2">
                                    {isMonthExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-gray-400" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-400" />
                                    )}
                                    {isMonthExpanded ? (
                                      <FolderOpen className="h-4 w-4 text-blue-500" />
                                    ) : (
                                      <Folder className="h-4 w-4 text-blue-500" />
                                    )}
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{monthData.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      ({monthData.receipts.length})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {formatCurrency(monthData.total)}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (allSelected) {
                                          deselectAllInFolder(monthData.receipts);
                                        } else {
                                          selectAllInFolder(monthData.receipts);
                                        }
                                      }}
                                      className="p-1 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                                      title={allSelected ? "Deselect all" : "Select all"}
                                    >
                                      {allSelected ? (
                                        <CheckSquare className="h-4 w-4" />
                                      ) : someSelected ? (
                                        <CheckSquare className="h-4 w-4 opacity-50" />
                                      ) : (
                                        <Square className="h-4 w-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadFolderAsZip(year, parseInt(monthNum));
                                      }}
                                      disabled={isDownloading}
                                      className="p-1 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50"
                                      title={`Download ${monthData.name} receipts`}
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Receipt Files */}
                                {isMonthExpanded && (
                                  <div className="bg-gray-50/50 dark:bg-gray-900/30">
                                    {monthData.receipts.map((expense) => {
                                      const isSelected = selectedReceipts.has(expense.id);
                                      return (
                                        <div
                                          key={expense.id}
                                          className={`flex items-center justify-between px-3 py-2 pl-14 border-t border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-colors ${
                                            isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                                          }`}
                                        >
                                          <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <button
                                              onClick={() => toggleReceiptSelection(expense.id)}
                                              className="flex-shrink-0"
                                            >
                                              {isSelected ? (
                                                <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                              ) : (
                                                <Square className="h-4 w-4 text-gray-400" />
                                              )}
                                            </button>
                                            <FileImage className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                                {expense.description || 'Untitled Receipt'}
                                              </p>
                                              <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                  {new Date(expense.date).toLocaleDateString()}
                                                </span>
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${getCategoryColor(expense.category)}`}>
                                                  {expense.category}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2 ml-2">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                              {formatCurrency(expense.amount)}
                                            </span>
                                            <button
                                              onClick={() => onViewReceipt && onViewReceipt(expense)}
                                              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                              title="View receipt"
                                            >
                                              <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                              onClick={() => downloadSingleReceipt(expense)}
                                              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
                                              title="Download receipt"
                                            >
                                              <Download className="h-4 w-4" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
