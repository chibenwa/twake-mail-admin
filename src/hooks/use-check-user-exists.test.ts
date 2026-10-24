// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const head = vi.hoisted(() => vi.fn());
vi.mock("@/lib/apiClient", () => ({ apiClient: { head } }));

import { useCheckUserExists } from "./use-check-user-exists";

afterEach(() => head.mockReset());

describe("useCheckUserExists", () => {
  it.each(["not an email", "alice@", "@example.com", "a@b@example.com"])("calls %s invalid without asking the server", async (username) => {
    head.mockRejectedValue({ response: { status: 404 } });
    const { result } = renderHook(() => useCheckUserExists(username));

    await waitFor(() => expect(result.current).toBe("invalid"));
    expect(head).not.toHaveBeenCalled();
  });

  it("reports an unknown well-formed address as not found", async () => {
    head.mockRejectedValue({ response: { status: 404 } });
    const { result } = renderHook(() => useCheckUserExists("ghost@example.com"));

    await waitFor(() => expect(result.current).toBe("not_found"));
    expect(head).toHaveBeenCalledWith("/users/ghost%40example.com");
  });

  it("reports an existing user", async () => {
    head.mockResolvedValue({});
    const { result } = renderHook(() => useCheckUserExists("bob"));

    await waitFor(() => expect(result.current).toBe("exists"));
  });
});
