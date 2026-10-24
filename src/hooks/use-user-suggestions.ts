import { useEffect, useState } from "react";
import { listUsernames } from "@/modules/users/api-client";
import { applyUsersRequest } from "@/modules/users/users-paging";
import { useDomain } from "@/modules/domain-admin/domain-context";
import { useIsAllowed } from "@/lib/proxy-resolver-context";
import { useDebouncedValue } from "./use-debounced-value";

export const MAX_USER_SUGGESTIONS = 5;
// A shorter prefix matches too many users: it would load the server for little help
export const MIN_SUGGEST_LENGTH = 3;
const SUGGEST_DEBOUNCE_MS = 250;

/**
 * Up to five usernames starting with what the admin typed, from `GET /users?query&limit`
 * (scoped to the domain in DOMAIN mode). Only a suggestion: nothing is suggested without
 * the right to list users, and a failed request simply suggests nothing.
 */
export function useUserSuggestions(text: string, enabled = true): string[] {
  const domain = useDomain();
  const canList = useIsAllowed("GET", domain ? "/users?domain={domain}&{params}" : "/users");
  const query = useDebouncedValue(text.trim(), SUGGEST_DEBOUNCE_MS);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled || !canList || query.length < MIN_SUGGEST_LENGTH) {
      setSuggestions([]);
      return;
    }
    let current = true;
    const request = { query, domain, limit: MAX_USER_SUGGESTIONS };
    Promise.resolve()
      .then(() => listUsernames({ query, domain: domain || undefined, limit: MAX_USER_SUGGESTIONS }))
      // Backends ignoring the parameters return everything: filtered and capped here too
      .then((usernames) => { if (current) setSuggestions(applyUsersRequest(usernames, request)); })
      .catch(() => { if (current) setSuggestions([]); });
    return () => { current = false; };
  }, [query, domain, canList, enabled]);

  return suggestions;
}
