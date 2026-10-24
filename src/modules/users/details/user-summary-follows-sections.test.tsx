// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SectionsProvider } from "@/components/custom/collapsible-section";

const api = vi.hoisted(() => ({
  getUserQuota: vi.fn(),
  updateUserQuotaSize: vi.fn(),
  deleteUserQuotaSize: vi.fn(),
  updateUserQuotaCount: vi.fn(),
  deleteUserQuotaCount: vi.fn(),
  getUserVacation: vi.fn(),
  updateUserVacation: vi.fn(),
  deleteUserVacation: vi.fn(),
}));
vi.mock("../api-client", () => api);
vi.mock("@/lib/proxy-resolver-context", () => ({ useIsAllowed: () => true }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/hooks/use-confirm", () => ({ useConfirm: () => async () => true }));
// The limits editor is covered on its own: here it only has to report a saved edit
vi.mock("@/components/custom/quota-limits", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  default: ({ onChanged }: { onChanged: () => void }) => (
    <button type="button" onClick={onChanged}>edit limits</button>
  ),
}));

import UserQuota from "./user-quota";
import UserVacation from "./user-vacation";
import { MailUserSummary } from "./user-summary";

const MB = 1024 * 1024;
const occupation = { size: 1126, count: 2, ratio: { size: 1126 / (50 * MB), count: 0, max: 0 } };
const quotaWith = (user: number | null, computed: number | null) => ({
  global: null, domain: null,
  user: user === null ? null : { size: user, count: null },
  computed: computed === null ? null : { size: computed, count: null },
  occupation,
});

function Page() {
  return (
    <SectionsProvider page="user">
      <MailUserSummary username="bob@example.com" />
      <UserQuota username="bob@example.com" />
      <UserVacation username="bob@example.com" />
    </SectionsProvider>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  api.getUserQuota.mockReset();
  api.getUserVacation.mockReset();
  api.updateUserVacation.mockReset();
});
afterEach(cleanup);

const chipTexts = () => screen.getAllByRole("button").map((b) => b.textContent);

describe("mail user summary follows the edits made in the sections of the page", () => {
  it("updates the quota chip after each edit of the limits", async () => {
    api.getUserQuota.mockResolvedValue(quotaWith(50 * MB, 50 * MB));
    api.getUserVacation.mockResolvedValue({ enabled: false });
    render(<Page />);
    expect(await screen.findByText("users.summary.quota")).not.toBeNull();
    fireEvent.click(screen.getByText("users.quota.title"));
    const edit = await screen.findByText("edit limits");

    // "Remove specific limits": no limit is set at any level
    api.getUserQuota.mockResolvedValue(quotaWith(null, null));
    fireEvent.click(edit);
    expect(await screen.findByText("users.summary.quotaUnlimited")).not.toBeNull();
    expect(screen.queryByText("users.summary.quota")).toBeNull();

    // Edit limits: a limit again
    api.getUserQuota.mockResolvedValue(quotaWith(50 * MB, 50 * MB));
    fireEvent.click(screen.getByText("edit limits"));
    expect(await screen.findByText("users.summary.quota")).not.toBeNull();
    expect(screen.queryByText("users.summary.quotaUnlimited")).toBeNull();

    // "Unlimited" ticked
    api.getUserQuota.mockResolvedValue(quotaWith(-1, -1));
    fireEvent.click(screen.getByText("edit limits"));
    expect(await screen.findByText("users.summary.quotaUnlimited")).not.toBeNull();
    expect(screen.queryByText("users.summary.quota")).toBeNull();
  });

  it("updates the vacation chip once the vacation is saved, not while it is edited", async () => {
    api.getUserQuota.mockResolvedValue(quotaWith(50 * MB, 50 * MB));
    api.getUserVacation.mockResolvedValue({ enabled: false });
    api.updateUserVacation.mockResolvedValue(undefined);
    render(<Page />);
    expect(await screen.findByText("users.summary.vacationOff")).not.toBeNull();
    fireEvent.click(screen.getByText("users.vacation.title"));

    fireEvent.click(await screen.findByLabelText("users.vacation.enabled"));
    expect(chipTexts()).toContain("users.summary.vacationOff");

    fireEvent.click(screen.getByText("common.save"));
    expect(await screen.findByText("users.summary.vacationOn")).not.toBeNull();
    expect(screen.queryByText("users.summary.vacationOff")).toBeNull();

    // Deleting the vacation turns it off
    fireEvent.click(screen.getByText("common.delete"));
    await waitFor(() => expect(screen.queryByText("users.summary.vacationOff")).not.toBeNull());
  });
});
