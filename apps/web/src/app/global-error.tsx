'use client';

/**
 * Global error boundary — replaces the root layout on unrecoverable errors.
 * Must NOT use any context-dependent components (Toaster, AppShell, etc.)
 * because it renders outside the root layout.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#09090b', color: '#fafafa' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Something went wrong</h2>
          <button
            onClick={reset}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#6d28d9', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
