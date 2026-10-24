import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useIsAllowed } from "@/lib/proxy-resolver-context";
import { useFetchData } from "@/hooks/use-fetch-data";
import { getGlobalQuota, updateGlobalQuotaSize, deleteGlobalQuotaSize, updateGlobalQuotaCount, deleteGlobalQuotaCount } from "./api-client";
import QuotaLimits, { QuotaLimitsApi } from "@/components/custom/quota-limits";
import Header from "@/components/custom/header";
import { ExpandCollapseAll, SectionsProvider } from "@/components/custom/collapsible-section";
import ExploreUserQuota from "@/components/custom/explore-user-quota";
import QuotaUsageSumSection from "@/components/custom/quota-usage-sum";
import UsersWithSpecificQuotas from "./users-with-specific-quotas";
import AggregatedExtraQuotas from "./aggregated-extra-quotas";
import i18n from "i18next";
import { currentLocale } from "@/i18n/locale";
import { formatByteSize } from "@/i18n/format-size";

const docuUrl = "https://james.staged.apache.org/james-project/3.10.0/servers/distributed/operate/webadmin.html#_administrating_quotas";

function formatSize(bytes: number | null): string {
  if (bytes === null) return i18n.t("common.notSet");
  if (bytes === -1) return i18n.t("common.unlimited");
  return formatByteSize(bytes);
}

function formatCount(count: number | null): string {
  if (count === null) return i18n.t("common.notSet");
  if (count === -1) return i18n.t("common.unlimited");
  return count.toLocaleString(currentLocale());
}

export default function GlobalQuota() {
  const { t } = useTranslation();
  const canUpdateSize = useIsAllowed("PUT", "/quota/size");
  const canUpdateCount = useIsAllowed("PUT", "/quota/count");
  const canRemove = useIsAllowed("DELETE", "/quota/size");
  const canViewSummary = useIsAllowed("GET", "/reports/quota/users/sum?hasSpecificQuota");
  const canViewSpecificQuotas = useIsAllowed("GET", "/reports/quota/users?hasSpecificQuota");

  // Only the global quota is loaded with the page: the reports are fetched when their section is opened
  const { data: quota, isLoading, error, refresh } = useFetchData(getGlobalQuota);

  const limitsApi = useMemo<QuotaLimitsApi>(() => ({
    putCount: updateGlobalQuotaCount,
    deleteCount: deleteGlobalQuotaCount,
    putSize: updateGlobalQuotaSize,
    deleteSize: deleteGlobalQuotaSize,
  }), []);

  return (
    <SectionsProvider page="globalQuota">
    {/* Full width: Expand all must not move as the sections open */}
    <div className="p-4">
      <Header headerTitle={t("globalQuota.title")} headerSubTitle={t("globalQuota.subtitle")} docuUrl={docuUrl} actions={<ExpandCollapseAll />} />

      <div className="mt-4">
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-[58px] rounded-2 animate-pulse bg-gray-200" />
            <div className="h-[58px] rounded-2 animate-pulse bg-gray-200" />
          </div>
        )}
        {error && <p className="text-red-500 mt-2">{t("common.errorPrefix", { message: error })}</p>}

        {quota && (
          <div className="space-y-6">
            {/* Current global quota */}
            <div className="p-4 bg-gray-50 rounded-2 space-y-3">
              <h4 className="text-sm font-semibold">{t("globalQuota.currentQuota")}</h4>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-600">{t("globalQuota.count")}</span>
                <strong className="text-sm">{formatCount(quota.count)}</strong>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-600">{t("globalQuota.size")}</span>
                <strong className="text-sm">{formatSize(quota.size)}</strong>
              </div>

              <hr className="border-gray-200" />

              <QuotaLimits
                target={t("quotaLimits.allUsers")}
                current={quota}
                api={limitsApi}
                canEditCount={canUpdateCount}
                canEditSize={canUpdateSize}
                canRemove={canRemove}
                removeLabel={t("quotaLimits.removeGlobal")}
                removeConfirm={t("globalQuota.removeConfirm")}
                onChanged={refresh}
              />
            </div>

            {canViewSummary && <AggregatedExtraQuotas formatCount={formatCount} formatSize={formatSize} />}

            {canViewSpecificQuotas && (
              <UsersWithSpecificQuotas formatCount={formatCount} formatSize={formatSize} />
            )}
          </div>
        )}

        <QuotaUsageSumSection />
        <ExploreUserQuota />
      </div>
    </div>
    </SectionsProvider>
  );
}
