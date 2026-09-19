import { type ReactNode } from 'react';
import { BarChart3, BriefcaseBusiness, ChevronRight, CircleHelp, Menu, Settings2, Sparkles, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/', label: 'Overview', icon: BarChart3 },
  { href: '/applications', label: 'Applications', icon: BriefcaseBusiness },
  { href: '/settings', label: 'Preferences', icon: Settings2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('paceboard-name')?.trim() || 'Morgan Chen');
  useEffect(() => {
    const syncDisplayName = () => setDisplayName(localStorage.getItem('paceboard-name')?.trim() || 'Morgan Chen');
    window.addEventListener('paceboard-name-change', syncDisplayName);
    return () => window.removeEventListener('paceboard-name-change', syncDisplayName);
  }, []);
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform duration-300 md:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-3">
          <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
            <span className="grid size-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <Sparkles className="size-[18px]" />
            </span>
            <span className="font-display text-[17px] font-bold tracking-[-.03em] text-white">Paceboard</span>
          </Link>
          <button className="rounded-lg p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white md:hidden" onClick={() => setMenuOpen(false)} data-testid="button-close-menu" aria-label="Close navigation">
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-10 px-3 text-[10px] font-bold uppercase tracking-[.17em] text-sidebar-foreground/45">Workspace</div>
        <nav className="mt-3 space-y-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === '/' ? location === '/' : location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold transition-colors ${active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`} data-testid={`link-nav-${item.label.toLowerCase()}`}>
                <Icon className="size-[17px]" />
                <span>{item.label}</span>
                {active && <ChevronRight className="ml-auto size-3.5 opacity-70" />}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <div className="mb-4 rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-4">
            <div className="flex items-center gap-2 text-sidebar-primary">
              <span className="size-1.5 rounded-full bg-sidebar-primary" />
              <span className="font-data text-[10px] uppercase tracking-[.16em]">Momentum mode</span>
            </div>
            <p className="mt-3 text-[12px] leading-5 text-sidebar-foreground/70">Keep the next step visible. Small updates compound.</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl px-2 py-2.5">
            <div className="grid size-9 place-items-center rounded-full bg-[#e7b97a] font-display text-xs font-bold text-[#26384b]">MC</div>
            <div className="min-w-0">
               <p className="truncate text-[12px] font-bold text-white">{displayName}</p>
               <p className="text-[11px] text-sidebar-foreground/50">{displayName} workspace</p>
            </div>
            <span className="ml-auto rounded-md p-1 text-sidebar-foreground/50" title="Help center">
              <CircleHelp className="size-4" />
            </span>
          </div>
        </div>
      </aside>
      {menuOpen && <button className="fixed inset-0 z-30 bg-[#102238]/40 md:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu overlay" data-testid="button-menu-overlay" />}
      <div className="md:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border/80 bg-background/90 px-5 backdrop-blur-md md:px-9">
          <button className="rounded-xl border border-border bg-card p-2 text-muted-foreground hover:text-foreground md:hidden" onClick={() => setMenuOpen(true)} data-testid="button-open-menu" aria-label="Open navigation">
            <Menu className="size-5" />
          </button>
          <div className="hidden items-center gap-2 text-[11px] font-semibold text-muted-foreground md:flex">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>Personal command center</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
             <span className="hidden font-data text-[10px] uppercase tracking-[.13em] text-muted-foreground sm:block">{formatSearchPeriod()}</span>
            <Link href="/applications" className="rounded-lg bg-primary px-3.5 py-2 text-[12px] font-bold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5" data-testid="link-header-add">Add application</Link>
          </div>
        </header>
        <main className="app-shell-grid min-h-[calc(100dvh-68px)] px-5 py-7 md:px-9 md:py-9">{children}</main>
      </div>
    </div>
  );
}

function formatSearchPeriod() {
  return `${new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short' }).format(new Date()).toLowerCase()} / active search`;
}