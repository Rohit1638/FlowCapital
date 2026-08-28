import { redirect } from "next/navigation";

export default async function LenderOpportunityRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/lender/opportunities/${id}/decision`);
}
