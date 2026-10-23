// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PaginationControls } from "./pagination-controls";

afterEach(cleanup);

const renderControls = (disabledPrev: boolean, disabledNext: boolean) =>
  render(
    <PaginationControls
      onFirst={() => {}} onPrev={() => {}} onNext={() => {}} onLast={() => {}}
      disabledPrev={disabledPrev} disabledNext={disabledNext}
      label="Page 1 / 2 — Total: 55" total={55}
    />
  );

describe("pagination controls", () => {
  it("shows only the total when everything fits on one page", () => {
    renderControls(true, true);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByText("common.totalOnly")).toBeTruthy();
  });

  it("outlines every button, the primary style being for actions", () => {
    renderControls(true, false);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
    for (const button of buttons) expect(button.className).not.toContain("bg-primary");
    expect(buttons.map((b) => (b as HTMLButtonElement).disabled)).toEqual([true, true, false, false]);
  });
});
