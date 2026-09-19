import { AlertCircle, ArrowUpRight, CalendarClock, ChevronRight, CircleCheck, Clock3, Plus, Target, Trophy } from 'lucide-react';
import { Link } from 'wouter';
import { useGetDashboardSummary } from '@workspace/api-client-react';
import { getGetDashboardSummaryQueryKey } from '@workspace/api-client-react';
import { ApplicationDialog } from '@/components/application-dialog';
import { ApplicationRow } from '@/components/application-list';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { data: summary, isLoading, isError, refetch } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('paceboard-name')?.trim() || 'Morgan Chen');
  useEffect(() => {
    const syncDisplayName = () => setDisplayName(localStorage.getItem('paceboard-name')?.trim() || 'Morgan Chen');
    window.addEventListener('paceboard-name-change', syncDisplayName);
    return () => window.removeEventListener('paceboard-name-change', syncDisplayName);
  }, []);
  if (isLoading) return <DashboardSkeleton />;
  if (isError || !summary) return <ErrorState onRetry={() => refetch()} />;
  const maxCount = Math.max(...Object.values(summary.statusCounts), 1);
  const dueSoon = summary.recentApplications.filter((app) => app.followUpAt).slice(0, 3);
  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="rise-in flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
           <p className="font-data text-[10px] font-medium uppercase tracking-[.18em] text-primary">{formatToday()}</p>
           <h1 className="mt-2 font-display text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.02] tracking-[-.06em]">Keep the pace,<br /><span className="text-primary">{displayName}.</span></h1>
          <p className="mt-3 max-w-lg text-[13px] leading-6 text-muted-foreground">Your search has a shape now. Here is what needs your attention today.</p>
        </div>
        <Button className="w-fit rounded-xl px-4" onClick={() => setDialogOpen(true)} data-testid="button-add-application"><Plus /> Log application</Button>
      </div>
      <div className="rise-in rise-in-delay-1 mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard href="/applications" label="Total applications" value={summary.total} detail={`${summary.active} still in motion`} icon={Target} tone="mint" />
        <MetricCard href="/applications?filter=followups" label="Follow-ups due" value={summary.followUps} detail={summary.followUps ? 'Keep the thread warm' : 'Clear runway'} icon={CalendarClock} tone="amber" />
        <MetricCard href="/applications?status=Interviewing" label="In conversation" value={summary.interviews} detail="Interviewing now" icon={Clock3} tone="blue" />
        <MetricCard href="/applications?status=Offer" label="Offers" value={summary.offers} detail={summary.offers ? 'A strong signal' : 'Keep going'} icon={Trophy} tone="coral" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,.8fr)]">
        <section className="rise-in rise-in-delay-2 overflow-hidden rounded-2xl border border-card-border bg-card shadow-[0_8px_30px_rgba(24,43,64,.045)]">
          <div className="flex items-center justify-between border-b border-border px-5 py-5">
            <div><div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" /><h2 className="font-display text-[17px] font-bold tracking-[-.03em]">Recent activity</h2></div><p className="mt-1 text-xs text-muted-foreground">The latest moves in your pipeline.</p></div>
            <Link href="/applications" className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline" data-testid="link-view-all-applications">View all <ArrowUpRight className="size-3.5" /></Link>
          </div>
          {summary.recentApplications.length ? <div>{summary.recentApplications.slice(0, 5).map((application) => <ApplicationRow key={application.id} application={application} compact />)}</div> : <EmptyDashboard onAdd={() => setDialogOpen(true)} />}
        </section>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
          <section className="rise-in rise-in-delay-3 rounded-2xl border border-card-border bg-card p-5 shadow-[0_8px_30px_rgba(24,43,64,.045)]">
            <div className="flex items-start justify-between"><div><h2 className="font-display text-[17px] font-bold tracking-[-.03em]">Pipeline health</h2><p className="mt-1 text-xs text-muted-foreground">Where your energy sits.</p></div><div className="rounded-lg bg-secondary p-2 text-primary"><CircleCheck className="size-4" /></div></div>
            <div className="mt-5 space-y-4">{['Applied', 'Interviewing', 'Offer', 'Rejected'].map((status) => <div key={status}><div className="mb-1.5 flex justify-between text-[11px] font-semibold"><span className="text-muted-foreground">{status}</span><span className="font-data text-foreground">{summary.statusCounts[status] ?? 0}</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full transition-all ${status === 'Offer' ? 'bg-[#e4a53b]' : status === 'Interviewing' ? 'bg-[#438ac2]' : status === 'Rejected' ? 'bg-[#d6776c]' : 'bg-primary'}`} style={{ width: `${((summary.statusCounts[status] ?? 0) / maxCount) * 100}%` }} /></div></div>)}</div>
          </section>
          <section className="rise-in rise-in-delay-3 rounded-2xl border border-[#efd8ae] bg-[#fff8ea] p-5 shadow-[0_8px_30px_rgba(188,126,29,.06)]">
            <div className="flex items-start justify-between"><div><h2 className="font-display text-[17px] font-bold tracking-[-.03em] text-[#4f3b1e]">Next touches</h2><p className="mt-1 text-xs text-[#987b4e]">Small actions, real momentum.</p></div><div className="rounded-lg bg-[#f6dfae] p-2 text-[#ac711b]"><CalendarClock className="size-4" /></div></div>
            {dueSoon.length ? <div className="mt-4 divide-y divide-[#ecd7ad]">{dueSoon.map((app) => <div key={app.id} className="flex items-center justify-between py-3 first:pt-0"><div className="min-w-0"><p className="truncate text-xs font-bold text-[#594322]">{app.company}</p><p className="truncate text-[11px] text-[#a08456]">{app.role}</p></div><span className="font-data text-[10px] text-[#ad7521]">{app.followUpAt ? formatDueDate(app.followUpAt) : ''}</span></div>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-[#e6c987] px-3 py-4 text-center text-xs text-[#a08456]">No follow-ups scheduled.</div>}
            <Link href="/applications" className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#ad7521] hover:underline" data-testid="link-plan-followups">Plan a follow-up <ChevronRight className="size-3.5" /></Link>
          </section>
        </div>
      </div>
      <ApplicationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function MetricCard({ href, label, value, detail, icon: Icon, tone }: { href: string; label: string; value: number; detail: string; icon: typeof Target; tone: string }) {
  const colors: Record<string, string> = { mint: 'bg-[#d9eee6] text-[#257b61]', amber: 'bg-[#f7e4bc] text-[#ae741c]', blue: 'bg-[#dceaf4] text-[#337ba9]', coral: 'bg-[#f6dfdb] text-[#ba665b]' };
  return <Link href={href} aria-label={`View ${label.toLowerCase()}`} className="group block rounded-2xl border border-card-border bg-card p-4 shadow-[0_8px_30px_rgba(24,43,64,.035)] transition-transform hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_12px_34px_rgba(24,43,64,.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}><div className="flex items-start justify-between"><span className={`grid size-8 place-items-center rounded-lg ${colors[tone]}`}><Icon className="size-4" /></span><span className="font-data text-[10px] text-muted-foreground/55">VIEW</span></div><p className="mt-4 font-display text-[28px] font-bold tracking-[-.06em]">{value}</p><p className="mt-0.5 text-[11px] font-bold text-foreground">{label}</p><p className="mt-1 text-[11px] text-muted-foreground">{detail}</p></Link>;
}

function EmptyDashboard({ onAdd }: { onAdd: () => void }) { return <div className="px-6 py-16 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#d9eee6] text-primary"><Plus className="size-5" /></div><p className="mt-4 text-sm font-bold">Your pipeline starts here</p><p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-muted-foreground">Add the first opportunity and turn the blank page into a plan.</p><Button onClick={onAdd} variant="outline" size="sm" className="mt-4" data-testid="button-empty-add">Add your first application</Button></div>; }
function ErrorState({ onRetry }: { onRetry: () => void }) { return <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center"><div className="grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive"><AlertCircle className="size-5" /></div><h1 className="mt-4 font-display text-xl font-bold">Could not load your board</h1><p className="mt-2 text-sm text-muted-foreground">The connection took a wrong turn. Try again and we’ll pick up where you left off.</p><Button variant="outline" onClick={onRetry} className="mt-5" data-testid="button-retry-dashboard">Try again</Button></div>; }
function DashboardSkeleton() { return <div className="mx-auto max-w-[1440px]"><div className="shimmer h-24 w-80 rounded-xl" /><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="shimmer h-36 rounded-2xl" />)}</div><div className="mt-6 grid gap-6 xl:grid-cols-[1.65fr_.8fr]"><div className="shimmer h-[420px] rounded-2xl" /><div className="shimmer h-[420px] rounded-2xl" /></div></div>; }
 function formatToday() { return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()); }
 function formatDueDate(value: string | Date) {
   const date = value instanceof Date ? value : new Date(value.includes('T') ? value : `${value}T12:00:00`);
   return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
 }