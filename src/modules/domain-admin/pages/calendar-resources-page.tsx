import CalendarDomainResources from "@/modules/domains/details/calendar-domain-resources";
import { useDomain } from "../domain-context";
import { useTranslation } from "react-i18next";
import Header from "@/components/custom/header";

export default function CalendarResourcesPage() {
  const { t } = useTranslation();
  const domain = useDomain();
  return (
    <div className="mt-4 p-4 bg-white rounded-2">
      <Header headerTitle={t("domainAdminPages.calendarResources")} />
      <CalendarDomainResources
        domain={domain}
        defaultOpen
        resourceLink={(resourceId) => `/resources/resource/${encodeURIComponent(resourceId)}`}
      />
    </div>
  );
}
