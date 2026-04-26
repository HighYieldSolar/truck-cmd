import { redirect } from "next/navigation";

export default function TrucksRedirect() {
  redirect("/dashboard/fleet?tab=vehicles");
}
