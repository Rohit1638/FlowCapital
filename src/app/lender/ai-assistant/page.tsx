import { Suspense } from "react";
import { LenderAIAssistantContent } from "./LenderAIAssistantContent";

export default function LenderAIAssistantPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted-foreground">Loading AI assistant…</p>}>
      <LenderAIAssistantContent />
    </Suspense>
  );
}
