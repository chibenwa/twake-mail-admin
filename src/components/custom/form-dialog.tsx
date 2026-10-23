import { FormEvent, ReactNode, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ErrorDisplayer from "./error-displayer";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  submitDisabled?: boolean;
  // Checked before submitting: the message to show in the modal, or null when the values are fine
  validate?: () => string | null;
  // Throws to keep the modal open with the typed values and show why
  onSubmit: () => Promise<unknown> | unknown;
  children: ReactNode;
  className?: string;
}

/**
 * The modal every "create" or "add" action of a list opens: its fields, Enter to submit,
 * and a refusal shown in it, the typed values kept, instead of a toast that loses them.
 */
export default function FormDialog({ open, onClose, title, submitLabel, submitDisabled, validate, onSubmit, children, className }: Props) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [invalid, setInvalid] = useState<string | null>(null);

  const close = () => {
    if (submitting) return;
    setError(null);
    setInvalid(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitDisabled || submitting) return;
    const problem = validate?.() ?? null;
    setInvalid(problem);
    if (problem) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit();
      setError(null);
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
      <DialogContent className={className ?? "max-w-md"} aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {/* Our own messages rather than the browser's validation bubbles */}
        <form noValidate onSubmit={handleSubmit} onChange={() => { setError(null); setInvalid(null); }} className="space-y-3">
          {children}
          {invalid && <p role="alert" className="text-sm text-red-600">{invalid}</p>}
          {error !== null && <div role="alert" className="text-sm text-red-600"><ErrorDisplayer error={error} /></div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={close} disabled={submitting}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={submitting || submitDisabled}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const FIELD_CLASS = "w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500";
