import { Link } from "react-router";
import { Copy, RefreshCw, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ListenerGroupsResponseType } from "./types";
import {
  getMailboxListenerGroups,
  deleteAllEventsForGroup,
  getFailedEvents,
} from "./api-client";
import SearchByEventId from "./search-by-event-id";
import { useFetchData } from "@/hooks/use-fetch-data";
import { useState, useEffect } from "react";
import { useConfirm } from "@/hooks/use-confirm";
import { useToast } from "@/hooks/use-toast";
import { useIsAllowed } from "@/lib/proxy-resolver-context";
import EmptyState from "@/components/custom/empty-state";
import CamelCaseName from "@/components/custom/camel-case-name";
import { groupDisplayName } from "./group-name";
import { useRedeliverGroup } from "./use-redeliver-group";

/** The full class name of a listener group, under its readable name, with a copy button. */
export function GroupClassName({ group }: { group: string }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const copy = () => {
    navigator.clipboard?.writeText(group)
      .then(() => toast({ title: t("common.copied"), description: group }))
      .catch(() => { /* the name stays selectable */ });
  };
  return (
    <span className="mt-1 flex items-start gap-1 text-xs font-normal text-gray-500 font-mono break-all">
        {group}
        <button
          type="button"
          onClick={copy}
          className="shrink-0 p-0.5 rounded hover:bg-gray-200"
          title={t("eventDeadletter.copyGroupName")}
          aria-label={t("eventDeadletter.copyGroupName")}
        >
          <Copy className="w-3 h-3" aria-hidden="true" />
        </button>
    </span>
  );
}

export default function EventListenersList() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { toast } = useToast();
  const handleRedeliverGroup = useRedeliverGroup();
  const canRedeliver = useIsAllowed("POST", "/events/deadLetter/groups/{group}");
  const canDelete = useIsAllowed("DELETE", "/events/deadLetter/groups/{group}");
  const { data: listenerGroupsResult, isLoading } =
    useFetchData<ListenerGroupsResponseType>(getMailboxListenerGroups);

  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (listenerGroupsResult) {
      const fetchCounts = async () => {
        const counts = await Promise.all(
          listenerGroupsResult.map(async (group) => {
            try {
              const events = await getFailedEvents(group);
              return { [group]: events.length };
            } catch {
              return { [group]: 0 };
            }
          })
        );

        setEventCounts(Object.assign({}, ...counts));
      };

      fetchCounts();
    }
  }, [listenerGroupsResult]);

  const handleClearGroup = async (path: string) => {
    const result = await confirm({
      header: t("eventDeadletter.clearGroupTitle"),
      destructive: true,
      confirmLabel: t("common.delete"),
      consequence: t("confirm.consequence.clearGroup"),
      message: t("eventDeadletter.clearGroup", { path }),
    });
    if (!result) return;

    await deleteAllEventsForGroup(path);
    toast({ title: t("eventDeadletter.clearSuccess") });

    setEventCounts((prev) => ({ ...prev, [path]: 0 }));
  };

  return (
    <>
      <div>
        <h3 className="mt-4 text-lg font-semibold">{t("eventDeadletter.groupsTitle")}</h3>
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="h-[58px] rounded-2 animate-pulse bg-gray-200" />
            <div className="h-[58px] rounded-2 animate-pulse bg-gray-200" />
            <div className="h-[58px] rounded-2 animate-pulse bg-gray-200" />
          </div>
        )}

        {listenerGroupsResult && listenerGroupsResult.length === 0 && (
          <EmptyState title={t("eventDeadletter.emptyTitle")} text={t("eventDeadletter.emptyText")} />
        )}

        <div>
          {listenerGroupsResult?.map((group) => (
            <div
              key={group}
              className="space-y-1 p-4 bg-white rounded-2 my-4 p-4 flex justify-between items-center gap-2 transition-colors hover:bg-gray-50"
            >
              <div className="min-w-0">
                <h4 className="text-sm font-medium">
                  <Link to={`/event-dead-letter/group/${group}?page=1`} className="text-blue-600 hover:underline">
                    <CamelCaseName name={groupDisplayName(group)} />
                  </Link>
                  <span className="ml-1 text-gray-500">({eventCounts[group] ?? t("common.loading")})</span>
                </h4>
                <GroupClassName group={group} />
              </div>

              <div className="flex shrink-0 gap-2">
                {canRedeliver && (
                  <button
                    className="p-2 rounded-md hover:bg-gray-200"
                    aria-label={t("eventDeadletter.redeliverGroupAction")}
                    title={t("eventDeadletter.redeliverGroupAction")}
                    onClick={() => handleRedeliverGroup(group)}
                  >
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                  </button>
                )}

                {canDelete && (
                  <button
                    className="p-2 rounded-md hover:bg-gray-200"
                    aria-label={t("eventDeadletter.clearGroupAction")}
                    title={t("eventDeadletter.clearGroupAction")}
                    onClick={() => handleClearGroup(group)}
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <SearchByEventId groups={listenerGroupsResult ?? []} />
      </div>
    </>
  );
}
