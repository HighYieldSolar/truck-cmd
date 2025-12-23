"use client";

import { BarChart2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

export default function InvoiceReportsComponent() {
  const { t } = useTranslation('invoices');

  const reports = [
    {
      title: t('reports.monthlyRevenue.title'),
      description: t('reports.monthlyRevenue.description'),
      icon: <BarChart2 size={24} className="text-blue-600" />,
      link: "/dashboard/reports/monthly-revenue",
      color: "bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100"
    },
    {
      title: t('reports.customerInsights.title'),
      description: t('reports.customerInsights.description'),
      icon: <BarChart2 size={24} className="text-purple-600" />,
      link: "/dashboard/reports/customer-insights",
      color: "bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100"
    },
    {
      title: t('reports.paymentAnalytics.title'),
      description: t('reports.paymentAnalytics.description'),
      icon: <BarChart2 size={24} className="text-green-600" />,
      link: "/dashboard/reports/payment-analytics",
      color: "bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100"
    }
  ];

  return (
    <div className="mt-8 mb-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
          <h2 className="text-xl font-semibold">{t('reports.pageTitle')}</h2>
          <p className="text-blue-100 mt-2">{t('reports.pageSubtitle')}</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-white to-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reports.map((report, index) => (
              <Link
                key={index}
                href={report.link}
                className={`p-5 rounded-xl border border-gray-200 ${report.color} transition-all duration-200 transform hover:scale-105 hover:shadow-lg`}
              >
                <div className="flex items-start mb-4">
                  <div className="rounded-full bg-white p-3 mr-3 shadow-sm">
                    {report.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{report.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <span className="text-sm font-medium text-blue-600 flex items-center">
                    {t('reports.viewReport')} <ArrowRight size={16} className="ml-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 