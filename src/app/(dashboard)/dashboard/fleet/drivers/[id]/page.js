import { redirect } from "next/navigation";

/**
 * Old detail route — redirect to /dashboard/fleet?tab=drivers&row=<id>.
 * The unified page opens that driver's drawer on load. RLS still gates the row.
 */
export default async function DriverDetailRedirect({ params }) {
  const { id } = await params;
  if (!id) redirect("/dashboard/fleet?tab=drivers");
  redirect(`/dashboard/fleet?tab=drivers&row=${encodeURIComponent(id)}`);
}
