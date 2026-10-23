import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import TaskRow from "@/components/custom/task-row";
import { deleteUserData, archiveUserCalendarEvents, republishUserContacts } from "../api-client";
import DeleteUserDataForm from "../components/delete-user-data-form";
import { useTaskCreatedToast } from "@/hooks/use-task-created-toast";
import { useConfirm } from "@/hooks/use-confirm";
import ConfirmTaskContent from "@/modules/common-tasks/components/confirm-task-content";
import ArchivalNotice from "@/modules/common-tasks/components/archival-notice";
import { TaskParam } from "@/modules/common-tasks/types";
import { useIsAllowed } from "@/lib/proxy-resolver-context";

const ARCHIVE_CALENDAR_PARAMS: TaskParam[] = [
  { key: "createdBefore", defaultValue: "", type: "duration" },
  { key: "lastModifiedBefore", defaultValue: "", type: "duration" },
  { key: "masterDtStartBefore", defaultValue: "", type: "duration" },
  { key: "isRejected", defaultValue: "", type: "select", values: ["", "true", "false"] },
  { key: "isNotRecurring", defaultValue: "", type: "select", values: ["", "true", "false"] },
  { key: "eventsPerSecond", defaultValue: "100", type: "input" },
];

const REPUBLISH_CONTACTS_PARAMS: TaskParam[] = [
  { key: "contactsPerSecond", defaultValue: "100", type: "input" },
];

// What the page lists of the user, for the summary of what a data deletion loses; unknown until loaded.
export interface CalendarUserCounts {
  calendars?: number;
  addressBooks?: number;
  bookingLinks?: number;
}

interface Props {
  username: string;
  counts?: CalendarUserCounts;
}

const countText = (count: number | undefined) => (count === undefined ? "—" : String(count));

export default function CalendarUserTasks({ username, counts = {} }: Props) {
  const { t } = useTranslation();
  const toastTaskCreated = useTaskCreatedToast();
  const confirm = useConfirm();
  const canDeleteData = useIsAllowed("POST", "/users/{username}?action=deleteData");
  const canArchiveCalendar = useIsAllowed("POST", "/calendars/{username}");
  const canRepublishContacts = useIsAllowed("POST", "/users/{username}/contacts?action=republish");
  const [open, setOpen] = useState(false);


  const handleDeleteUserData = async () => {
    let currentFromStep = "";

    await confirm({
      header: t("users.tasks.deleteDataTitle", { username }),
      destructive: true,
      confirmLabel: t("confirm.deleteUserData"),
      consequence: (
        <>
          <ul className="list-disc ml-4">
            <li>{t("users.tasks.deleteDataCounts.calendars", { count: countText(counts.calendars) })}</li>
            <li>{t("users.tasks.deleteDataCounts.addressBooks", { count: countText(counts.addressBooks) })}</li>
            <li>{t("users.tasks.deleteDataCounts.bookingLinks", { count: countText(counts.bookingLinks) })}</li>
          </ul>
          <p className="mt-2">{t("confirm.consequence.deleteCalendarUserData")}</p>
        </>
      ),
      typeToConfirm: username,
      typeToConfirmIgnoreCase: true,
      message: (
        <DeleteUserDataForm
          onChange={(value) => { currentFromStep = value; }}
          fromStepPlaceholderKey="deleteUserDataForm.calendarFromStepPlaceholder"
        />
      ),
      action: async () => {
        const data = await deleteUserData(username, currentFromStep || undefined);
        toastTaskCreated(data.taskId);
      },
    });
  };

  const handleArchiveCalendarEvents = async () => {
    const additionalParams: Parameters<typeof archiveUserCalendarEvents>[1] = {};
    await confirm({
      header: t("users.calendarTasks.archiveTitle"),
      message: (
        <ConfirmTaskContent
          message={<p>{t("users.calendarTasks.archiveDesc", { username })}</p>}
          command={`curl -XPOST /calendars/${username}?task=archive`}
          params={ARCHIVE_CALENDAR_PARAMS}
          notice={(values) => <ArchivalNotice values={values} message={t("users.calendarTasks.archiveAllWarning", { username })} />}
          getParamValues={(key, value) => {
            additionalParams[key as keyof typeof additionalParams] = value as string;
          }}
        />
      ),
      action: async () => {
        const data = await archiveUserCalendarEvents(username, additionalParams);
        toastTaskCreated(data.taskId);
      },
    });
  };

  const handleRepublishContacts = async () => {
    const params: { contactsPerSecond?: string } = {};
    await confirm({
      header: t("users.calendarTasks.republishContactsTitle"),
      message: (
        <ConfirmTaskContent
          message={<p>{t("users.calendarTasks.republishContactsDesc", { username })}</p>}
          command={`curl -XPOST /users/${username}/contacts?action=republish`}
          params={REPUBLISH_CONTACTS_PARAMS}
          getParamValues={(key, value) => {
            params[key as keyof typeof params] = value as string;
          }}
        />
      ),
      action: async () => {
        const data = await republishUserContacts(username, params);
        toastTaskCreated(data.taskId);
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
        {t("users.calendarTasks.title")}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {canArchiveCalendar && (
            <TaskRow
              title={t("users.calendarTasks.archiveButton")}
              description={t("users.tasks.desc.archive")}
              risk="caution"
              command={`curl -XPOST /calendars/${username}?task=archive`}
              onRun={handleArchiveCalendarEvents}
            />
          )}
          {canRepublishContacts && (
            <TaskRow
              title={t("users.calendarTasks.republishContactsButton")}
              description={t("users.tasks.desc.republishContacts")}
              risk="safe"
              command={`curl -XPOST /users/${username}/contacts?action=republish`}
              onRun={handleRepublishContacts}
            />
          )}
          {canDeleteData && (
            <TaskRow
              title={t("users.tasks.deleteData")}
              description={t("users.tasks.desc.calendarDeleteData")}
              risk="destructive"
              command={`curl -XPOST /users/${username}?action=deleteData`}
              onRun={handleDeleteUserData}
            />
          )}
        </div>
      )}
    </div>
  );
}
