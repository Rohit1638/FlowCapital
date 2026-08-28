import type { Metadata } from "next";
import { DecisionCenter } from "@/components/decisions/DecisionCenter";

export const metadata: Metadata = {
  title: "Capital Decision Center",
};

export default function DecisionsPage() {
  return <DecisionCenter />;
}
