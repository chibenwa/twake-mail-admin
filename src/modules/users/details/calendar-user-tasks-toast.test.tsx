// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ConfirmProvider } from "@/components/custom/confirm-provider";

const api = vi.hoisted(() => ({
  deleteUserData: vi.fn(),
  archiveUserCalendarEvents: vi.fn(async () => ({ taskId: "task-1" })),
  republishUserContacts: vi.fn(async () => ({ taskId: "task-2" })),
}));
const toastTaskCreated = vi.hoisted(() => vi.fn());

vi.mock("../api-client", () => api);
vi.mock("@/lib/proxy-resolver-context", () => ({ useIsAllowed: () => true }));
vi.mock("@/hooks/use-task-created-toast", () => ({ useTaskCreatedToast: () => toastTaskCreated }));

import CalendarUserTasks from "./calendar-user-tasks";

afterEach(cleanup);

describe("calendar user tasks: the Task created toast", () => {
  it.each([
    ["users.calendarTasks.archiveButton", "task-1", "commonTasks.calendarEventArchival"],
    ["users.calendarTasks.republishContactsButton", "task-2", "commonTasks.republishCommonContacts"],
  ])("names the task started by %s as the Tasks list does", async (label, taskId, typeLabel) => {
    render(<MemoryRouter><ConfirmProvider><CalendarUserTasks username="alice@open-paas.org" /></ConfirmProvider></MemoryRouter>);
    fireEvent.click(screen.getByText("users.calendarTasks.title"));
    fireEvent.click((screen.getByText(label).closest("[data-task-row]") as HTMLElement).querySelector("button")!);
    fireEvent.click(await screen.findByRole("button", { name: /^(confirmTask.start|commonTasks.archiveAllEvents)$/ }));

    await waitFor(() => expect(toastTaskCreated).toHaveBeenCalledWith(taskId, undefined, typeLabel));
  });
});
