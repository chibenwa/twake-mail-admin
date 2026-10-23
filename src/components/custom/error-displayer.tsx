import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toErrorMessage } from "./error-message";

interface Props {
  error: unknown;
}

/**
 * The error a server returned, as it returned it: untranslated, so it is labelled as such,
 * and selectable so that it can be copied into a ticket.
 */
const ErrorDisplayer: React.FC<Props> = ({ error }) => {
  const { t } = useTranslation();
  const { message, details } = useMemo(() => toErrorMessage(error), [error]);

  return (
    <div
      className="max-h-[300px] max-w-[330px] overflow-auto break-words select-text cursor-text"
      // In a toast, dragging would swipe it away instead of selecting the text
      onPointerDown={(e) => e.stopPropagation()}
    >
      <p className="text-xs font-medium opacity-80">{t("common.serverMessage")}</p>
      <p>{message}</p>
      {details && <p className="mt-1 text-xs opacity-80">{details}</p>}
    </div>
  );
};

export default ErrorDisplayer;
