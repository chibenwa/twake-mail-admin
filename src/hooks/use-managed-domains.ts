import { useEffect, useState } from "react";
import { useIsAllowed } from "@/lib/proxy-resolver-context";
import { useDomain } from "@/modules/domain-admin/domain-context";
import { getDomains } from "@/modules/domains/api-client";

// Read once per session: the domains change rarely, and many links ask at the same time
let cached: Promise<string[]> | null = null;

/** Forgets the domains read, e.g. once a domain was created or deleted. */
export function forgetManagedDomains() {
  cached = null;
}

/**
 * The domains this server manages, lower-cased; null while unknown (loading, refused or
 * failed). In DOMAIN mode, the administered domain.
 */
export function useManagedDomains(): Set<string> | null {
  const scopedDomain = useDomain();
  const canList = useIsAllowed("GET", "/domains") && !scopedDomain;
  const [domains, setDomains] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!canList) return;
    let active = true;
    cached ??= getDomains().catch((err) => {
      cached = null;
      throw err;
    });
    cached
      .then((list) => { if (active) setDomains(new Set(list.map((d) => d.toLowerCase()))); })
      .catch(() => { /* unknown: the links are not filtered */ });
    return () => { active = false; };
  }, [canList]);

  if (scopedDomain) return new Set([scopedDomain.toLowerCase()]);
  return domains;
}
