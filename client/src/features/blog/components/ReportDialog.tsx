import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { Modal } from '@/components/ui/Modal';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useReport } from '../comments';
import { REPORT_REASONS, type ReportReason, type ReportTarget } from '../types';

// Report a post or comment (per the design): pick a reason, optional details, done.
export function ReportDialog({ target, onClose }: { target: ReportTarget | null; onClose: () => void }) {
  return (
    <Modal open={!!target} onClose={onClose} title={target ? `Report ${target.type}` : 'Report'}>
      {target && <ReportForm key={target.id} target={target} onClose={onClose} />}
    </Modal>
  );
}

function ReportForm({ target, onClose }: { target: ReportTarget; onClose: () => void }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const report = useReport();

  if (report.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
        <span className="flex size-13 items-center justify-center rounded-full bg-success/10 text-success">
          <Check size={24} strokeWidth={2.5} />
        </span>
        <p className="text-base font-bold text-text-primary">{report.data.alreadyReported ? 'Already reported' : 'Report submitted'}</p>
        <p className="text-[13px] leading-relaxed text-text-secondary">
          Thanks for letting us know. Our moderators review every report and act on anything that breaks the community guidelines.
        </p>
        <Button variant="outline" onClick={onClose} className="mt-1">
          Done
        </Button>
      </div>
    );
  }

  const needsDetails = reason === 'Other' && details.trim().length < 3;
  return (
    <div className="flex flex-col gap-3 p-5">
      <p className="text-[13px] leading-relaxed text-text-secondary">
        What's wrong with this {target.type}? Your report is anonymous — {target.type === 'user' ? 'they' : target.type === 'message' ? 'the sender' : 'the author'} won't be told who sent it.
      </p>
      <div role="radiogroup" aria-label="Reason" className="flex flex-col gap-2">
        {REPORT_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={reason === r}
            onClick={() => setReason(r)}
            className={cn(
              'flex items-center gap-3 rounded-xl border-[1.5px] px-3.5 py-2.5 text-left text-sm transition-colors',
              reason === r ? 'border-primary bg-primary/6 font-semibold text-text-primary' : 'border-border bg-bg text-text-primary hover:border-primary/30',
            )}
          >
            <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full border-2', reason === r ? 'border-primary bg-primary' : 'border-border')}>
              {reason === r && <span className="size-2 rounded-full bg-white" />}
            </span>
            {r}
          </button>
        ))}
      </div>
      {reason && (
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={500}
          rows={3}
          aria-label="Details"
          placeholder={reason === 'Other' ? 'Please describe the problem…' : 'Anything else we should know? (optional)'}
          className="w-full resize-none rounded-xl border-[1.5px] border-border bg-card px-3.5 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary"
        />
      )}
      {report.isError && <FormAlert>{errorMessage(report.error)}</FormAlert>}
      <Button
        variant="danger"
        fullWidth
        disabled={!reason || needsDetails}
        loading={report.isPending}
        onClick={() => reason && report.mutate({ target, reason, details: details.trim() })}
      >
        Submit report
      </Button>
    </div>
  );
}
