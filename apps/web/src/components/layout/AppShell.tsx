'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Menu, X } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
        <button
          onClick={() => setDrawerOpen(false)}
          className="absolute top-4 right-[-44px] p-2 rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--muted-foreground)]"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header bar with hamburger */}
        <div className="flex h-16 items-center border-b border-[var(--border)] bg-[var(--background)] md:hidden px-4">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-md hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="ml-3 text-lg font-bold">AXON Admin</span>
        </div>

        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
