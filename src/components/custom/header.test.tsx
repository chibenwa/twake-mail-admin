// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

vi.mock("@/lib/config", () => ({ appConfig: { application: "CALENDAR", mode: "GLOBAL", sso: null } }));

import Header from "./header";

afterEach(cleanup);

describe("header", () => {
  it("renders the title as the h1 of the page", () => {
    render(<MemoryRouter><Header headerTitle="Title" docuUrl="" /></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Title");
  });

  it("names the browser tab after the title", () => {
    render(<MemoryRouter><Header headerTitle="alice@example.com" /></MemoryRouter>);
    expect(document.title).toBe("alice@example.com — Twake Calendar Admin");
  });

  it("leads back to the parent page with one link holding the chevron and its name", () => {
    render(
      <MemoryRouter>
        <Header headerTitle="sales@example.com" breadcrumb={[{ label: "Domains", to: "/domains" }, { label: "example.com", to: "/domains/domain/example.com" }]} />
      </MemoryRouter>
    );
    const nav = screen.getByRole("navigation", { name: "common.breadcrumb" });
    const links = Array.from(nav.querySelectorAll("a"));
    expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([["example.com", "/domains/domain/example.com"]]);
    expect(links[0].querySelector("svg")).not.toBeNull();
  });

  it("renders no breadcrumb on a list page", () => {
    render(<MemoryRouter><Header headerTitle="Title" /></MemoryRouter>);
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("links the subtitle to the documentation", () => {
    render(
      <MemoryRouter>
        <Header headerTitle="Title" headerSubTitle="Subtitle" docuUrl="https://example.com" />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: "doc" }).getAttribute("href")).toBe("https://example.com");
  });

  it("renders no doc link when there is no documentation", () => {
    render(
      <MemoryRouter>
        <Header headerTitle="Title" headerSubTitle="Subtitle" docuUrl="" />
      </MemoryRouter>
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Subtitle")).toBeTruthy();
  });
});
