import { Link, useSearchParams } from "react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PaginationControls } from "@/components/custom/pagination-controls";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { PAGE_LIMIT } from "@/lib/search-pagination";
import { UsernamesSource } from "./users-paging";
import { useUsersPages } from "./use-users-pages";
import ListToolbar from "@/components/custom/list-toolbar";

const SEARCH_DEBOUNCE_MS = 300;

interface PagedUsersListProps {
  source: UsernamesSource;
  /** Restricts the list to this domain. */
  domain?: string;
  /** Domains offered in a selector, when the list is not restricted to one domain. */
  domainChoices?: string[];
}

export function PagedUsersList({ source, domain, domainChoices = [] }: PagedUsersListProps) {
  const { t } = useTranslation();
  // The search and the domain filter live in the URL, so that Back from a user page, a bookmark
  // or a link (/users?domain=example.org) restores them; the page anchor stays in memory
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const selectedDomain = searchParams.get("domain") ?? "";
  const updateParam = (key: "q" | "domain", value: string, replace: boolean) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value); else next.delete(key);
      return next;
    }, { replace });
  };
  // Typing replaces the history entry, a new domain pushes one
  const setSearch = (value: string) => updateParam("q", value, true);
  const setSelectedDomain = (value: string) => updateParam("domain", value, false);
  const query = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const pages = useUsersPages(source, { query, domain: domain ?? selectedDomain }, PAGE_LIMIT);
  const prefix = query.trim();
  const isEmpty = !pages.isLoading && !pages.error && pages.usernames.length === 0;
  const sortedDomainChoices = useMemo(() => [...domainChoices].sort((a, b) => a.localeCompare(b)), [domainChoices]);

  return (
    <div>
      <ListToolbar search={search} onSearch={setSearch} placeholder={t("users.searchPlaceholder")} title={t("users.searchHint")}>
        {!domain && domainChoices.length > 0 && (
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            aria-label={t("common.domain")}
            className="h-10 max-w-full px-3 border rounded-md bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t("users.allDomains")}</option>
            {sortedDomainChoices.map((choice) => (
              <option key={choice} value={choice}>{choice}</option>
            ))}
          </select>
        )}
      </ListToolbar>
      {pages.isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="h-[58px] rounded-2 animate-pulse bg-gray-200" />
          <div className="h-[58px] rounded-2 animate-pulse bg-gray-200" />
          <div className="h-[58px] rounded-2 animate-pulse bg-gray-200" />
        </div>
      )}
      {pages.error && <p className="text-red-500 mt-4">{t("common.errorPrefix", { message: pages.error })}</p>}

      {(pages.hasPrevious || pages.hasNext) && (
        <PaginationControls
          onFirst={pages.first}
          onPrev={pages.previous}
          onNext={pages.next}
          disabledPrev={!pages.hasPrevious || pages.isLoading}
          disabledNext={!pages.hasNext || pages.isLoading}
          label={t("common.pageSimple", { page: pages.pageNumber })}
        />
      )}
      {isEmpty && (
        <p className="text-gray-500 mt-4">{prefix ? t("users.noMatch", { query: prefix }) : t("users.empty")}</p>
      )}
      <div>
        {pages.usernames.map((username, index) => (
          <div key={username} className="space-y-1 p-4 bg-white rounded-2 my-4 flex justify-between items-center transition-colors hover:bg-gray-50">
            <h4 className="min-w-0 text-sm font-medium leading-none break-all">
              <span className="text-gray-500 mr-2">{pages.offset + index + 1}/</span>
              <Link to={`/users/user/${encodeURIComponent(username)}`} className="text-blue-600 hover:underline">
                {username}
              </Link>
            </h4>
          </div>
        ))}
      </div>
    </div>
  );
}
