import { useTranslation } from "react-i18next";
import { useCheckUserExists, UserExistsStatus } from "@/hooks/use-check-user-exists";

/**
 * The source of an alias or of an address mapping, checked against the accounts: mail to an
 * existing account would be diverted (WebAdmin does not refuse it, linagora/james-project#5620),
 * so such a source, or one still being checked or invalid, blocks the creation.
 */
export function useSourceCheck(source: string): { status: UserExistsStatus; blocking: boolean } {
  const status = useCheckUserExists(source, { checkSyntax: false });
  return { status, blocking: status === "checking" || status === "exists" || status === "invalid" };
}

/** The line under a source field: an existing account is a red warning naming where its mail would go. */
export function SourceLine({ source, destination, status }: { source: string; destination: string; status: UserExistsStatus }) {
  const { t } = useTranslation();
  const trimmed = source.trim();
  return (
    // Reserved height: the status appearing does not resize the modal
    <p className="min-h-4 mt-1 text-xs">
      {status === "checking" && <span className="text-gray-400">{t("common.checking")}</span>}
      {status === "exists" && (
        <span role="alert" className="text-red-600">
          {destination.trim()
            ? t("common.sourceIsAccount", { source: trimmed, destination: destination.trim() })
            : t("common.sourceIsAccountNoDestination", { source: trimmed })}
        </span>
      )}
      {status === "invalid" && <span className="text-red-600">{t("common.invalidUsername")}</span>}
    </p>
  );
}

/** The line under the destination of an address mapping: informational, it never blocks. */
export function DestinationLine({ destination }: { destination: string }) {
  const { t } = useTranslation();
  const status = useCheckUserExists(destination);
  return (
    <p className="min-h-4 mt-1 text-xs">
      {status === "checking" && <span className="text-gray-400">{t("common.checking")}</span>}
      {status === "exists" && <span className="text-green-700">{t("common.userExists")}</span>}
      {status === "not_found" && <span className="text-gray-500">{t("mappings.destinationExternal")}</span>}
      {status === "invalid" && <span className="text-red-600">{t("common.invalidUsername")}</span>}
    </p>
  );
}
