import { useTranslation } from "react-i18next";
import MailingListsList from "@/modules/mailing-lists/mailing-lists-list";
import { useDomain } from "../domain-context";
import Header from "@/components/custom/header";

export default function MailingListsPage() {
  const { t } = useTranslation();
  const domain = useDomain();
  return (
    <div className="mt-4 p-4 bg-white rounded-2">
      <Header headerTitle={t("domainAdminPages.mailingLists")} />
      <MailingListsList domain={domain} />
    </div>
  );
}
