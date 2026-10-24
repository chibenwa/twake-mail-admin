// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => (options?.domain ? `${key}:${options.domain}` : key),
  }),
}));

import { appliedLevel, isLimited, QuotaLevel, QuotaLevelRows, QuotaOccupation } from "./quota-levels";

const MB = 1024 * 1024;
const levels = (user: QuotaLevel["values"], domain: QuotaLevel["values"], global: QuotaLevel["values"]): QuotaLevel[] => [
  { source: "user", label: "User", values: user },
  { source: "domain", label: "Domain example.com", values: domain, domain: "example.com" },
  { source: "global", label: "Global", values: global },
];
const OCCUPATION = { count: 2, size: 1100, ratio: { count: 0.002, size: 0.01, max: 0.01 } };

afterEach(cleanup);

describe("quota levels", () => {
  it("applies the most specific level setting each limit", () => {
    const set = levels({ count: 1000, size: null }, { count: null, size: 2048 * MB }, null);
    expect(appliedLevel(set, "count")?.source).toBe("user");
    expect(appliedLevel(set, "size")?.source).toBe("domain");
    expect(isLimited(set)).toBe(true);
  });

  it("says where each applied limit comes from, and — for a level setting nothing", () => {
    render(<QuotaLevelRows levels={levels({ count: 1000, size: null }, { count: null, size: 2048 * MB }, null)} />);
    expect(screen.getByText("quota.fromUser")).not.toBeNull();
    expect(screen.getByText("quota.fromDomain:example.com")).not.toBeNull();
    expect(screen.getAllByText("—")).toHaveLength(4);
  });

  it("reads unlimited, without a ratio, when no limit is set anywhere", () => {
    const none = levels(null, null, { count: null, size: null });
    render(<><QuotaLevelRows levels={none} /><QuotaOccupation occupation={OCCUPATION} limited={isLimited(none)} /></>);
    expect(screen.getAllByText("quota.noLimitSet")).toHaveLength(2);
    expect(screen.queryByText("common.ratio")).toBeNull();
  });

  it("names a limit explicitly set to unlimited after its level", () => {
    const set = levels({ count: -1, size: -1 }, null, null);
    render(<QuotaLevelRows levels={set} />);
    expect(isLimited(set)).toBe(false);
    expect(screen.getAllByText("quota.fromUser")).toHaveLength(2);
  });
});
