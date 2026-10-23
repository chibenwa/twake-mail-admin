import DomainQuotaSection from "@/modules/domains/details/domain-quota";
import { useDomain } from "../domain-context";
import { useTranslation } from "react-i18next";
import Header from "@/components/custom/header";

export default function QuotaPage() {
  const { t } = useTranslation();
  const domain = useDomain();
  return (
    <div className="mt-4 p-4 bg-white rounded-2">
      <Header headerTitle={t("domainAdminPages.quota")} />
      <DomainQuotaSection domain={domain} defaultOpen />
    </div>
  );
}
