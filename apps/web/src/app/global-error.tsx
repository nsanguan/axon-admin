'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[var(--background)] text-[var(--foreground)] antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="max-w-md text-sm text-[var(--muted-foreground)]">
            An unexpected application error occurred. You can try the action again.
          </p>
          <button
            onClick={() => reset()}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}