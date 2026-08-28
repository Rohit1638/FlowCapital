import { redirect } from "next/navigation";

export default function LegacyNewRequestRedirect() {
  redirect("/manufacturer/financing-request");
}
