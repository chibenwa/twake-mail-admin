import { useParams } from "react-router";
import CalendarDomainAdmins from "./calendar-domain-admins";
import CalendarDomainResources from "./calendar-domain-resources";
import CalendarDomainTeamCalendars from "./calendar-domain-team-calendars";
import CalendarDomainSettings from "./calendar-domain-settings";
import CalendarDomainTasks from "./calendar-domain-tasks";
import DomainAddressBookCounts from "./domain-address-book-counts";
import { useTranslation } from "react-i18next";
import Header from "@/components/custom/header";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { ExpandCollapseAll, SectionsProvider } from "@/components/custom/collapsible-section";

export default function CalendarDomainDetail() {
  const { t } = useTranslation();
  const { domain } = useParams();
  const breadcrumbs = useBreadcrumbs();

  return (
    <SectionsProvider page="domain">
    <Header headerTitle={domain} headerSubTitle={t("domains.detailKind")} breadcrumb={breadcrumbs.domains()} actions={<ExpandCollapseAll />} />
    <div className="mt-4 p-4 bg-white rounded-2">

      <CalendarDomainAdmins domain={domain!} />
      <CalendarDomainResources domain={domain!} />
      <CalendarDomainTeamCalendars domain={domain!} />
      <CalendarDomainSettings domain={domain!} />
      <DomainAddressBookCounts domain={domain!} />
      <CalendarDomainTasks domain={domain!} />
    </div>
    </SectionsProvider>
  );
}
