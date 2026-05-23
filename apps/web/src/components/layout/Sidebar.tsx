'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Puzzle,
  Wrench,
  FlaskConical,
  Shield,
  Bell,
  Settings,
  Users,
  Activity,
  Brain,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/plugins', icon: Puzzle, label: 'Plugins' },
  { href: '/tools', icon: Wrench, label: 'Tools' },
  { href: '/testing', icon: FlaskConical, label: 'Testing Console' },
  { href: '/tokens', icon: Shield, label: 'Tokens & Security' },
  { href: '/logs', icon: Activity, label: 'Logs & Monitoring' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/axon', icon: Brain, label: 'AXON System' },
  { href: '/users', icon: Users, label: 'Users & Roles' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-[var(--border)] bg-[var(--background)] transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[var(--border)]">
        {!collapsed && (
          <span className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            AXON Admin
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto rounded p-1 hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                    collapsed && 'justify-center px-2',
                  )}
                >
                  <Icon size={18} />
                  {!collapsed && <span>{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
