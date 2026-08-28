import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";

export default function AssetNotFound() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Twin not found"
        description="This Digital Asset Twin is not in the current mock book."
      />
      <div className="mt-8">
        <Button asChild variant="dark">
          <Link href="/assets">Back to Asset Intelligence</Link>
        </Button>
      </div>
    </div>
  );
}
