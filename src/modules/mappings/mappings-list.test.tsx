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
  it("puts the search and the add buttons on one line, adding in a modal", async () => {
    render(<MemoryRouter><MappingsList /></MemoryRouter>);
    await screen.findByText("alice@example.com");
    const toolbar = screen.getByPlaceholderText("mappings.searchPlaceholder").closest("[data-list-toolbar]")!;
    const add = screen.getByRole("button", { name: "mappings.addAddress" });
    expect(toolbar.contains(add)).toBe(true);
    expect(toolbar.contains(screen.getByRole("button", { name: "mappings.addRegex" }))).toBe(true);

    fireEvent.click(add);
    fireEvent.change(screen.getByLabelText("mappings.source"), { target: { value: "a@example.com" } });
    fireEvent.change(screen.getByLabelText("mappings.destination"), { target: { value: "b@example.com" } });
    fireEvent.submit(screen.getByLabelText("mappings.source").closest("form")!);

    await vi.waitFor(() => expect(api.createAddressMapping).toHaveBeenCalledWith("a@example.com", "b@example.com"));
  });
});
