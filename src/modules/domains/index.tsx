import { Outlet, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import Header from "@/components/custom/header";
import { appConfig } from "@/lib/config";
import { CALENDAR_WEBADMIN_DOC_URL } from "@/lib/calendar-docs";

const mailDocuUrl =
  "https://james.staged.apache.org/james-project/3.10.0/servers/distributed/operate/webadmin.html#_create_a_domain";

export default function Domains() {
  const { t } = useTranslation();
  const { domain } = useParams();
  const subtitleKey = appConfig.application === 'CALENDAR' ? "domains.subtitleCalendar" : "domains.subtitleMail";

  return (
    // A detail page takes the full width: opening its sections must not move its header
    <div className={domain ? "p-4" : "p-4 w-fit max-w-full"}>
      {/* A detail page heads itself with its object and a breadcrumb back here */}
      {!domain && (
        <Header
          headerTitle={t("sidebar.domains")}
          headerSubTitle={t(subtitleKey)}
          docuUrl={appConfig.application === 'CALENDAR' ? CALENDAR_WEBADMIN_DOC_URL : mailDocuUrl}
        />
      )}
      <Outlet />
    </div>
  );
}
