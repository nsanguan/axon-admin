export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--background)] px-6 text-center text-[var(--foreground)]">
      <h1 className="text-3xl font-bold">Page Not Found</h1>
      <p className="max-w-md text-sm text-[var(--muted-foreground)]">
        The page you requested does not exist or is no longer available.
      </p>
      <a
        href="/dashboard"
        className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
      >
        Go to Dashboard
      </a>
    </div>
  );
}