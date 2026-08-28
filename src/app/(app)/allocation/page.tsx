import type { Metadata } from "next";
import { AllocationDesk } from "@/components/allocation/AllocationDesk";

export const metadata: Metadata = {
  title: "Capital Allocation Simulator",
};

export default function AllocationPage() {
  return <AllocationDesk />;
}
