import Link from "next/link";

export default function IntelligenceAssetNotFound() {
  return (
    <div className="rounded-[1.6rem] border border-foreground/10 bg-white p-8">
      <h1 className="font-display text-3xl font-semibold">Asset not found</h1>
      <Link href="/intelligence" className="mt-4 inline-flex text-sm font-semibold underline">
        Return to portfolio intelligence
      </Link>
    </div>
  );
}
