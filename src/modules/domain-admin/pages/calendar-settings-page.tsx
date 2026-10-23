import CalendarDomainSettings from "@/modules/domains/details/calendar-domain-settings";
import { useDomain } from "../domain-context";
import { useTranslation } from "react-i18next";
import Header from "@/components/custom/header";

export default function CalendarSettingsPage() {
  const { t } = useTranslation();
  const domain = useDomain();
  return (
    <div className="mt-4 p-4 bg-white rounded-2">
      <Header headerTitle={t("domainAdminPages.calendarSettings")} />
      <CalendarDomainSettings domain={domain} defaultOpen />
    </div>
  );
}
