"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

export default function MileageLayout({ children }) {
  return (
    <DashboardLayout activePage="mileage">
      {children}
    </DashboardLayout>
  );
}