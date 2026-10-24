import { describe, expect, it } from "vitest";
import { groupDisplayName } from "./group-name";

describe("group display name", () => {
  it("keeps the last segment of the class name", () => {
    expect(groupDisplayName("org.apache.james.vault.DeletedMessageVaultDeletionListener$DeletedMessageVaultListenerGroup"))
      .toBe("DeletedMessageVaultListenerGroup");
    expect(groupDisplayName("org.apache.james.mailbox.quota.QuotaListenerGroup")).toBe("QuotaListenerGroup");
    expect(groupDisplayName("SimpleGroup")).toBe("SimpleGroup");
  });
});
