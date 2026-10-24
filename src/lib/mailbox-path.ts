/**
 * A mailbox path as James serializes it, "#private:charlotte@example.com:INBOX": its owner
 * and its name; null when the path is not of a user's private namespace.
 */
export function parseMailboxPath(path: string): { owner: string; mailbox: string } | null {
  const match = /^#private:([^:]+):(.*)$/.exec(path);
  return match ? { owner: match[1], mailbox: match[2] } : null;
}
