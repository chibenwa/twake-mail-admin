import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useIsAllowed } from "@/lib/proxy-resolver-context";
import { useFetchData } from "@/hooks/use-fetch-data";
import { getTeamMailboxQuota, updateTeamMailboxQuotaSize, deleteTeamMailboxQuotaSize, updateTeamMailboxQuotaCount, deleteTeamMailboxQuotaCount } from "../api-client";
import { TeamMailboxQuota as TeamMailboxQuotaType, TeamMailboxQuotaValues } from "../types";
import QuotaLimits, { NO_LIMITS, QuotaLimitsApi } from "@/components/custom/quota-limits";
import i18n from "i18next";
import { currentLocale } from "@/i18n/locale";
import { formatByteSize } from "@/i18n/format-size";
import { formatPercent } from "@/i18n/format-percent";
import { SectionToggle, useSectionOpen } from "@/components/custom/collapsible-section";

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

function QuotaRow({ label, values, countLabel, sizeLabel }: { label: string; values: TeamMailboxQuotaValues | null; countLabel?: string; sizeLabel?: string }) {
  if (!values) return null;
  return (
    <div className="flex flex-wrap justify-between items-center gap-x-4 py-1">
      <span className="inline-block text-sm text-gray-600 first-letter:uppercase">{label}</span>
      <span className="text-sm">
        <span className="mr-4">{countLabel ?? "Count:"} <strong>{formatCount(values.count)}</strong></span>
        {sizeLabel ?? "Size:"} <strong>{formatSize(values.size)}</strong>
      </span>
    </div>
  );
}

interface Props {
  domain: string;
  mailbox: string;
}

export default function TeamMailboxQuota({ domain, mailbox }: Props) {
  const { t } = useTranslation();
  const canView = useIsAllowed("GET", "/domains/{domain}/team-mailboxes/{mailbox}/quota");
  const canUpdateSize = useIsAllowed("PUT", "/domains/{domain}/team-mailboxes/{mailbox}/quota/limit/size");
  const canUpdateCount = useIsAllowed("PUT", "/domains/{domain}/team-mailboxes/{mailbox}/quota/limit/count");
  const canReset = useIsAllowed("DELETE", "/domains/{domain}/team-mailboxes/{mailbox}/quota/limit/size");
  const [open, setOpen, openContentId] = useSectionOpen("quota");
  const limitsApi = useMemo<QuotaLimitsApi>(() => ({
    putCount: (count) => updateTeamMailboxQuotaCount(domain, mailbox, count),
    deleteCount: () => deleteTeamMailboxQuotaCount(domain, mailbox),
    putSize: (size) => updateTeamMailboxQuotaSize(domain, mailbox, size),
    deleteSize: () => deleteTeamMailboxQuotaSize(domain, mailbox),
  }), [domain, mailbox]);

  const fetchQuota = useCallback(() => getTeamMailboxQuota(domain, mailbox), [domain, mailbox]);
  const { data: quota, isLoading, error, refresh } = useFetchData<TeamMailboxQuotaType>(canView ? fetchQuota : null);

  if (!canView) return null;

  return (
    <div className="mt-6">
      <SectionToggle open={open} onToggle={() => setOpen(!open)} controls={openContentId}>
        {t("domains.teamMailboxQuota.title")}
      </SectionToggle>

      {open && (
        <div id={openContentId} className="mt-2">
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
              <div className="h-[58px] rounded-2 animate-pulse bg-gray-200" />
              <div className="h-[58px] rounded-2 animate-pulse bg-gray-200" />
            </div>
          )}
          {error && <p className="text-red-500 mt-2">{t("common.errorPrefix", { message: error })}</p>}

          {quota && (
            <div className="p-4 bg-gray-50 rounded-2 space-y-3">
              <div>
                <h4 className="text-sm font-semibold mb-1">{t("common.occupation")}</h4>
                <div className="flex flex-wrap justify-between items-center gap-x-4 py-1">
                  <span className="text-sm text-gray-600">{t("common.used")}</span>
                  <span className="text-sm">
                    <span className="mr-4">{t("common.count")} <strong>{formatCount(quota.occupation.count)}</strong></span>
                    {t("common.size")} <strong>{formatSize(quota.occupation.size)}</strong>
                  </span>
                </div>
                <div className="flex flex-wrap justify-between items-center gap-x-4 py-1">
                  <span className="text-sm text-gray-600">{t("common.ratio")}</span>
                  <span className="text-sm">
                    <span className="mr-4">{t("common.count")} <strong>{formatPercent(quota.occupation.ratio.count)}</strong></span>
                    <span className="mr-4">{t("common.size")} <strong>{formatPercent(quota.occupation.ratio.size)}</strong></span>
                    {t("common.max")} <strong>{formatPercent(quota.occupation.ratio.max)}</strong>
                  </span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${quota.occupation.ratio.max > 0.9 ? "bg-red-500" : quota.occupation.ratio.max > 0.7 ? "bg-yellow-500" : "bg-green-500"}`}
                    style={{ width: `${Math.min(quota.occupation.ratio.max * 100, 100)}%` }}
                  />
                </div>
              </div>

              <hr className="border-gray-200" />

              <div>
                <h4 className="text-sm font-semibold mb-1">{t("common.limits")}</h4>
                <QuotaRow label={t("common.computedEffective")} values={quota.computed} countLabel={t("common.count")} sizeLabel={t("common.size")} />
                <QuotaRow label={t("domains.teamMailboxQuota.teamMailbox")} values={quota.teamMailbox} countLabel={t("common.count")} sizeLabel={t("common.size")} />
                <QuotaRow label={t("common.domain")} values={quota.domain} countLabel={t("common.count")} sizeLabel={t("common.size")} />
                <QuotaRow label={t("common.global")} values={quota.global} countLabel={t("common.count")} sizeLabel={t("common.size")} />
              </div>

              <hr className="border-gray-200" />

              <QuotaLimits
                target={`${mailbox}@${domain}`}
                current={quota.teamMailbox ?? NO_LIMITS}
                parents={[
                  { label: t("quotaLimits.parentDomain"), values: quota.domain ?? NO_LIMITS },
                  { label: t("quotaLimits.parentGlobal"), values: quota.global ?? NO_LIMITS },
                ]}
                api={limitsApi}
                canEditCount={canUpdateCount}
                canEditSize={canUpdateSize}
                canRemove={canReset}
                removeLabel={t("quotaLimits.removeSpecific")}
                removeConfirm={t("domains.teamMailboxQuota.resetConfirm", { mailbox, domain })}
                onChanged={refresh}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
