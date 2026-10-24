import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getDomainQuota, updateDomainQuotaSize, deleteDomainQuotaSize, updateDomainQuotaCount, deleteDomainQuotaCount } from "../api-client";
import { DomainQuota, DomainQuotaValues } from "../types";
import QuotaLimits, { NO_LIMITS, QuotaLimitsApi } from "@/components/custom/quota-limits";
import ExploreUserQuota from "@/components/custom/explore-user-quota";
import QuotaUsageSumSection from "@/components/custom/quota-usage-sum";
import { useIsAllowed } from "@/lib/proxy-resolver-context";
import i18n from "i18next";
import { currentLocale } from "@/i18n/locale";
import { formatByteSize } from "@/i18n/format-size";
import { SectionToggle, useSectionOpen } from "@/components/custom/collapsible-section";

interface Props {
  domain: string;
  defaultOpen?: boolean;
}

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

function QuotaRow({ label, values, countLabel, sizeLabel }: { label: string; values: DomainQuotaValues | null; countLabel?: string; sizeLabel?: string }) {
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

export default function DomainQuotaSection({ domain, defaultOpen }: Props) {
  const { t } = useTranslation();
  const canView = useIsAllowed("GET", "/quota/domains/{domain}");
  const canUpdateSize = useIsAllowed("PUT", "/quota/domains/{domain}/size");
  const canUpdateCount = useIsAllowed("PUT", "/quota/domains/{domain}/count");
  const canReset = useIsAllowed("DELETE", "/quota/domains/{domain}/size");
  const [open, setOpen, openContentId] = useSectionOpen("quota", defaultOpen ?? false);
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState<DomainQuota | null>(null);
  const limitsApi = useMemo<QuotaLimitsApi>(() => ({
    putCount: (count) => updateDomainQuotaCount(domain, count),
    deleteCount: () => deleteDomainQuotaCount(domain),
    putSize: (size) => updateDomainQuotaSize(domain, size),
    deleteSize: () => deleteDomainQuotaSize(domain),
  }), [domain]);

  const fetchQuota = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDomainQuota(domain);
      setQuota(data);
    } catch {
      setQuota(null);
    } finally {
      setLoading(false);
    }
  }, [domain]);

  useEffect(() => {
    if (open) fetchQuota();
  }, [open, fetchQuota]);

  if (!canView) return null;

  return (
    <div className="mt-6">
      <SectionToggle open={open} onToggle={() => setOpen(!open)} controls={openContentId}>
        {t("domains.quota.title")}
      </SectionToggle>

      {open && (
        <div id={openContentId} className="mt-2">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
              <div className="h-[58px] rounded-2 animate-pulse bg-gray-200" />
            </div>
          ) : quota ? (
            <div className="p-4 bg-gray-50 rounded-2 space-y-3">
              <div>
                <h4 className="text-sm font-semibold mb-1">{t("common.perUserLimit")}</h4>
                <QuotaRow label={t("common.computedEffective")} values={quota.computed} countLabel={t("common.count")} sizeLabel={t("common.size")} />
                <QuotaRow label={t("common.domain")} values={quota.domain} countLabel={t("common.count")} sizeLabel={t("common.size")} />
                <QuotaRow label={t("common.global")} values={quota.global} countLabel={t("common.count")} sizeLabel={t("common.size")} />
              </div>

              <hr className="border-gray-200" />

              <QuotaLimits
                target={domain}
                current={quota.domain ?? NO_LIMITS}
                parents={[{ label: t("quotaLimits.parentGlobal"), values: quota.global ?? NO_LIMITS }]}
                api={limitsApi}
                canEditCount={canUpdateCount}
                canEditSize={canUpdateSize}
                canRemove={canReset}
                removeLabel={t("quotaLimits.removeDomain")}
                removeConfirm={t("domains.quota.resetConfirm", { domain })}
                onChanged={fetchQuota}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("domains.quota.couldNotLoad")}</p>
          )}

        </div>
      )}

      {open && <QuotaUsageSumSection domain={domain} />}
      {open && <ExploreUserQuota domain={domain} />}
    </div>
  );
}
