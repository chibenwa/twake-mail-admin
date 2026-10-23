import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useConfirmAppearance } from "@/components/custom/confirm-provider";

// Without any of them, the archival moves every event into the "Archival" calendar
export const ARCHIVAL_CRITERIA = ["createdBefore", "lastModifiedBefore", "masterDtStartBefore", "isRejected", "isNotRecurring"];

export const hasArchivalCriterion = (values: Record<string, string | boolean>) =>
  ARCHIVAL_CRITERIA.some((key) => !!values[key]);

interface Props {
  values: Record<string, string | boolean>;
  // What is moved without criteria: every user's events, or one user's
  message: string;
}

/**
 * Warns, while no criterion is set, that the archival moves every event, and turns the
 * confirm button into a red "Archive all events" meanwhile.
 */
export default function ArchivalNotice({ values, message }: Props) {
  const { t } = useTranslation();
  const setAppearance = useConfirmAppearance();
  const noCriterion = !hasArchivalCriterion(values);

  useEffect(() => {
    setAppearance(noCriterion
      ? { destructive: true, confirmLabel: t("commonTasks.archiveAllEvents") }
      : { destructive: false, confirmLabel: t("confirmTask.start") });
  }, [noCriterion, setAppearance, t]);

  if (!noCriterion) return null;
  return (
    <div role="status" className="flex gap-2 items-start rounded-md border border-amber-300 bg-amber-50 text-amber-900 p-3 text-sm">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
