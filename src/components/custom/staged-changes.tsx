import { useTranslation } from "react-i18next";
import { useConfirm } from "@/hooks/use-confirm";

/**
 * Dialogs that stage changes before an Apply (calendar delegation, address book sharing,
 * team calendar members): nothing typed or staged is lost silently.
 */

/** Closes the dialog, after asking first when changes would be lost. */
export function useDiscardGuard(changeCount: number, onClose: () => void): () => Promise<void> {
  const { t } = useTranslation();
  const confirm = useConfirm();
  return async () => {
    if (changeCount === 0) {
      onClose();
      return;
    }
    const discard = await confirm({
      header: t("common.discardTitle"),
      message: t("common.discardMessage", { count: changeCount }),
      destructive: true,
      confirmLabel: t("common.discard"),
      cancelLabel: t("common.keepEditing"),
    });
    if (discard) onClose();
  };
}

// An address typed in the add field but neither added nor valid blocks the save
export const blocksSave = (typed: string, addable: boolean) => typed.trim() !== "" && !addable;

/** Under the add field: why Apply waits, and how many changes it will save. */
export function StagedChangesNotice({ count, blocking }: { count: number; blocking: boolean }) {
  const { t } = useTranslation();
  return (
    <>
      {blocking && <p className="text-xs text-orange-600">{t("common.addOrClearPending")}</p>}
      {count > 0 && <p className="text-xs text-muted-foreground">{t("common.pendingChanges", { count })}</p>}
    </>
  );
}
