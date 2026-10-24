import { ReactNode, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useFetchData } from "@/hooks/use-fetch-data";
import { useIsAllowed } from "@/lib/proxy-resolver-context";
import { formatByteSize } from "@/i18n/format-size";
import { formatPercent } from "@/i18n/format-percent";
import { useRevealSection, useSectionFacts } from "@/components/custom/collapsible-section";
import { getUserQuota, getUserVacation } from "../api-client";
import { UserQuota, VacationSettings } from "../types";
import type { ForwardsFact } from "./user-forwards";

// Same thresholds as the quota bars of the sections
const quotaBarClass = (ratio: number) => (ratio > 0.9 ? "bg-red-500" : ratio >= 0.7 ? "bg-amber-500" : "bg-green-500");

function Fact({ section, children }: { section: string; children: ReactNode }) {
  const reveal = useRevealSection();
  return (
    <button
      type="button"
      onClick={() => reveal(section)}
      className="text-left text-sm px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50 hover:border-blue-400 transition"
    >
      {children}
    </button>
  );
}

const Strip = ({ children }: { children: ReactNode }) => (
  <div className="mt-3 flex flex-wrap items-center gap-2">{children}</div>
);

const countOf = (value: unknown) => (typeof value === "number" ? value : undefined);

/** The essential facts of a mail user, each opening and scrolling to its section. */
export function MailUserSummary({ username }: { username: string }) {
  const { t } = useTranslation();
  const facts = useSectionFacts();
  const canQuota = useIsAllowed("GET", "/quota/users/{username}");
  const canVacation = useIsAllowed("GET", "/vacation/{username}");
  const fetchQuota = useCallback(() => getUserQuota(username), [username]);
  const fetchVacation = useCallback(() => getUserVacation(username), [username]);
  const { data: quota } = useFetchData<UserQuota>(canQuota ? fetchQuota : null);
  const { data: vacation } = useFetchData<VacationSettings>(canVacation ? fetchVacation : null);

  const mailboxes = countOf(facts["mailboxes"]);
  const aliases = countOf(facts["aliases"]);
  const forwards = facts["forwards"] as ForwardsFact | undefined;
  const limit = quota?.computed?.size;

  return (
    <Strip>
      {quota && (
        <Fact section="quota">
          {limit != null && limit >= 0 ? (
            <span className="flex flex-col gap-1">
              <span>{t("users.summary.quota", { used: formatByteSize(quota.occupation.size), limit: formatByteSize(limit), percent: formatPercent(quota.occupation.ratio.size) })}</span>
              <span className="block h-1 w-full rounded-full bg-gray-200" aria-hidden="true">
                <span className={`block h-1 rounded-full ${quotaBarClass(quota.occupation.ratio.size)}`} style={{ width: `${Math.min(quota.occupation.ratio.size * 100, 100)}%` }} />
              </span>
            </span>
          ) : t("users.summary.quotaUnlimited", { used: formatByteSize(quota.occupation.size) })}
        </Fact>
      )}
      {mailboxes !== undefined && <Fact section="mailboxes">{t("users.summary.mailboxes", { count: mailboxes })}</Fact>}
      {aliases !== undefined && <Fact section="aliases">{t("users.summary.aliases", { count: aliases })}</Fact>}
      {forwards !== undefined && (
        <Fact section="forwards">
          {!forwards.copyKept
            ? t("users.summary.forwardsNoCopy", { count: forwards.destinations.length })
            : forwards.destinations.length === 1
              ? t("users.summary.forwardsTo", { address: forwards.destinations[0].mailAddress })
              : t("users.summary.forwards", { count: forwards.destinations.length })}
        </Fact>
      )}
      {vacation && (
        <Fact section="vacation">{vacation.enabled ? t("users.summary.vacationOn") : t("users.summary.vacationOff")}</Fact>
      )}
    </Strip>
  );
}

/** The calendar counterpart: what the sections of the page counted. */
export function CalendarUserSummary() {
  const { t } = useTranslation();
  const facts = useSectionFacts();
  const calendars = countOf(facts["calendars"]);
  const addressBooks = countOf(facts["address-books"]);
  const bookingLinks = countOf(facts["booking-links"]);
  return (
    <Strip>
      {calendars !== undefined && <Fact section="calendars">{t("users.summary.calendars", { count: calendars })}</Fact>}
      {addressBooks !== undefined && <Fact section="address-books">{t("users.summary.addressBooks", { count: addressBooks })}</Fact>}
      {bookingLinks !== undefined && <Fact section="booking-links">{t("users.summary.bookingLinks", { count: bookingLinks })}</Fact>}
    </Strip>
  );
}
