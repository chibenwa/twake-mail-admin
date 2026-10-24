// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";

const mocks = vi.hoisted(() => ({
  listUsernames: vi.fn(),
  allowed: new Set<string>(),
  domain: "",
}));
vi.mock("@/modules/users/api-client", () => ({ listUsernames: mocks.listUsernames }));
vi.mock("@/lib/proxy-resolver-context", () => ({ useIsAllowed: (_verb: string, pattern: string) => mocks.allowed.has(pattern) }));
vi.mock("@/modules/domain-admin/domain-context", () => ({ useDomain: () => mocks.domain }));

import UserSuggestInput from "./user-suggest-input";

function Field({ onEnter }: { onEnter?: () => void }) {
  const [value, setValue] = useState("");
  return (
    <UserSuggestInput
      aria-label="user"
      value={value}
      onValueChange={setValue}
      onKeyDown={(e) => { if (e.key === "Enter") onEnter?.(); }}
    />
  );
}

const field = () => screen.getByRole("combobox", { name: "user" }) as HTMLInputElement;
const type = (text: string) => { fireEvent.focus(field()); fireEvent.change(field(), { target: { value: text } }); };

beforeEach(() => {
  mocks.listUsernames.mockReset().mockResolvedValue(["alice@example.com", "albert@example.com"]);
  mocks.allowed = new Set(["/users"]);
  mocks.domain = "";
});
afterEach(cleanup);

describe("user suggestions", () => {
  it("offers up to five matching users from GET /users?query&limit, without blocking the typing", async () => {
    render(<Field />);
    type("al");

    expect(await screen.findByRole("option", { name: "alice@example.com" })).toBeTruthy();
    expect(mocks.listUsernames).toHaveBeenCalledWith({ query: "al", domain: undefined, limit: 5 });
    expect(field().value).toBe("al");
  });

  it("filters and caps what a backend ignoring the parameters returns", async () => {
    mocks.listUsernames.mockResolvedValue(["bob@example.com", "al1@x", "al2@x", "al3@x", "al4@x", "al5@x", "al6@x"]);
    render(<Field />);
    type("al");

    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(5));
    expect(screen.queryByRole("option", { name: "bob@example.com" })).toBeNull();
  });

  it("picks a suggestion with the arrows and Enter, which then neither adds nor submits", async () => {
    const onEnter = vi.fn();
    render(<Field onEnter={onEnter} />);
    type("al");
    await screen.findByRole("option", { name: "alice@example.com" });

    fireEvent.keyDown(field(), { key: "ArrowDown" });
    fireEvent.keyDown(field(), { key: "Enter" });

    // Sorted: albert before alice
    expect(field().value).toBe("albert@example.com");
    expect(onEnter).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("lets Enter through when no suggestion is highlighted", async () => {
    const onEnter = vi.fn();
    render(<Field onEnter={onEnter} />);
    type("al");
    await screen.findByRole("listbox");

    fireEvent.keyDown(field(), { key: "Enter" });

    expect(onEnter).toHaveBeenCalled();
  });

  it("picks a suggestion with the mouse", async () => {
    render(<Field />);
    type("al");
    fireEvent.mouseDown(await screen.findByRole("option", { name: "albert@example.com" }));
    expect(field().value).toBe("albert@example.com");
  });

  it("passes the domain in DOMAIN mode, gated by the domain-scoped listing", async () => {
    mocks.domain = "example.com";
    mocks.allowed = new Set(["/users?domain={domain}&{params}"]);
    render(<Field />);
    type("al");

    await screen.findByRole("listbox");
    expect(mocks.listUsernames).toHaveBeenCalledWith({ query: "al", domain: "example.com", limit: 5 });
  });

  it("suggests nothing, and requests nothing, when listing users is not allowed", async () => {
    mocks.allowed = new Set();
    render(<Field />);
    type("al");

    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(mocks.listUsernames).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(field().getAttribute("aria-expanded")).toBe("false");
  });

  it("does not fall back to the global listing in DOMAIN mode", async () => {
    mocks.domain = "example.com";
    mocks.allowed = new Set(["/users"]);
    render(<Field />);
    type("al");

    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(mocks.listUsernames).not.toHaveBeenCalled();
  });
});
