import { describe, expect, it } from "vitest";
import { parseMailboxPath } from "./mailbox-path";

describe("mailbox path", () => {
  it("tells the owner and the mailbox of a private path", () => {
    expect(parseMailboxPath("#private:charlotte@example.com:INBOX")).toEqual({ owner: "charlotte@example.com", mailbox: "INBOX" });
    expect(parseMailboxPath("#private:bob@example.com:Archive.2024")).toEqual({ owner: "bob@example.com", mailbox: "Archive.2024" });
  });

  it("returns null for another namespace", () => {
    expect(parseMailboxPath("#team:sales@example.com:INBOX")).toBeNull();
    expect(parseMailboxPath("INBOX")).toBeNull();
  });
});
