import type { Metadata } from "next";
import { EventIntelligence } from "@/components/integration/EventIntelligence";

export const metadata: Metadata = {
  title: "Event Intelligence",
};

export default function EventsPage() {
  return <EventIntelligence />;
}
