import { redirect } from "next/navigation";

// Old route — redirect to the unified fleet page on the drivers tab.
export default function DriversRedirect() {
  redirect("/dashboard/fleet?tab=drivers");
}
