import { useCallback } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useFetchData } from "@/hooks/use-fetch-data";
import { useIsAllowed } from "@/lib/proxy-resolver-context";
import { getUsers } from "@/modules/users/api-client";

// One more than a page tells "more than 50" without listing the whole domain
export const USERS_PROBE_LIMIT = 51;

/** How many users the domain has, as a chip opening the Users list filtered on it. */
export function DomainSummary({ domain }: { domain: string }) {
  const { t } = useTranslation();
  const canListUsers = useIsAllowed("GET", "/users?domain={domain}&{params}");
  const fetchUsers = useCallback(() => getUsers({ domain, limit: USERS_PROBE_LIMIT }), [domain]);
  const { data: users, isLoading, error } = useFetchData(canListUsers ? fetchUsers : null);

  if (!canListUsers || error) return null;
  const count = users == null || isLoading
    ? "…"
    : users.length >= USERS_PROBE_LIMIT ? `${USERS_PROBE_LIMIT - 1}+` : String(users.length);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Link
        to={`/users?domain=${encodeURIComponent(domain)}`}
        className="text-left text-sm px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50 hover:border-blue-400 transition"
      >
        {t("domains.summary.users", { count })}
      </Link>
    </div>
  );
}
