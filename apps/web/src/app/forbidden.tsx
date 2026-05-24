export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--background)] px-6 text-center text-[var(--foreground)]">
      <h1 className="text-3xl font-bold">Access Forbidden</h1>
      <p className="max-w-md text-sm text-[var(--muted-foreground)]">
        You do not have permission to access this page.
      </p>
      <a
        href="/dashboard"
        className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
      >
        Back to Dashboard
      </a>
    </div>
  );
}