// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render as renderComponent, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ReactElement } from "react";

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
vi.mock("@/hooks/use-managed-domains", () => ({ useManagedDomains: () => new Set(["example.com"]) }));

import UserForwards from "./user-forwards";

// The destinations link to their user pages
const render = (ui: ReactElement) => renderComponent(<MemoryRouter>{ui}</MemoryRouter>);

// The Radix checkbox measures itself; jsdom has no ResizeObserver
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;

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
    // A copy is kept by default: alice is added as a destination too
    await waitFor(() => expect(mocks.api.addUserForward).toHaveBeenCalledWith(ALICE, ALICE));
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

describe("user forwards: keep a copy", () => {
  const addThroughDialog = async () => {
    fireEvent.click(screen.getByTitle("users.forwards.addTooltip"));
    fireEvent.change(await screen.findByPlaceholderText("users.forwards.placeholder"), { target: { value: "bob@example.com" } });
  };

  it("only forwards when the copy is unticked, and says so", async () => {
    mocks.api.addUserForward.mockResolvedValue(undefined);
    render(<UserForwards username={ALICE} />);
    await addThroughDialog();

    fireEvent.click(screen.getByRole("checkbox", { name: /users.forwards.keepCopyIn/ }));
    expect(screen.getByText(/users.forwards.onlyForwardedHint/)).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "common.add" }));

    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith({ title: "users.forwards.added" }));
    expect(mocks.api.addUserForward).toHaveBeenCalledTimes(1);
    expect(mocks.api.addUserForward).toHaveBeenCalledWith(ALICE, "bob@example.com");
  });

  it("does not ask again when a copy is already kept", async () => {
    mocks.api.getUserForwards.mockResolvedValue([{ mailAddress: ALICE }, { mailAddress: "emma@example.com" }]);
    render(<UserForwards username={ALICE} />);
    await addThroughDialog();

    expect(screen.queryByRole("checkbox", { name: /users.forwards.keepCopyIn/ })).toBeNull();
  });

  it("does not report success when keeping the copy is refused", async () => {
    mocks.api.addUserForward.mockImplementation(async (_user: string, destination: string) => {
      if (destination === ALICE) throw new Error("Forbidden");
    });
    render(<UserForwards username={ALICE} />);
    await addThroughDialog();
    fireEvent.click(screen.getByRole("button", { name: "common.add" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it("lists only the other destinations and warns when no copy is kept", async () => {
    mocks.api.getUserForwards.mockResolvedValue([{ mailAddress: "emma@example.com" }]);
    render(<UserForwards username={ALICE} />);
    fireEvent.click(screen.getByText("users.forwards.title"));

    expect(await screen.findByText(/users.forwards.onlyForwarded /)).not.toBeNull();
    expect(screen.getByText("(1)")).not.toBeNull();
  });

  it("does not count nor list the user's own address", async () => {
    mocks.api.getUserForwards.mockResolvedValue([{ mailAddress: ALICE }, { mailAddress: "emma@example.com" }]);
    render(<UserForwards username={ALICE} />);
    fireEvent.click(screen.getByText("users.forwards.title"));

    expect(await screen.findByText("emma@example.com")).not.toBeNull();
    expect(screen.getByText("(1)")).not.toBeNull();
    expect(screen.queryByText(ALICE)).toBeNull();
    expect(screen.queryByText(/users.forwards.onlyForwarded /)).toBeNull();
  });
});

describe("user forwards: destinations", () => {
  it("links a local destination to its user page, not an external one", async () => {
    mocks.api.getUserForwards.mockResolvedValue([{ mailAddress: "emma@example.com" }, { mailAddress: "someone@gmail.com" }]);
    render(<UserForwards username={ALICE} />);
    fireEvent.click(screen.getByText("users.forwards.title"));

    expect((await screen.findByRole("link", { name: "emma@example.com" })).getAttribute("href")).toBe("/users/user/emma%40example.com");
    expect(screen.getByText("someone@gmail.com").closest("a")).toBeNull();
  });
});
