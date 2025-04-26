"use client";

export default function ComplianceSummary({ stats }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow overflow-hidden p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Total
                </h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                    {stats.total}
                </p>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Active
                </h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                    {stats.active}
                </p>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Expiring Soon
                </h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                    {stats.expiringSoon}
                </p>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Expired
                </h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                    {stats.expired}
                </p>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Pending
                </h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                    {stats.pending}
                </p>
            </div>
      </div>
    );
}