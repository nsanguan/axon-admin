'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-[var(--muted-foreground)]">
      <ol className="flex items-center gap-1">
        <li><span className="capitalize">Home</span></li>
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
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Real unread notification count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['notifications-unread'],
    queryFn: () => apiClient.get('/notifications/unread-count').then((r) => r.data),
    refetchInterval: 30_000,
    retry: false,
  });
  const unreadCount = unreadData?.count ?? 0;

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-6">
      <Breadcrumb />

      <div className="flex items-center gap-3">
        {/* Notifications bell */}
        <button
          onClick={() => router.push('/notifications')}
          className="relative rounded-full p-2 hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-full p-2 hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-[var(--muted)] cursor-pointer"
          >
            <div className="h-8 w-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] text-sm font-semibold">
              {user ? initials : <User size={16} />}
            </div>
            {user && (
              <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate">
                {user.name || user.email}
              </span>
            )}
            <ChevronDown size={14} className="text-[var(--muted-foreground)]" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-lg z-50 py-1">
              <div className="px-4 py-2 border-b border-[var(--border)]">
                <p className="text-sm font-medium truncate">{user?.name || '—'}</p>
                <p className="text-xs text-[var(--muted-foreground)] truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setMenuOpen(false); router.push('/users/profile'); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--muted)] text-left"
              >
                <User size={14} /> My Profile
              </button>
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--muted)] text-left text-red-600"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
