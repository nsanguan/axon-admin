export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--background)] px-6 text-center text-[var(--foreground)]">
      <h1 className="text-3xl font-bold">Unauthorized</h1>
      <p className="max-w-md text-sm text-[var(--muted-foreground)]">
        Please sign in with an account that has access to continue.
      </p>
      <a
        href="/login"
        className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
      >
        Go to Login
      </a>
    </div>
  );
}