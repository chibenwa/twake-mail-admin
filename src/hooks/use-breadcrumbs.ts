import { useTranslation } from "react-i18next";
import type { BreadcrumbItem } from "@/components/custom/header";
import { useDomain } from "@/modules/domain-admin/domain-context";

/**
 * The parents of each detail page, shared so that every page leads back the same way. In
 * DOMAIN mode there is no domain list: the parents are the left bar pages of the domain.
 */
export function useBreadcrumbs() {
  const { t } = useTranslation();
  const scopedDomain = useDomain();

  const users = (): BreadcrumbItem[] => [{ label: t("sidebar.users"), to: "/users" }];
  const user = (username: string): BreadcrumbItem[] => [
    ...users(),
    { label: username, to: `/users/user/${encodeURIComponent(username)}` },
  ];
  const domains = (): BreadcrumbItem[] => (scopedDomain ? [] : [{ label: t("sidebar.domains"), to: "/domains" }]);
  const domain = (name: string): BreadcrumbItem[] => [
    ...domains(),
    { label: name, to: `/domains/domain/${encodeURIComponent(name)}` },
  ];
  const teamMailboxes = (domainName: string): BreadcrumbItem[] =>
    scopedDomain ? [{ label: t("domainAdminPages.teamMailboxes"), to: "/team-mailboxes" }] : domain(domainName);
  const teamMailbox = (domainName: string, mailbox: string): BreadcrumbItem[] => [
    ...teamMailboxes(domainName),
    {
      label: `${mailbox}@${domainName}`,
      to: `/domains/domain/${encodeURIComponent(domainName)}/team-mailbox/${encodeURIComponent(mailbox)}`,
    },
  ];
  const resources = (domainName: string): BreadcrumbItem[] =>
    scopedDomain ? [{ label: t("domainAdminPages.calendarResources"), to: "/resources" }] : domain(domainName);
  const mailRepositories = (): BreadcrumbItem[] => [{ label: t("sidebar.mailRepositories"), to: "/mail-repositories" }];
  const eventDeadLetter = (): BreadcrumbItem[] => [{ label: t("sidebar.eventDeadLetter"), to: "/event-dead-letter" }];
  const unsentMails = (): BreadcrumbItem[] => [{ label: t("sidebar.unsentMails"), to: "/unsent-mails" }];
  const networkChannels = (): BreadcrumbItem[] => [{ label: t("sidebar.networkChannels"), to: "/network-channels" }];
  const tasks = (): BreadcrumbItem[] => [{ label: t("sidebar.tasks"), to: "/tasks" }];

  return { users, user, domains, domain, teamMailboxes, teamMailbox, resources, mailRepositories, eventDeadLetter, unsentMails, networkChannels, tasks };
}
