import { redirect } from "next/navigation";
import { DEMO_REQUEST_ID } from "@/lib/platform/demo-fallback";

export default function DemoOpportunityRedirect() {
  redirect(`/lender/opportunities/${DEMO_REQUEST_ID}/decision`);
}
