import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { Modal } from '@/components/ui/Modal';

// The admin's shared confirmation (per the design): says exactly what will happen; error-red confirm;
// an optional reason that the person sees when they try to log in, and that goes in the audit log.
export function ReasonDialog({
  open,
  title,
  body,
  confirmLabel,
  withReason = false,
  danger = true,
  loading,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  withReason?: boolean;
  danger?: boolean;
  loading?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const close = () => (setReason(''), onCancel());
  return (
    <Modal open={open} onClose={close} title={title}>
      <div className="flex flex-col gap-3 p-5">
        <p className="text-sm leading-relaxed text-text-secondary">{body}</p>
        {withReason && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-text-secondary">Reason (shown to them when they try to sign in)</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="e.g. Repeated spam in the Design Guild"
              className="resize-none rounded-md border-[1.5px] border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
        )}
        {error && <FormAlert>{error}</FormAlert>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={() => onConfirm(reason.trim())}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
