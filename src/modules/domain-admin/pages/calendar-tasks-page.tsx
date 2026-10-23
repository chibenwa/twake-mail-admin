import CalendarDomainTasks from "@/modules/domains/details/calendar-domain-tasks";
import DomainAddressBookCounts from "@/modules/domains/details/domain-address-book-counts";
import { useDomain } from "../domain-context";
import { useTranslation } from "react-i18next";
import Header from "@/components/custom/header";

export default function CalendarTasksPage() {
  const { t } = useTranslation();
  const domain = useDomain();
  return (
    <div className="mt-4 p-4 bg-white rounded-2">
      <Header headerTitle={t("domainAdminPages.calendarTasks")} />
      <DomainAddressBookCounts domain={domain} />
      <CalendarDomainTasks domain={domain} defaultOpen />
    </div>
  );
}
