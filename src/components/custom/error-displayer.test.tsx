// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ErrorDisplayer from "./error-displayer";

afterEach(cleanup);

describe("error displayer", () => {
  it("labels the untranslated message as the server's, and keeps it selectable", () => {
    render(<ErrorDisplayer error={new Error("User does not exist")} />);
    const message = screen.getByText("User does not exist");
    expect(screen.getByText("common.serverMessage")).toBeTruthy();
    expect(message.parentElement!.className).toContain("select-text");
  });
});
