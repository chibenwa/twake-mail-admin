import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { deleteAllUsersData, republishDomainContacts, syncDomainMembers } from "../api-client";
import { useToast } from "@/hooks/use-toast";
import { useTaskCreatedToast } from "@/hooks/use-task-created-toast";
import { useConfirm } from "@/hooks/use-confirm";
import ErrorDisplayer from "@/components/custom/error-displayer";
import ConfirmTaskContent from "@/modules/common-tasks/components/confirm-task-content";
import { TaskParam } from "@/modules/common-tasks/types";
import { useIsAllowed } from "@/lib/proxy-resolver-context";
import { useTranslation } from "react-i18next";
import TaskRow from "@/components/custom/task-row";

const REPUBLISH_CONTACTS_PARAMS: TaskParam[] = [
  { key: "contactsPerSecond", defaultValue: "100", type: "input" },
  { key: "scope", defaultValue: "", type: "select", values: ["", "domain", "user"] },
];

interface Props {
  domain: string;
  defaultOpen?: boolean;
}

export default function CalendarDomainTasks({ domain, defaultOpen = false }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const toastTaskCreated = useTaskCreatedToast();
  const confirm = useConfirm();
  const canDeleteData = useIsAllowed("POST", "/domains/{domain}?action=deleteData");
  const canSyncMembers = useIsAllowed("POST", "/addressbook/domain-members/{domain}");
  const canRepublishContacts = useIsAllowed("POST", "/domains/{domain}/contacts?action=republish");
  const [open, setOpen] = useState(defaultOpen);
  const [deleting, setDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleDeleteAllUsersData = async () => {
    const confirmed = await confirm({
      header: t("domains.tasks.deleteAllDataTitle"),
      destructive: true,
      confirmLabel: t("confirm.deleteData"),
      typeToConfirm: domain,
      typeToConfirmIgnoreCase: true,
      message: t("domains.tasks.deleteAllDataConfirm", { domain }),
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      const { taskId } = await deleteAllUsersData(domain);
      toastTaskCreated(taskId);
    } catch (err) {
      toast({ title: t("domains.tasks.errorDeletingData"), description: <ErrorDisplayer error={err} /> });
    } finally {
      setDeleting(false);
    }
  };

  const handleSyncDomainMembers = async () => {
    const confirmed = await confirm({
      header: t("domains.calendarTasks.syncTitle"),
      message: t("domains.calendarTasks.syncConfirm", { domain }),
    });
    if (!confirmed) return;

    setSyncing(true);
    try {
      const { taskId } = await syncDomainMembers(domain);
      toastTaskCreated(taskId);
    } catch (err) {
      toast({ title: t("domains.calendarTasks.errorSyncing"), description: <ErrorDisplayer error={err} /> });
    } finally {
      setSyncing(false);
    }
  };

  const handleRepublishContacts = async () => {
    const params: { contactsPerSecond?: string; scope?: string } = {};
    await confirm({
      header: t("domains.calendarTasks.republishContactsTitle"),
      message: (
        <ConfirmTaskContent
          message={<p>{t("domains.calendarTasks.republishContactsConfirm", { domain })}</p>}
          command={`curl -XPOST /domains/${domain}/contacts?action=republish`}
          params={REPUBLISH_CONTACTS_PARAMS}
          getParamValues={(key, value) => {
            params[key as keyof typeof params] = value as string;
          }}
        />
      ),
      action: async () => {
        const { taskId } = await republishDomainContacts(domain, params);
        toastTaskCreated(taskId);
      },
    });
  };

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-md font-semibold hover:text-blue-600 transition"
      >
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        {t("domains.calendarTasks.title")}
      </button>

      {open && (canSyncMembers || canRepublishContacts || canDeleteData) && (
        <div className="mt-2 space-y-2">
          {canSyncMembers && (
            <TaskRow
              title={t("domains.calendarTasks.syncButton")}
              description={t("domains.calendarTasks.syncDesc")}
              command={`curl -XPOST /addressbook/domain-members/${domain}?task=sync`}
              onRun={handleSyncDomainMembers}
              disabled={syncing}
              loading={syncing}
            />
          )}
          {canRepublishContacts && (
            <TaskRow
              title={t("domains.calendarTasks.republishContactsButton")}
              description={t("domains.calendarTasks.republishContactsDesc")}
              command={`curl -XPOST /domains/${domain}/contacts?action=republish`}
              onRun={handleRepublishContacts}
            />
          )}
          {canDeleteData && (
            <TaskRow
              title={t("domains.tasks.deleteAllData")}
              description={t("domains.tasks.deleteAllDataDesc")}
              risk="destructive"
              command={`curl -XPOST /domains/${domain}?action=deleteData`}
              onRun={handleDeleteAllUsersData}
              disabled={deleting}
              loading={deleting}
            />
          )}
        </div>
      )}
    </div>
  );
}
