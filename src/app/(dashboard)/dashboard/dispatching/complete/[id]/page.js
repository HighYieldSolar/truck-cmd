// src/app/(dashboard)/dashboard/dispatching/complete/[id]/page.js
"use client";

import CompleteLoadPage from '@/components/dashboard/CompleteLoadPage';

export default function CompleteLoadRoute({ params }) {
  return <CompleteLoadPage params={params} />;
}