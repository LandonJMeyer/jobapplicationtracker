import { ExternalLink, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Application } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { ApplicationDialog } from '@/components/application-dialog';

const statusStyle: Record<string, string> = {
  Applied: 'status-applied', Interviewing: 'status-interviewing', Offer: 'status-offer', Rejected: 'status-rejected', Withdrawn: 'status-withdrawn',
};

export function StatusPill({ status }: { status: string }) {
  return <span className={`status-pill ${statusStyle[status] ?? 'status-applied'}`} data-testid={`status-application-${status.toLowerCase()}`}><span className="size-1.5 rounded-full bg-current" />{status}</span>;
}

export function ApplicationRow({ application, onDelete, compact = false }: { application: Application; onDelete?: (application: Application) => void; compact?: boolean }) {
  const [editOpen, setEditOpen] = useState(false);
  return (
    <>
      <div className={`group grid grid-cols-[minmax(180px,1.8fr)_minmax(130px,1.1fr)_120px_118px_94px_44px] items-center gap-3 border-b border-border/70 px-5 py-4 transition-colors last:border-0 hover:bg-secondary/35 ${compact ? 'grid-cols-[minmax(170px,1.7fr)_110px_106px_30px]' : ''}`} data-testid={`row-application-${application.id}`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#d9eee6] font-display text-[10px] font-bold text-[#22765d]">{application.company.slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0"><p className="truncate text-[13px] font-bold text-foreground">{application.company}</p><p className="truncate text-[11px] text-muted-foreground">{application.role}</p></div>
          </div>
        </div>
        {!compact && <span className="truncate text-[12px] text-muted-foreground">{application.location || 'Location not set'}<br /><span className="font-data text-[10px] text-muted-foreground/70">{application.type}</span></span>}
        {!compact && <span className="font-data text-[11px] text-muted-foreground">{formatDate(application.submittedAt)}</span>}
        <span>{!compact && <StatusPill status={application.status} />}{compact && <StatusPill status={application.status} />}</span>
        {!compact && <span className={`text-[11px] font-semibold ${application.followUpAt ? 'text-[#c17b1c]' : 'text-muted-foreground/60'}`}>{application.followUpAt ? formatDate(application.followUpAt) : '—'}</span>}
        <div className="flex justify-end gap-1 opacity-50 transition-opacity group-hover:opacity-100">
          {application.link && <a href={application.link} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary" data-testid={`link-application-${application.id}`} aria-label={`Open ${application.company} link`}><ExternalLink className="size-3.5" /></a>}
          {!compact && <><button onClick={() => setEditOpen(true)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary" data-testid={`button-edit-application-${application.id}`} aria-label={`Edit ${application.company}`}><Pencil className="size-3.5" /></button><button onClick={() => onDelete?.(application)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" data-testid={`button-delete-application-${application.id}`} aria-label={`Delete ${application.company}`}><Trash2 className="size-3.5" /></button></>}
          {compact && <MoreHorizontal className="m-2 size-3.5 text-muted-foreground" />}
        </div>
      </div>
      <ApplicationDialog application={application} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}

export function ApplicationTable({ applications, onDelete, emptyMessage = 'No applications match your search.' }: { applications: Application[]; onDelete?: (application: Application) => void; emptyMessage?: string }) {
  if (!applications.length) return <div className="px-6 py-16 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground"><MoreHorizontal className="size-5" /></div><p className="mt-4 text-sm font-bold">Nothing here yet</p><p className="mt-1 text-xs text-muted-foreground">{emptyMessage}</p></div>;
  return <div className="overflow-x-auto"><div className="min-w-[720px]"><div className="grid grid-cols-[minmax(180px,1.8fr)_minmax(130px,1.1fr)_120px_118px_94px_44px] gap-3 border-b border-border bg-secondary/25 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground"><span>Company / role</span><span>Where</span><span>Applied</span><span>Status</span><span>Next touch</span><span /></div>{applications.map((application) => <ApplicationRow key={application.id} application={application} onDelete={onDelete} />)}</div></div>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value)); }