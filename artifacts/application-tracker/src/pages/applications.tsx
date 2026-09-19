import { AlertCircle, ListFilter, Plus, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDeleteApplication, useListApplications, getGetDashboardSummaryQueryKey, getListApplicationsQueryKey } from '@workspace/api-client-react';
import type { Application } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { ApplicationDialog } from '@/components/application-dialog';
import { ApplicationTable } from '@/components/application-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const filters = ['All', 'Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn'];

export default function Applications() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const params = useMemo(() => ({ ...(status !== 'All' ? { status: status as 'Applied' | 'Interviewing' | 'Offer' | 'Rejected' | 'Withdrawn' } : {}), ...(search ? { search } : {}) }), [search, status]);
  const { data: applications = [], isLoading, isError, refetch } = useListApplications(params, { query: { queryKey: getListApplicationsQueryKey(params) } });
  const deleteApplication = useDeleteApplication();
  const clearFilters = () => { setSearch(''); setStatus('All'); };
  const confirmDelete = () => { if (!deleteTarget) return; deleteApplication.mutate({ id: deleteTarget.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); setDeleteTarget(null); } }); };
  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="rise-in flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="font-data text-[10px] uppercase tracking-[.18em] text-primary">Application library</p><h1 className="mt-2 font-display text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.02] tracking-[-.06em]">Your pipeline,<br /><span className="text-primary">in full.</span></h1><p className="mt-3 text-[13px] text-muted-foreground">Every opportunity, one calm place to keep moving.</p></div><Button onClick={() => setDialogOpen(true)} className="w-fit rounded-xl" data-testid="button-create-application"><Plus /> Add application</Button></div>
      <section className="rise-in rise-in-delay-1 mt-8 overflow-hidden rounded-2xl border border-card-border bg-card shadow-[0_8px_30px_rgba(24,43,64,.045)]">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 border-border bg-background pl-9 text-xs" placeholder="Search company or role" data-testid="input-search-applications" />{search && <button onClick={() => setSearch('')} className="absolute right-2 top-2 rounded p-0.5 text-muted-foreground hover:text-foreground" data-testid="button-clear-search"><X className="size-3.5" /></button>}</div><div className="flex items-center gap-2"><div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground"><SlidersHorizontal className="size-3.5" /> Filter</div><div className="flex gap-1 overflow-x-auto">{filters.map((filter) => <button key={filter} onClick={() => setStatus(filter)} className={`whitespace-nowrap rounded-lg px-2.5 py-2 text-[11px] font-bold transition-colors ${status === filter ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`} data-testid={`button-filter-${filter.toLowerCase()}`}>{filter}</button>)}</div></div></div>
        <div className="flex items-center justify-between px-5 py-3"><div className="flex items-center gap-2 text-[11px] text-muted-foreground"><ListFilter className="size-3.5" /><span><strong className="text-foreground">{applications.length}</strong> {applications.length === 1 ? 'application' : 'applications'}</span></div>{(status !== 'All' || search) && <button className="text-[11px] font-bold text-primary hover:underline" onClick={clearFilters} data-testid="button-clear-filters">Clear filters</button>}</div>
        {isLoading ? <TableSkeleton /> : isError ? <LoadError onRetry={() => refetch()} /> : <ApplicationTable applications={applications} onDelete={setDeleteTarget} />}
      </section>
      <ApplicationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}><DialogContent className="max-w-md border-card-border bg-card"><DialogHeader><DialogTitle className="font-display text-xl tracking-[-.03em]">Remove this application?</DialogTitle><DialogDescription>This will permanently remove <strong>{deleteTarget?.company}</strong> from your pipeline. This cannot be undone.</DialogDescription></DialogHeader><DialogFooter><Button variant="ghost" onClick={() => setDeleteTarget(null)} data-testid="button-cancel-delete">Keep it</Button><Button variant="destructive" onClick={confirmDelete} disabled={deleteApplication.isPending} data-testid="button-confirm-delete"><Trash2 />{deleteApplication.isPending ? 'Removing…' : 'Remove application'}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

function TableSkeleton() { return <div className="space-y-px">{[1, 2, 3, 4, 5].map((item) => <div key={item} className="shimmer mx-5 h-[68px] rounded-lg" />)}</div>; }
function LoadError({ onRetry }: { onRetry: () => void }) { return <div className="flex flex-col items-center px-6 py-16 text-center"><div className="grid size-11 place-items-center rounded-2xl bg-destructive/10 text-destructive"><AlertCircle className="size-5" /></div><p className="mt-4 text-sm font-bold">Applications could not be loaded</p><p className="mt-1 text-xs text-muted-foreground">Try again in a moment.</p><Button onClick={onRetry} size="sm" variant="outline" className="mt-4" data-testid="button-retry-applications">Try again</Button></div>; }