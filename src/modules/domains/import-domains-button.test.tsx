// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));
vi.mock("./api-client", () => ({ createDomain: vi.fn(), getDomains: vi.fn() }));

import ImportDomainsButton from "./import-domains-button";

afterEach(cleanup);

describe("import domains", () => {
  it("opens a modal showing the expected file format before picking the file", () => {
    render(<ImportDomainsButton onImported={() => {}} />);
    expect(screen.queryByText("domains.import.help")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "domains.import.button" }));

    expect(screen.getByText("domains.import.title")).toBeTruthy();
    expect(screen.getByText("domains.import.help")).toBeTruthy();
    expect(screen.getByRole("button", { name: "domains.import.chooseFile" })).toBeTruthy();
  });
});
