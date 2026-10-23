import CalendarDomainAdmins from "@/modules/domains/details/calendar-domain-admins";
import { useDomain } from "../domain-context";
import { useTranslation } from "react-i18next";
import Header from "@/components/custom/header";

export default function CalendarDomainAdminsPage() {
  const { t } = useTranslation();
  const domain = useDomain();
  return (
    <div className="mt-4 p-4 bg-white rounded-2">
      <Header headerTitle={t("domainAdminPages.calendarAdmins")} />
      <CalendarDomainAdmins domain={domain} defaultOpen />
    </div>
  );
}
