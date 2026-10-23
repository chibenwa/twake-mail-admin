import { useCallback } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import DomainQuotaSection from "./domain-quota";
import DomainAliases from "./domain-aliases";
import DomainTeamMailboxes from "./domain-team-mailboxes";
import DomainContacts from "./domain-contacts";
import DomainTasks from "./domain-tasks";
import DomainSignatureTemplates from "./domain-signature-templates";
import DomainJmapReport from "./domain-jmap-report";
import RateLimitsSection from "@/components/custom/rate-limits-section";
import { getDomainRateLimits, updateDomainRateLimits } from "../api-client";
import { useIsAllowed } from "@/lib/proxy-resolver-context";
import { appConfig } from "@/lib/config";
import Header from "@/components/custom/header";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

export default function DomainDetail() {
  const { t } = useTranslation();
  const { domain } = useParams();
  const breadcrumbs = useBreadcrumbs();
  const canUpdateRateLimits = useIsAllowed("PUT", "/domains/{domain}/ratelimits");

  const fetchRateLimits = useCallback(() => getDomainRateLimits(domain!), [domain]);
  const updateRateLimits = useCallback((limits: any) => updateDomainRateLimits(domain!, limits), [domain]);

  return (
    <>
    <Header headerTitle={domain} headerSubTitle={t("domains.detailKind")} breadcrumb={breadcrumbs.domains()} />
    <div className="mt-4 p-4 bg-white rounded-2">

      <DomainQuotaSection domain={domain!} />
      <DomainAliases domain={domain!} />
      <DomainTeamMailboxes domain={domain!} />
      <DomainContacts domain={domain!} />
      {appConfig.application === 'MAIL' && <DomainSignatureTemplates domain={domain!} />}
      <RateLimitsSection fetchRateLimits={fetchRateLimits} updateRateLimits={updateRateLimits} canUpdate={canUpdateRateLimits} />
      <DomainJmapReport domain={domain!} />
      <DomainTasks domain={domain!} />
    </div>
    </>
  );
}
