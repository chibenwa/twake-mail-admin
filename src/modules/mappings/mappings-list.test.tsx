// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

const api = vi.hoisted(() => ({
  getMappings: vi.fn(async () => ({ "alice@example.com": [{ type: "Alias", mapping: "al@example.com" }] })),
  createAddressMapping: vi.fn(async () => undefined),
  createDomainMapping: vi.fn(),
  createRegexMapping: vi.fn(),
  deleteAddressMapping: vi.fn(),
  deleteAliasMapping: vi.fn(),
  deleteForwardMapping: vi.fn(),
  deleteGroupMapping: vi.fn(),
  deleteDomainMapping: vi.fn(),
  deleteRegexMapping: vi.fn(),
}));
vi.mock("./api-client", () => api);
vi.mock("@/lib/proxy-resolver-context", () => ({ useIsAllowed: () => true }));
vi.mock("@/hooks/use-confirm", () => ({ useConfirm: () => vi.fn(async () => false) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

import MappingsList from "./mappings-list";

afterEach(cleanup);

describe("mappings list: one toolbar line", () => {
  it("puts the search and one Add button on one line, the kind chosen in the modal", async () => {
    render(<MemoryRouter><MappingsList /></MemoryRouter>);
    await screen.findByText("alice@example.com");
    const toolbar = screen.getByPlaceholderText("mappings.searchPlaceholder").closest("[data-list-toolbar]")!;
    const add = screen.getByRole("button", { name: "mappings.addTitle" });
    expect(toolbar.contains(add)).toBe(true);

    fireEvent.click(add);
    expect(Array.from((screen.getByLabelText("mappings.type") as HTMLSelectElement).options).map((o) => o.value)).toEqual(["address", "regex", "domain"]);
    fireEvent.change(screen.getByLabelText("mappings.source"), { target: { value: "a@example.com" } });
    fireEvent.change(screen.getByLabelText("mappings.destination"), { target: { value: "b@example.com" } });
    fireEvent.submit(screen.getByLabelText("mappings.source").closest("form")!);

    await vi.waitFor(() => expect(api.createAddressMapping).toHaveBeenCalledWith("a@example.com", "b@example.com"));
  });
});

describe("mappings list: a forward kept as a copy", () => {
  it("names the forward of an address to itself as a kept copy", async () => {
    api.getMappings.mockResolvedValueOnce({
      "bob@example.com": [{ type: "Forward", mapping: "bob@example.com" }, { type: "Forward", mapping: "emma@example.com" }],
    } as never);
    render(<MemoryRouter><MappingsList /></MemoryRouter>);

    expect(await screen.findByText("mappings.forwardCopyKept")).not.toBeNull();
    expect(screen.getAllByText("Forward")).toHaveLength(1);
  });
});
