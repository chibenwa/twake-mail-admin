// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

const confirm = vi.hoisted(() => vi.fn(async (_options: Record<string, unknown>) => false));
const getUsers = vi.hoisted(() => vi.fn());
const getDomainAliases = vi.hoisted(() => vi.fn());
vi.mock("@/modules/users/api-client", () => ({ getUsers }));
vi.mock("@/hooks/use-confirm", () => ({ useConfirm: () => confirm }));
vi.mock("@/lib/proxy-resolver-context", () => ({ useIsAllowed: () => true }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }), toast: vi.fn() }));
vi.mock("./api-client", () => ({
  getDomains: vi.fn(async () => ["example.com", "example.org"]),
  createDomain: vi.fn(),
  deleteDomain: vi.fn(),
  getDomainAliases,
}));

import DomainsList from "./domains-list";

async function renderList() {
  render(
    <MemoryRouter>
      <DomainsList />
    </MemoryRouter>
  );
  await screen.findByText("example.com");
}

function search(query: string) {
  fireEvent.change(screen.getByPlaceholderText("domains.searchPlaceholder"), { target: { value: query } });
}

afterEach(() => {
  cleanup();
  confirm.mockClear();
});

describe("domains list: search", () => {
  it("lists the matching domains without an empty-state message", async () => {
    await renderList();
    search("ORG");
    expect(screen.getByText("example.org")).not.toBeNull();
    expect(screen.queryByText("example.com")).toBeNull();
    expect(screen.queryByText("domains.noMatch")).toBeNull();
  });

  it("tells when no domain matches the search", async () => {
    await renderList();
    search("zzz");
    expect(screen.getByText("domains.noMatch")).not.toBeNull();
    expect(screen.queryByText("example.com")).toBeNull();
  });

  it("restores the list when the search is cleared", async () => {
    await renderList();
    search("zzz");
    search("");
    expect(screen.getByText("example.com")).not.toBeNull();
    expect(screen.queryByText("domains.noMatch")).toBeNull();
  });
});

describe("domains list: one toolbar line", () => {
  it("puts the search, Create a domain and Import on the same line", async () => {
    await renderList();
    const searchField = screen.getByPlaceholderText("domains.searchPlaceholder");
    const toolbar = searchField.closest("[data-list-toolbar]")!;
    expect(toolbar.contains(screen.getByRole("button", { name: "domains.createButton" }))).toBe(true);
    expect(toolbar.contains(screen.getByRole("button", { name: "domains.import.button" }))).toBe(true);
  });

  it("creates a domain from its modal, Enter included", async () => {
    const { createDomain } = await import("./api-client");
    await renderList();
    fireEvent.click(screen.getByRole("button", { name: "domains.createButton" }));
    const field = screen.getByLabelText("domains.domainName");
    fireEvent.change(field, { target: { value: "qa-create.org" } });

    fireEvent.submit(field.closest("form")!);

    await vi.waitFor(() => expect(createDomain).toHaveBeenCalledWith("qa-create.org"));
  });
});

describe("domains list: delete tells what the domain still holds", () => {
  const openDelete = async (domain: string) => {
    await renderList();
    const row = screen.getByText(domain).closest("div.flex")!;
    fireEvent.click(row.querySelector("button")!);
    await vi.waitFor(() => expect(confirm).toHaveBeenCalled());
    return confirm.mock.calls[0][0];
  };

  it("keeps one confirmation for an empty domain", async () => {
    getUsers.mockResolvedValue([]);
    getDomainAliases.mockResolvedValue([]);
    const options = await openDelete("example.com");
    expect(options.typeToConfirm).toBeUndefined();
    expect(options.consequence).toBeUndefined();
    render(<>{options.message as never}</>);
    expect(screen.getByText("domains.deleteConfirm")).not.toBeNull();
  });

  it("states the users and aliases left and asks to type the domain", async () => {
    getUsers.mockResolvedValue([{ username: "olivia@example.org" }, { username: "oscar@example.org" }]);
    getDomainAliases.mockResolvedValue([{ source: "example.net" }]);
    const options = await openDelete("example.org");
    expect(options.typeToConfirm).toBe("example.org");
    expect(options.typeToConfirmIgnoreCase).toBe(true);
    expect(getUsers).toHaveBeenCalledWith({ domain: "example.org", limit: 51 });
    cleanup();
    render(<MemoryRouter>{options.consequence as never}{options.message as never}</MemoryRouter>);
    expect(screen.getByText(/domains.delete.stillBoth/)).not.toBeNull();
    expect(screen.getByRole("link", { name: "domains.delete.seeUsers" }).getAttribute("href")).toBe("/users?domain=example.org");
  });

  it("still opens the dialog, saying it could not check, when the lookup fails", async () => {
    getUsers.mockRejectedValue(new Error("boom"));
    getDomainAliases.mockResolvedValue([]);
    const options = await openDelete("example.com");
    render(<>{options.message as never}</>);
    expect(screen.getByText("domains.delete.couldNotCheck")).not.toBeNull();
  });
});
