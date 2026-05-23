'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Bell, User, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-[var(--muted-foreground)]">
      <ol className="flex items-center gap-1">
        <li>
          <span className="capitalize">Home</span>
        </li>
        {segments.map((seg, i) => (
          <li key={i} className="flex items-center gap-1">
            <span>/</span>
            <span className="capitalize text-[var(--foreground)]">{seg.replace(/-/g, ' ')}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-6">
      <Breadcrumb />

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          className="relative rounded-full p-2 hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-full p-2 hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2 rounded-full pl-2 hover:bg-[var(--muted)] cursor-pointer">
          <div className="h-8 w-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)]">
            <User size={16} />
          </div>
          <LogOut size={16} className="mr-2 text-[var(--muted-foreground)]" />
        </div>
      </div>
    </header>
  );
}
