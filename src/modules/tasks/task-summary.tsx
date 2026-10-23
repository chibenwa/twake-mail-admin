import { Fragment } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { TaskDetailResponse, TaskStatus } from "@/modules/common-tasks/types";
import { currentLocale } from "@/i18n/locale";

/**
 * A task as the operator reads it, shared by the detail dialog of the Tasks list and by the
 * task page every "Task created" toast leads to: same fields, same labels.
 */

export const STATUS_COLORS: Record<string, string> = {
  [TaskStatus.COMPLETED]: "bg-green-100 text-green-800",
  [TaskStatus.FAILED]: "bg-red-100 text-red-800",
  [TaskStatus.IN_PROGRESS]: "bg-primary/10 text-primary",
  [TaskStatus.WAITING]: "bg-yellow-100 text-yellow-800",
  [TaskStatus.CANCELLED]: "bg-gray-100 text-gray-600",
  [TaskStatus.CANCEL_REQUESTED]: "bg-orange-100 text-orange-800",
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  "": "tasks.all",
  [TaskStatus.WAITING]: "tasks.waiting",
  [TaskStatus.IN_PROGRESS]: "tasks.inProgress",
  [TaskStatus.CANCEL_REQUESTED]: "tasks.cancelRequested",
  [TaskStatus.COMPLETED]: "tasks.completed",
  [TaskStatus.CANCELLED]: "tasks.cancelled",
  [TaskStatus.FAILED]: "tasks.failed",
};

export const statusLabel = (t: TFunction, status: string): string =>
  STATUS_LABEL_KEYS[status] ? t(STATUS_LABEL_KEYS[status]) : status;

// Still running: a page showing it refreshes itself until it is over
export const isRunning = (status: TaskStatus): boolean =>
  status === TaskStatus.WAITING || status === TaskStatus.IN_PROGRESS || status === TaskStatus.CANCEL_REQUESTED;

export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return `${dt.toLocaleDateString(currentLocale())} ${dt.toLocaleTimeString(currentLocale())}`;
  } catch {
    return d;
  }
}

// A task ends by completing, failing or being cancelled: WebAdmin sets the matching date only
// (spelled canceledDate, with a single L, unlike cancelledFrom)
export function endDate(task: TaskDetailResponse): string | null {
  return task.completedDate ?? task.failedDate ?? task.canceledDate ?? null;
}

/** "0.17 s", "3 min 12 s", "2 h 05 min": from the start to the end of the task. */
export function formatDuration(t: TFunction, milliseconds: number): string {
  const seconds = milliseconds / 1000;
  if (seconds < 60) {
    return t("tasks.durationSeconds", {
      value: seconds.toLocaleString(currentLocale(), { maximumFractionDigits: seconds < 10 ? 2 : 0 }),
    });
  }
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes < 60) return t("tasks.durationMinutes", { min: totalMinutes, sec: Math.floor(seconds % 60) });
  return t("tasks.durationHours", { h: Math.floor(totalMinutes / 60), min: String(totalMinutes % 60).padStart(2, "0") });
}

function duration(task: TaskDetailResponse): number | null {
  const ended = endDate(task);
  if (!task.startedDate || !ended) return null;
  const ms = new Date(ended).getTime() - new Date(task.startedDate).getTime();
  return Number.isFinite(ms) && ms >= 0 ? ms : null;
}

// Readable labels of the additionalInformation keys met most; unknown keys show as-is
const DETAIL_LABEL_KEYS: Record<string, string> = {
  repositoryPath: "tasks.info.repositoryPath",
  initialCount: "tasks.info.initialCount",
  remainingCount: "tasks.info.remainingCount",
  processedUserCount: "tasks.info.processedUserCount",
  failedUsers: "tasks.info.failedUsers",
  username: "tasks.info.username",
  mailboxId: "tasks.info.mailboxId",
  domain: "tasks.info.domain",
};

// What a task worked on, shown under its type in the Tasks list
export function taskTarget(task: TaskDetailResponse): string | null {
  const info = task.additionalInformation ?? {};
  const target = info.repositoryPath ?? info.username ?? info.mailboxId ?? info.domain;
  return typeof target === "string" && target ? target : null;
}

export function StatusPill({ status }: { status: TaskStatus }) {
  const { t } = useTranslation();
  return (
    <span className={`inline-block w-fit px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[status] || "bg-gray-100 text-gray-600"}`}>
      {statusLabel(t, status)}
    </span>
  );
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <>
    <span className="text-gray-500 font-medium">{label}</span>
    <span className="min-w-0 break-words">{children}</span>
  </>
);

/** Status, type, dates, duration and where the task ran. */
export function TaskSummary({ task }: { task: TaskDetailResponse }) {
  const { t } = useTranslation();
  const took = duration(task);
  return (
    <div className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 gap-y-2 text-sm">
      <Row label={t("tasks.status")}><StatusPill status={task.status} /></Row>
      <Row label={t("tasks.type")}>{task.type}</Row>
      <Row label={t("tasks.submitted")}>{formatDate(task.submitDate)}</Row>
      <Row label={t("tasks.started")}>{formatDate(task.startedDate)}</Row>
      {task.failedDate ? <Row label={t("tasks.failedAt")}>{formatDate(task.failedDate)}</Row>
        : task.canceledDate ? <Row label={t("tasks.cancelledAt")}>{formatDate(task.canceledDate)}</Row>
        : <Row label={t("tasks.completed")}>{formatDate(task.completedDate)}</Row>}
      {took !== null && <Row label={t("tasks.duration")}>{formatDuration(t, took)}</Row>}
      {task.executedOn && <Row label={t("tasks.executedOn")}>{task.executedOn}</Row>}
      {task.submittedFrom && <Row label={t("tasks.submittedFrom")}>{task.submittedFrom}</Row>}
    </div>
  );
}

/** additionalInformation as labelled values, then the raw JSON on demand. */
export function TaskDetails({ task, raw }: { task: TaskDetailResponse; raw: unknown }) {
  const { t } = useTranslation();
  const entries = Object.entries(task.additionalInformation ?? {}).filter(([, value]) => value !== null && value !== undefined);
  return (
    <div className="space-y-3">
      {entries.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-2">{t("tasks.details")}</h2>
          <div className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 gap-y-2 text-sm">
            {entries.map(([key, value]) => (
              <Fragment key={key}>
                <span className="text-gray-500 font-medium">{DETAIL_LABEL_KEYS[key] ? t(DETAIL_LABEL_KEYS[key]) : key}</span>
                {typeof value === "object"
                  ? <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>
                  : <span className="min-w-0 break-words">{String(value)}</span>}
              </Fragment>
            ))}
          </div>
        </div>
      )}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">{t("tasks.rawJson")}</summary>
        <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-x-auto">{JSON.stringify(raw, null, 2)}</pre>
      </details>
    </div>
  );
}
