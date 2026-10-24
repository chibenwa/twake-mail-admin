import { useTranslation } from "react-i18next";
import { useConfirm } from "@/hooks/use-confirm";
import { useTaskCreatedToast } from "@/hooks/use-task-created-toast";
import ConfirmTaskContent from "../common-tasks/components/confirm-task-content";
import { redeliverGroupEvents } from "./api-client";

const REDELIVER_PARAM_KEYS = ["limit", "maxRetries"] as const;
type RedeliverParamKey = (typeof REDELIVER_PARAM_KEYS)[number];

const POSITIVE_INTEGER = /^[1-9]\d*$/;

// WebAdmin only accepts positive integers: anything else is rejected before being sent.
const isEmptyOrPositiveInteger = (value?: string): boolean =>
  !value?.trim() || POSITIVE_INTEGER.test(value.trim());

const toOptionalNumber = (value?: string): number | undefined =>
  value?.trim() ? Number(value.trim()) : undefined;

/** Redelivers the events of a group, after a dialog for its limit and retries: the same from the list and the group page. */
export function useRedeliverGroup() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const toastTaskCreated = useTaskCreatedToast();

  return async (group: string) => {
    const params = REDELIVER_PARAM_KEYS.map((key) => ({ key, defaultValue: "", type: "input" as const }));
    const paramValues: Partial<Record<RedeliverParamKey, string>> = {};
    const findInvalidParam = (): RedeliverParamKey | undefined =>
      REDELIVER_PARAM_KEYS.find((key) => !isEmptyOrPositiveInteger(paramValues[key]));
    const command = `curl -XPOST /events/deadLetter/groups/${encodeURIComponent(group)}?action=reDeliver`;
    await confirm({
      header: t("eventDeadletter.redeliverGroupAction"),
      message: (
        <ConfirmTaskContent
          message={<p>{t("eventDeadletter.redeliverGroup", { path: group })}</p>}
          command={command}
          params={params}
          getParamValues={(key, value) => {
            paramValues[key as RedeliverParamKey] =
              typeof value === "boolean" ? value.toString() : value;
          }}
        />
      ),
      validate: () => {
        const invalidParam = findInvalidParam();
        return invalidParam ? t("eventDeadletter.invalidPositiveInteger", { key: invalidParam }) : null;
      },
      action: async () => {
        const { taskId } = await redeliverGroupEvents(group, {
          limit: toOptionalNumber(paramValues.limit),
          maxRetries: toOptionalNumber(paramValues.maxRetries),
        });
        toastTaskCreated(taskId);
      },
    });
  };
}
