// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import FormDialog from "./form-dialog";

afterEach(cleanup);

const renderDialog = (onSubmit: () => unknown, onClose = vi.fn()) => {
  render(
    <FormDialog open onClose={onClose} title="Add" submitLabel="Save" onSubmit={onSubmit}>
      <input aria-label="name" defaultValue="bob" />
    </FormDialog>
  );
  return onClose;
};

describe("form dialog", () => {
  it("closes once the submission succeeds", async () => {
    const onClose = renderDialog(async () => undefined);
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("stays open with the typed values and shows a refusal", async () => {
    const onClose = renderDialog(async () => { throw new Error("Domain already exists"); });
    fireEvent.click(screen.getByText("Save"));
    expect((await screen.findByRole("alert")).textContent).toContain("Domain already exists");
    expect((screen.getByLabelText("name") as HTMLInputElement).value).toBe("bob");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("stays open silently when the submission returns false", async () => {
    const onSubmit = vi.fn(async () => false);
    const onClose = renderDialog(onSubmit);
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
