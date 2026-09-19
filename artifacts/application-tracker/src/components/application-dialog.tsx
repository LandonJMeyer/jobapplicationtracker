import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, Plus, Save } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateApplication, useUpdateApplication, getListApplicationsQueryKey, getGetDashboardSummaryQueryKey } from '@workspace/api-client-react';
import type { Application, ApplicationInput } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type FormValues = {
  company: string;
  role: string;
  location: string;
  type: ApplicationInput['type'];
  status: ApplicationInput['status'];
  submittedAt: string;
  followUpAt: string;
  link: string;
  notes: string;
};

const emptyForm: FormValues = { company: '', role: '', location: '', type: 'Full-time', status: 'Applied', submittedAt: new Date().toISOString().slice(0, 10), followUpAt: '', link: '', notes: '' };

export function ApplicationDialog({ application, open, onOpenChange }: { application?: Application | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [error, setError] = useState('');
  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();
  const isEditing = Boolean(application);
  const isPending = createApplication.isPending || updateApplication.isPending;

  useEffect(() => {
    if (open) {
      setError('');
      setForm(application ? {
        company: application.company, role: application.role, location: application.location, type: application.type, status: application.status,
        submittedAt: application.submittedAt.slice(0, 10), followUpAt: application.followUpAt?.slice(0, 10) ?? '', link: application.link ?? '', notes: application.notes ?? '',
      } : emptyForm);
    }
  }, [open, application]);

  const setField = (field: keyof FormValues, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.company.trim() || !form.role.trim()) {
      setError('Company and role are required to save an application.');
      return;
    }
    const data = { ...form, company: form.company.trim(), role: form.role.trim(), followUpAt: form.followUpAt || null, link: form.link || null, notes: form.notes || null } as ApplicationInput;
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      onOpenChange(false);
    };
    if (application) updateApplication.mutate({ id: application.id, data }, { onSuccess, onError: () => setError('Could not update this application. Try again.') });
    else createApplication.mutate({ data }, { onSuccess, onError: () => setError('Could not save this application. Try again.') });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-card-border bg-card p-0">
        <form onSubmit={submit}>
          <DialogHeader className="border-b border-border bg-secondary/45 px-6 py-5 text-left">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-primary"><span className="size-1.5 rounded-full bg-primary" />{isEditing ? 'Edit record' : 'New record'}</div>
            <DialogTitle className="font-display text-2xl tracking-[-.04em]">{isEditing ? 'Keep this one current' : 'Log a new opportunity'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Capture the signal now. You can refine the details as the process moves.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 px-6 py-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company" required><Input value={form.company} onChange={(e) => setField('company', e.target.value)} placeholder="e.g. Linear" data-testid="input-company" autoFocus /></Field>
              <Field label="Role" required><Input value={form.role} onChange={(e) => setField('role', e.target.value)} placeholder="e.g. Product Designer" data-testid="input-role" /></Field>
              <Field label="Location"><Input value={form.location} onChange={(e) => setField('location', e.target.value)} placeholder="Remote / New York" data-testid="input-location" /></Field>
              <Field label="Application type"><select className="field-select" value={form.type} onChange={(e) => setField('type', e.target.value)} data-testid="select-type">{['Full-time', 'Internship', 'Contract', 'Part-time'].map((option) => <option key={option}>{option}</option>)}</select></Field>
              <Field label="Status"><select className="field-select" value={form.status} onChange={(e) => setField('status', e.target.value)} data-testid="select-status">{['Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn'].map((option) => <option key={option}>{option}</option>)}</select></Field>
              <Field label="Submitted"><Input type="date" value={form.submittedAt} onChange={(e) => setField('submittedAt', e.target.value)} data-testid="input-submitted-at" /></Field>
              <Field label="Follow-up date"><Input type="date" value={form.followUpAt} onChange={(e) => setField('followUpAt', e.target.value)} data-testid="input-follow-up-at" /></Field>
              <Field label="Link"><div className="relative"><ExternalLink className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input className="pl-9" value={form.link} onChange={(e) => setField('link', e.target.value)} placeholder="https://" data-testid="input-link" /></div></Field>
            </div>
            <Field label="Notes"><Textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="What is worth remembering?" className="min-h-[84px] resize-none" data-testid="input-notes" /></Field>
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive" data-testid="status-form-error">{error}</p>}
          </div>
          <DialogFooter className="border-t border-border bg-secondary/25 px-6 py-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} data-testid="button-cancel-application">Cancel</Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-application">{isPending ? <Loader2 className="animate-spin" /> : isEditing ? <Save /> : <Plus />}{isEditing ? 'Save changes' : 'Add application'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-[.1em] text-muted-foreground"><span>{label}{required && <span className="ml-1 text-primary">*</span>}</span>{children}</label>;
}