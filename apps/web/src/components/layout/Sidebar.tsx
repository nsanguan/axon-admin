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
  GitBranch,
  Bot,
  HandMetal,
  BookOpen,
  UserCircle,
  Radio,
  ListFilter,
  Server,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  children?: { href: string; icon: React.ElementType; label: string }[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/plugins', icon: Puzzle, label: 'Plugins' },
  { href: '/tools', icon: Wrench, label: 'Tools' },
  {
    href: '/testing',
    icon: FlaskConical,
    label: 'Testing Console',
    children: [
      { href: '/testing/orchestrator', icon: GitBranch, label: 'Pipeline Tester' },
      { href: '/testing/pydantic-ai', icon: Bot, label: 'AI Agent Tester' },
    ],
  },
  { href: '/tokens', icon: Shield, label: 'Tokens & Security' },
  { href: '/logs', icon: Activity, label: 'Logs & Monitoring' },
  {
    href: '/notifications',
    icon: Bell,
    label: 'Notifications',
    children: [
      { href: '/notifications/channels', icon: Radio, label: 'Channel Config' },
      { href: '/notifications/rules', icon: ListFilter, label: 'Rules' },
    ],
  },
  {
    href: '/axon',
    icon: Brain,
    label: 'AXON System',
    children: [
      { href: '/axon/orchestrator', icon: GitBranch, label: 'Orchestrator' },
      { href: '/axon/hitl', icon: HandMetal, label: 'HITL Queue' },
      { href: '/axon/experience', icon: BookOpen, label: 'Experience Ledger' },
      { href: '/axon/supply-chain', icon: Truck, label: 'Supply Chain Plan' },
    ],
  },
  {
    href: '/users',
    icon: Users,
    label: 'Users & Roles',
    children: [
      { href: '/users/profile', icon: UserCircle, label: 'My Profile' },
      { href: '/users/roles', icon: ShieldCheck, label: 'Roles & Permissions' },
    ],
  },
  {
    href: '/settings',
    icon: Settings,
    label: 'Settings',
    children: [
      { href: '/settings/environments', icon: Server, label: 'Environments' },
    ],
  },
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
          {navItems.map(({ href, icon: Icon, label, children }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href) && !children);
            const parentActive = children ? pathname.startsWith(href) : false;
            return (
              <li key={href}>
                <Link
                  href={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    (active || parentActive)
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                    collapsed && 'justify-center px-2',
                  )}
                >
                  <Icon size={18} />
                  {!collapsed && <span>{label}</span>}
                </Link>
                {/* Sub-nav */}
                {!collapsed && children && parentActive && (
                  <ul className="mt-1 space-y-0.5 pl-9">
                    {children.map(({ href: childHref, icon: ChildIcon, label: childLabel }) => {
                      const childActive = pathname.startsWith(childHref);
                      return (
                        <li key={childHref}>
                          <Link
                            href={childHref}
                            className={cn(
                              'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                              childActive
                                ? 'bg-[var(--primary)]/20 text-[var(--primary)]'
                                : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                            )}
                          >
                            <ChildIcon size={14} />
                            {childLabel}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
