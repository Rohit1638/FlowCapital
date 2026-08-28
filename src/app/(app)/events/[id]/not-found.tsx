import Link from "next/link";

export default function EventNotFound() {
  return (
    <div className="rounded-[1.6rem] border border-foreground/10 bg-white p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Event Intelligence</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">Event not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">This signal is not in the current demo event store.</p>
      <Link href="/events" className="mt-6 inline-flex text-sm font-semibold underline">
        Return to the event stream
      </Link>
    </div>
  );
}
