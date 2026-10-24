// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TFunction } from "i18next";
import { TaskStatus } from "@/modules/common-tasks/types";

const api = vi.hoisted(() => ({ cancelTask: vi.fn(), getTaskDetail: vi.fn() }));
vi.mock("@/modules/common-tasks/api-client", () => api);

import { cancelAndReport } from "./task-summary";

const t = ((key: string, options?: Record<string, unknown>) => (options?.status ? `${key} ${options.status}` : key)) as unknown as TFunction;

beforeEach(() => {
  api.cancelTask.mockReset().mockResolvedValue(undefined);
  api.getTaskDetail.mockReset();
});

describe("cancelAndReport", () => {
  it.each([TaskStatus.CANCEL_REQUESTED, TaskStatus.CANCELLED])("reports a task left %s as cancelled", async (status) => {
    api.getTaskDetail.mockResolvedValue({ status });

    expect(await cancelAndReport(t, "42", "example.com")).toBe("tasks.taskCancelled");
    expect(api.cancelTask).toHaveBeenCalledWith("42", "example.com");
    expect(api.getTaskDetail).toHaveBeenCalledWith("42", "example.com");
  });

  it.each([
    [TaskStatus.COMPLETED, "tasks.status.completed"],
    [TaskStatus.FAILED, "tasks.failed"],
  ])("says a task that ended meanwhile (%s) was not cancelled", async (status) => {
    api.getTaskDetail.mockResolvedValue({ status });

    expect(await cancelAndReport(t, "42")).toMatch(/^tasks\.alreadyEnded /);
  });

  it("trusts the accepted cancellation when the task can no longer be read", async () => {
    api.getTaskDetail.mockRejectedValue(new Error("can not be found"));

    expect(await cancelAndReport(t, "42")).toBe("tasks.taskCancelled");
  });

  it("lets a refused cancellation throw", async () => {
    api.cancelTask.mockRejectedValue(new Error("Forbidden"));

    await expect(cancelAndReport(t, "42")).rejects.toThrow("Forbidden");
    expect(api.getTaskDetail).not.toHaveBeenCalled();
  });
});
