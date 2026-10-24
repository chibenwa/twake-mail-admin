import { FormEvent, ReactNode, useState } from "react";
import { useReturnFocus } from "@/hooks/use-return-focus";
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
  // Throws to keep the modal open with the typed values and show why; returns false to keep it
  // open silently, e.g. when the operator declined a confirmation it asked for
  onSubmit: () => Promise<unknown> | unknown;
  children: ReactNode;
  className?: string;
}

/**
 * The modal every "create" or "add" action of a list opens: its fields, Enter to submit,
 * and a refusal shown in it, the typed values kept, instead of a toast that loses them.
 */
/**
 * The submission of a form: checked first, then sent, a refusal kept to be shown. `submit`
 * resolves true once the form can close.
 */
function useSubmission(validate: Props["validate"], onSubmit: Props["onSubmit"]) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [invalid, setInvalid] = useState<string | null>(null);

  const clear = () => {
    setError(null);
    setInvalid(null);
  };

  const submit = async (): Promise<boolean> => {
    const problem = validate?.() ?? null;
    setInvalid(problem);
    if (problem) return false;
    setSubmitting(true);
    setError(null);
    try {
      return (await onSubmit()) !== false;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { submitting, error, invalid, clear, submit };
}

function Problems({ invalid, error }: { invalid: string | null; error: unknown }) {
  return (
    <>
      {invalid && <p role="alert" className="text-sm text-red-600">{invalid}</p>}
      {error !== null && <div role="alert" className="text-sm text-red-600"><ErrorDisplayer error={error} /></div>}
    </>
  );
}

export default function FormDialog({ open, onClose, title, submitLabel, submitDisabled, validate, onSubmit, children, className }: Props) {
  const { t } = useTranslation();
  const { submitting, error, invalid, clear, submit } = useSubmission(validate, onSubmit);
  const { rememberFocus, restoreFocus } = useReturnFocus();
  // Read while rendering the opening: an autoFocus field takes the focus as soon as it mounts
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) rememberFocus();
  }

  const close = () => {
    if (submitting) return;
    clear();
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitDisabled || submitting) return;
    if (await submit()) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
      <DialogContent className={className ?? "max-w-md"} aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {/* Our own messages rather than the browser's validation bubbles */}
        <form noValidate onSubmit={handleSubmit} onChange={clear} className="space-y-3">
          {children}
          <Problems invalid={invalid} error={error} />
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
