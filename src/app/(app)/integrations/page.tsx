import type { Metadata } from "next";
import { IntegrationCenter } from "@/components/integration/IntegrationCenter";

export const metadata: Metadata = {
  title: "Integration Center",
};

export default function IntegrationsPage() {
  return <IntegrationCenter />;
}
