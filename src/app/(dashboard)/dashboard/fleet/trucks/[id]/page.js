import { redirect } from "next/navigation";

export default async function VehicleDetailRedirect({ params }) {
  const { id } = await params;
  if (!id) redirect("/dashboard/fleet?tab=vehicles");
  redirect(`/dashboard/fleet?tab=vehicles&row=${encodeURIComponent(id)}`);
}
