// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import TaskRow from "./task-row";

afterEach(cleanup);

describe("task row", () => {
  it("runs the task from an outlined button without badge when safe", () => {
    const onRun = vi.fn();
    render(<TaskRow title="Reindex" onRun={onRun} />);
    const button = screen.getByRole("button", { name: "common.run" });
    expect(button.className).toContain("border");
    expect(screen.queryByText("tasks.risk.caution")).toBeNull();
    fireEvent.click(button);
    expect(onRun).toHaveBeenCalledOnce();
  });

  it("states in words that a caution task modifies data", () => {
    render(<TaskRow title="Rename user" risk="caution" onRun={() => {}} />);
    expect(screen.getByText("tasks.risk.caution")).not.toBeNull();
    expect(screen.getByRole("button", { name: "common.run" }).className).toContain("text-amber-800");
  });

  it("states in words that a destructive task deletes data, on a red button", () => {
    render(<TaskRow title="Delete user data" risk="destructive" onRun={() => {}} />);
    expect(screen.getByText("tasks.risk.destructive")).not.toBeNull();
    expect(screen.getByRole("button", { name: "common.run" }).className).toContain("bg-destructive");
  });

  it("uses none of the low-contrast colours", () => {
    for (const risk of ["safe", "caution", "destructive"] as const) {
      const { unmount } = render(<TaskRow title="Task" risk={risk} onRun={() => {}} />);
      expect(screen.getByRole("button").className).not.toMatch(/bg-(green-400|yellow-500|orange-500)/);
      unmount();
    }
  });
});
