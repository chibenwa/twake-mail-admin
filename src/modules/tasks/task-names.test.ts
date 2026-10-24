// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import type { TFunction } from "i18next";
import { cancelConfirmMessage, shortTaskId, taskHeading, taskTypeLabel } from "./task-summary";
import { TaskDetailResponse } from "@/modules/common-tasks/types";

// Returns the key and its options, to see what is said
const t = ((key: string, options?: Record<string, unknown>) => (options ? `${key} ${JSON.stringify(options)}` : key)) as unknown as TFunction;
const task = (type: string, additionalInformation: Record<string, unknown> = {}) =>
  ({ taskId: "58ae73fa-5585-417c-b320-1c19667b4743", type, status: "inProgress", additionalInformation }) as unknown as TaskDetailResponse;

describe("task names", () => {
  it("names a known type as the button that starts it, an unknown one as WebAdmin does", () => {
    expect(taskTypeLabel(t, "SubscribeAllTask")).toBe("users.tasks.subscribeAll");
    expect(taskTypeLabel(t, "recompute-mailbox-counters")).toBe("commonTasks.recomputeMailboxCounters");
    expect(taskTypeLabel(t, "brand-new-task")).toBe("brand-new-task");
  });

  it("heads a task with its name and its target", () => {
    expect(taskHeading(t, task("SubscribeAllTask", { username: "bob@example.com" }))).toBe("users.tasks.subscribeAll — bob@example.com");
    expect(taskHeading(t, task("BlobGCTask"))).toBe("commonTasks.blobGarbageCollection");
  });

  it("names the task and its target before cancelling it", () => {
    const message = cancelConfirmMessage(t, task("user-reindexing", { username: "bob@example.com" }));
    expect(message).toContain('"name":"users.tasks.reindexAll"');
    expect(message).toContain("tasks.cancelTarget");
    expect(message).toContain("58ae73fa-5585-417c-b320-1c19667b4743");
  });

  it("shortens a task ID to its first 8 characters", () => {
    expect(shortTaskId("58ae73fa-5585-417c-b320-1c19667b4743")).toBe("58ae73fa");
  });
});
