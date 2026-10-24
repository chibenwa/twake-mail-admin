// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import EventListenersDetail, { describeEvent } from "./event-listener";
import { getEventDetails, getFailedEvents } from "../api-client";

// The page header is covered by its own tests
vi.mock("@/components/custom/header", () => ({ default: () => null }));
vi.mock("../api-client", () => ({
  getFailedEvents: vi.fn(),
  getEventDetails: vi.fn(async () => ({})),
  deleteEvent: vi.fn(),
  deleteAllEventsForGroup: vi.fn(),
  redeliverGroupEvents: vi.fn(),
}));
vi.mock("@/hooks/use-task-created-toast", () => ({ useTaskCreatedToast: () => vi.fn() }));
vi.mock("@/hooks/use-managed-domains", () => ({ useManagedDomains: () => null }));

const CHARLOTTE_EVENT = {
  MessageContentDeletionEvent: { mailboxPath: "#private:charlotte@example.com:INBOX", size: 561, username: "charlotte@example.com" },
};
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key} ${JSON.stringify(options)}` : key,
  }),
}));
vi.mock("@/hooks/use-confirm", () => ({ useConfirm: () => vi.fn() }));
vi.mock("@/lib/proxy-resolver-context", () => ({ useIsAllowed: () => true }));

const GROUP = "org.apache.james.vault.DeletedMessageVaultListenerGroup";

function renderDetail(search: string) {
  render(
    <MemoryRouter initialEntries={[`/event-dead-letter/group/${GROUP}${search}`]}>
      <Routes>
        <Route path="/event-dead-letter/group/:id" element={<EventListenersDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

const paginationInfo = () => screen.findByText(/eventDeadletter\.paginationInfo/);

afterEach(() => {
  cleanup();
  vi.mocked(getFailedEvents).mockReset();
});

describe("event dead letter group detail", () => {
  it("shows the number of events of the group as total, whatever the URL says", async () => {
    vi.mocked(getFailedEvents).mockResolvedValue(["0eb84d76-56ae-4b42-a1d6-20b54c58f08b"]);

    renderDetail("?&page=1&size=10");

    // Everything fits on one page: the total alone, without paging buttons
    expect((await screen.findByText(/common\.totalOnly/)).textContent).toContain('"count":1');
    expect(screen.queryByText("common.next")).toBeNull();
    expect(screen.queryByText("common.last")).toBeNull();
  });

  it("paginates the events client side", async () => {
    const keys = Array.from({ length: 250 }, (_, index) => `insertion-${index}`);
    vi.mocked(getFailedEvents).mockResolvedValue(keys);

    renderDetail("?page=2");

    expect((await paginationInfo()).textContent).toContain('"total":250');
    expect(screen.getByText("insertion-20")).not.toBeNull();
    expect(screen.queryByText("insertion-19")).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(20);
    expect(screen.getByText("common.next").hasAttribute("disabled")).toBe(false);
  });

  it("enables the next page when more events remain", async () => {
    const keys = Array.from({ length: 250 }, (_, index) => `insertion-${index}`);
    vi.mocked(getFailedEvents).mockResolvedValue(keys);

    renderDetail("?page=1");

    expect((await paginationInfo()).textContent).toContain('"total":250');
    expect(screen.getAllByRole("listitem")).toHaveLength(20);
    expect(screen.getByText("common.next").hasAttribute("disabled")).toBe(false);
  });

  it("names the delete button of each event", async () => {
    vi.mocked(getFailedEvents).mockResolvedValue(["event-1"]);

    renderDetail("");

    const deleteButton = await screen.findByRole("button", { name: "eventDeadletter.deleteEventAction" });

    expect(deleteButton.getAttribute("title")).toBe("eventDeadletter.deleteEventAction");
  });
});

describe("event dead letter group detail: readable events", () => {
  it("tells the type, the user and the mailbox of an event", () => {
    expect(describeEvent(CHARLOTTE_EVENT)).toEqual({
      type: "MessageContentDeletionEvent", user: "charlotte@example.com", mailbox: "INBOX",
    });
    expect(describeEvent({ QuotaUsageUpdatedEvent: {} })).toEqual({ type: "QuotaUsageUpdatedEvent", user: undefined, mailbox: undefined });
  });

  it("describes each event of the page and shows its JSON in the console", async () => {
    vi.mocked(getFailedEvents).mockResolvedValue(["b55827fe"]);
    vi.mocked(getEventDetails).mockResolvedValue(CHARLOTTE_EVENT as never);
    const open = vi.spyOn(window, "open");

    renderDetail("");

    expect(await screen.findByText("MessageContentDeletionEvent")).not.toBeNull();
    expect(screen.getByRole("link", { name: "charlotte@example.com" })).not.toBeNull();
    expect(screen.getByText("INBOX")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "common.viewJson" }));
    expect((await screen.findByRole("dialog")).textContent).toContain('"username": "charlotte@example.com"');
    expect(open).not.toHaveBeenCalled();
  });

  it("keeps the bare ID of an event that cannot be read", async () => {
    vi.mocked(getFailedEvents).mockResolvedValue(["b55827fe"]);
    vi.mocked(getEventDetails).mockRejectedValue(new Error("boom"));

    renderDetail("");

    expect(await screen.findByText("eventDeadletter.eventLoadFailed")).not.toBeNull();
    expect(screen.getByText("b55827fe")).not.toBeNull();
  });
});
