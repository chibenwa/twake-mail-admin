import DomainAliases from "@/modules/domains/details/domain-aliases";
import { useDomain } from "../domain-context";
import { useTranslation } from "react-i18next";
import Header from "@/components/custom/header";

export default function AliasesPage() {
  const { t } = useTranslation();
  const domain = useDomain();
  return (
    <div className="mt-4 p-4 bg-white rounded-2">
      <Header headerTitle={t("domainAdminPages.aliases")} />
      <DomainAliases domain={domain} defaultOpen />
    </div>
  );
}
