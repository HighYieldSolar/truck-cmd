import Link from "next/link";
import { Plus, Download, FileText, ChevronRight } from "lucide-react";

export default function InvoiceManagementHeader() {
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-r from-blue-700 to-indigo-800 p-8 rounded-xl shadow-lg text-white">
        <div>
          <h1 className="text-3xl font-bold text-white">Invoice Management</h1>
          <p className="text-blue-100 mt-2 text-lg">Create, track, and manage your trucking invoices</p>
          <div className="flex items-center text-sm text-blue-200 mt-3">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <ChevronRight size={16} className="mx-2" />
            <span className="text-white font-medium">Invoices</span>
          </div>
        </div>
        <div className="mt-6 md:mt-0 flex space-x-4">
          <Link
            href="/dashboard/invoices/new"
            className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Create Invoice
          </Link>
          <button
            className="inline-flex items-center px-5 py-2.5 border border-white rounded-lg shadow-sm text-sm font-medium text-white bg-transparent hover:bg-blue-700 focus:outline-none transition-colors"
          >
            <Download size={18} className="mr-2" />
            Export
          </button>
        </div>
      </div>
      <div className="mt-6 bg-white p-5 rounded-xl shadow-md border border-gray-200">
        <p className="text-gray-700 flex items-center">
          <FileText size={20} className="text-blue-600 mr-3" />
          <span className="font-medium">Generate, manage, and track your invoices for all your trucking operations in one place.</span>
        </p>
      </div>
    </div>
  );
} 