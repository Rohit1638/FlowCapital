import type { Metadata } from "next";
import { EventDetailPage } from "@/components/integration/EventDetail";

export const metadata: Metadata = {
  title: "Event Detail",
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <EventDetailPage params={params} />;
}
