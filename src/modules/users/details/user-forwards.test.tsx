// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  api: {
    getUserForwards: vi.fn(),
    addUserForward: vi.fn(),
    removeUserForward: vi.fn(),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => (options ? `${key} ${JSON.stringify(options)}` : key),
  }),
}));
vi.mock("@/lib/proxy-resolver-context", () => ({ useIsAllowed: () => true }));
vi.mock("@/hooks/use-confirm", () => ({ useConfirm: () => vi.fn() }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock("../api-client", () => mocks.api);

import UserForwards from "./user-forwards";

const ALICE = "alice@example.com";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.api.getUserForwards.mockResolvedValue([]);
});

afterEach(cleanup);

describe("user forwards: add a forward", () => {
  it("opens the section and a modal from the +, and adds the typed destination", async () => {
    mocks.api.addUserForward.mockResolvedValue(undefined);
    render(<UserForwards username={ALICE} />);
    fireEvent.click(screen.getByTitle("users.forwards.addTooltip"));

    const dialog = await screen.findByRole("dialog");
    expect(screen.getByText("users.forwards.title").closest("button")?.getAttribute("aria-expanded")).toBe("true");
    fireEvent.change(screen.getByPlaceholderText("users.forwards.placeholder"), { target: { value: " bob@example.com " } });
    fireEvent.click(screen.getByRole("button", { name: "common.add" }));

    await waitFor(() => expect(mocks.api.addUserForward).toHaveBeenCalledWith(ALICE, "bob@example.com"));
    await waitFor(() => expect(dialog.isConnected).toBe(false));
    expect(mocks.toast).toHaveBeenCalledWith({ title: "users.forwards.added" });
  });

  it("keeps the modal open with the typed destination when the forward is refused", async () => {
    mocks.api.addUserForward.mockRejectedValue(new Error("Forbidden"));
    render(<UserForwards username={ALICE} />);
    fireEvent.click(screen.getByTitle("users.forwards.addTooltip"));
    fireEvent.change(await screen.findByPlaceholderText("users.forwards.placeholder"), { target: { value: "bob@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "common.add" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect((screen.getByPlaceholderText("users.forwards.placeholder") as HTMLInputElement).value).toBe("bob@example.com");
    expect(mocks.toast).not.toHaveBeenCalled();
  });
});
