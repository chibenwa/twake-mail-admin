import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useIsAllowed } from "@/lib/proxy-resolver-context";
import { useFetchData } from "@/hooks/use-fetch-data";
import { getJmapSettingsReport, JmapSettingsReport } from "@/modules/jmap-settings-report/api-client";
import { ReportTable } from "@/modules/jmap-settings-report";
import { SectionToggle, useSectionOpen } from "@/components/custom/collapsible-section";

interface Props {
  domain: string;
}

export default function DomainJmapReport({ domain }: Props) {
  const { t } = useTranslation();
  const canView = useIsAllowed("GET", "/jmap/settings/reports");
  const [open, setOpen, openContentId] = useSectionOpen("jmap-report");

  const fetchReport = useCallback(
    () => getJmapSettingsReport(domain),
    [domain]
  );
  const { data: report, isLoading, error } = useFetchData<JmapSettingsReport>(
    open && canView ? fetchReport : null
  );

  if (!canView) return null;

  return (
    <div className="mt-6">
      <SectionToggle open={open} onToggle={() => setOpen(!open)} controls={openContentId}>
        {t("jmapReport.sectionTitle")}
      </SectionToggle>

      {open && (
        <div id={openContentId} className="mt-2">
          {isLoading && (
            <div className="h-[40px] rounded-2 animate-pulse bg-gray-200" />
          )}
          {error && <p className="text-red-500 text-sm mt-2">{t("common.errorPrefix", { message: error })}</p>}
          {report && <ReportTable report={report} />}
        </div>
      )}
    </div>
  );
}
