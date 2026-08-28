import { redirect } from "next/navigation";

export default function LegacyRequestsRedirect() {
  redirect("/manufacturer/production-plans");
}
