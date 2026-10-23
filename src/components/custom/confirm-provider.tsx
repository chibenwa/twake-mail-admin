import { createContext, useContext, useId, useRef, useState, ReactNode } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useReturnFocus } from "@/hooks/use-return-focus";
import ErrorDisplayer from "./error-displayer";

/**
 * Checks the dialog content when "Confirm" is clicked. Returns the error to show in the
 * dialog, which then stays open with its content, false to keep it open without a message
 * when the content already reports the problem, or null to let the dialog close.
 */
export type ConfirmValidator = () => string | false | null;

/**
 * Sends the confirmed request while the dialog stays open. The dialog closes once it
 * succeeds; when it fails, the error is shown in the dialog, which keeps its content
 * so that it can be corrected and confirmed again.
 */
export type ConfirmAction = () => Promise<unknown>;

/** How the confirm button looks, which the dialog content can change while the operator types. */
export interface ConfirmAppearance {
  /**
   * Irreversible action: red confirm button, initial focus on "Cancel" (or on the
   * type-to-confirm field), so that Enter right after opening does not run it.
   */
  destructive?: boolean;
  /** Replaces "Confirm" with a verb naming the action. */
  confirmLabel?: string;
  /** What will be lost, shown above the message in a red-bordered block. */
  consequence?: ReactNode;
}

export interface ConfirmOptions extends ConfirmAppearance {
  message: string | ReactNode;
  header: string;
  className?: string;
  validate?: ConfirmValidator;
  action?: ConfirmAction;
  /** The confirm button stays disabled until this text is typed (surrounding spaces ignored). */
  typeToConfirm?: string;
  /** Compares the typed text case-insensitively: user names, domains. */
  typeToConfirmIgnoreCase?: boolean;
}

export interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  pending: boolean;
  error: ReactNode | null;
  resolve: ((value: boolean) => void) | null;
}

export interface ConfirmContextType {
  (options: ConfirmOptions): Promise<boolean>;
}

export const ConfirmContext = createContext<ConfirmContextType | null>(null);

const ConfirmAppearanceContext = createContext<((appearance: ConfirmAppearance) => void) | null>(null);

/**
 * Lets the content of a confirm dialog change its confirm button, e.g. turn it red with
 * another label while the typed parameters make the action irreversible.
 */
export function useConfirmAppearance(): (appearance: ConfirmAppearance) => void {
  return useContext(ConfirmAppearanceContext) ?? (() => {});
}

export const matchesTypeToConfirm = (typed: string, expected: string, ignoreCase = false): boolean =>
  ignoreCase ? typed.trim().toLowerCase() === expected.trim().toLowerCase() : typed.trim() === expected.trim();

const CLOSED_STATE: ConfirmState = { isOpen: false, pending: false, message: '', header: '', error: null, resolve: null };

interface ConfirmProviderProps {
  children: ReactNode;
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const { t } = useTranslation();
  const [confirmState, setConfirmState] = useState<ConfirmState>(CLOSED_STATE);
  const [typed, setTyped] = useState("");
  const { rememberFocus, restoreFocus } = useReturnFocus();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const typeRef = useRef<HTMLInputElement>(null);
  const typeId = useId();

  const confirm: ConfirmContextType = (options: ConfirmOptions) => {
    rememberFocus();
    setTyped("");
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...options, isOpen: true, pending: false, error: null, resolve });
    });
  };

  const setAppearance = (appearance: ConfirmAppearance) =>
    setConfirmState((current) => (current.isOpen ? { ...current, ...appearance } : current));

  const handleClose = (result: boolean) => {
    confirmState.resolve?.(result);
    setConfirmState(CLOSED_STATE);
  };

  const showError = (error: ReactNode) => setConfirmState((current) => ({ ...current, pending: false, error }));

  const runAction = async (action: ConfirmAction) => {
    setConfirmState((current) => ({ ...current, pending: true, error: null }));
    try {
      await action();
      handleClose(true);
    } catch (err) {
      showError(<ErrorDisplayer error={err} />);
    }
  };

  const typedMatches = confirmState.typeToConfirm === undefined
    || matchesTypeToConfirm(typed, confirmState.typeToConfirm, confirmState.typeToConfirmIgnoreCase);

  const handleConfirm = () => {
    if (!typedMatches) return;
    const error = confirmState.validate?.() ?? null;
    if (error === false) return;
    if (error) {
      showError(error);
      return;
    }
    if (confirmState.action) {
      runAction(confirmState.action);
      return;
    }
    handleClose(true);
  };

  // A request in flight can no longer be cancelled: wait for its outcome.
  const handleCancel = () => {
    if (!confirmState.pending) handleClose(false);
  };

  // Any edit of the content may fix the reported problem: the error is re-checked on the next confirm.
  const clearError = () => setConfirmState((current) => (current.error ? { ...current, error: null } : current));

  // A destructive dialog never opens with the focus on a field or on the confirm button
  const handleOpenAutoFocus = (event: Event) => {
    const target = confirmState.typeToConfirm !== undefined ? typeRef.current
      : confirmState.destructive ? cancelRef.current
      : null;
    if (!target) return;
    event.preventDefault();
    target.focus();
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={confirmState.isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className={confirmState.className} onOpenAutoFocus={handleOpenAutoFocus} onCloseAutoFocus={restoreFocus}>
          <DialogHeader>
            <DialogTitle>{confirmState.header}</DialogTitle>
          </DialogHeader>
          {confirmState.consequence && (
            <div className="flex gap-2 items-start border-l-4 border-red-600 bg-red-50 text-red-900 p-3 text-sm">
              <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div>{confirmState.consequence}</div>
            </div>
          )}
          <ConfirmAppearanceContext.Provider value={setAppearance}>
            <div className="contents" onChange={clearError}>
              { typeof confirmState.message === 'string' ? <p>{confirmState.message}</p> : confirmState.message }
            </div>
          </ConfirmAppearanceContext.Provider>
          {confirmState.typeToConfirm !== undefined && (
            <div>
              <label htmlFor={typeId} className="text-sm font-medium">
                {t("confirm.typeToConfirm", { value: confirmState.typeToConfirm })}
              </label>
              <input
                id={typeId}
                ref={typeRef}
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); }}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}
          {confirmState.error && <div role="alert" className="text-sm text-red-600">{confirmState.error}</div>}
          <DialogFooter>
            <Button ref={cancelRef} variant="outline" disabled={confirmState.pending} onClick={handleCancel}>{t("common.cancel")}</Button>
            <Button
              className="mb-4 md:mb-0"
              variant={confirmState.destructive ? "destructive" : "default"}
              disabled={confirmState.pending || !typedMatches}
              onClick={handleConfirm}
            >
              {confirmState.pending && <Loader2 className="animate-spin" />}
              {confirmState.confirmLabel ?? t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
