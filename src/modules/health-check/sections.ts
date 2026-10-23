import { HealthCheckType, HealthStatuses } from "./types";

export type HealthCheckSectionKey =
  | "storage"
  | "core"
  | "rabbitmq"
  | "other";

type SectionDefinition = {
  key: HealthCheckSectionKey;
  matches: (componentName: string) => boolean;
};

export type HealthCheckSection = {
  key: HealthCheckSectionKey;
  checks: HealthCheckType[];
};

const oneOf =
  (...names: string[]) =>
  (componentName: string) =>
    names.includes(componentName);

const MAIL_SECTIONS: SectionDefinition[] = [
  {
    key: "storage",
    matches: oneOf(
      "LDAP User Server",
      "Cassandra backend",
      "OpenSearch Backend",
      "RabbitMQ backend",
      "Redis"
    ),
  },
  {
    key: "core",
    matches: oneOf(
      "MailReceptionCheck",
      "IMAPHealthCheck",
      "EventDeadLettersHealthCheck",
      "EmptyErrorMailRepository"
    ),
  },
  {
    key: "rabbitmq",
    matches: (componentName) =>
      componentName.endsWith("DeadLetterQueueHealthCheck") ||
      componentName.includes("Consumers"),
  },
];

const CALENDAR_SECTIONS: SectionDefinition[] = [
  {
    key: "storage",
    matches: oneOf(
      "MongoDB",
      "Redis",
      "OpenSearch Backend",
      "RabbitMQ backend",
      "LDAP User Server"
    ),
  },
];

const CATCH_ALL: SectionDefinition = { key: "other", matches: () => true };

const sectionOf = (
  definitions: SectionDefinition[],
  check: HealthCheckType
): HealthCheckSectionKey =>
  (definitions.find((definition) => definition.matches(check.componentName)) ?? CATCH_ALL).key;

// WebAdmin lists the checks in completion order, which changes on every call: the ones
// needing attention come first, then by component name
const byAttentionThenName = (a: HealthCheckType, b: HealthCheckType): number =>
  Number(a.status === HealthStatuses.HEALTHY) - Number(b.status === HealthStatuses.HEALTHY)
  || a.componentName.localeCompare(b.componentName, "en");

/**
 * Groups health checks into ordered sections, dropping empty ones.
 * Unknown components fall into the "other" catch-all section.
 * Inside each section, non-healthy checks come first, then by component name.
 */
export const groupHealthChecks = (
  checks: HealthCheckType[],
  isCalendar: boolean
): HealthCheckSection[] => {
  const definitions = isCalendar ? CALENDAR_SECTIONS : MAIL_SECTIONS;
  return [...definitions, CATCH_ALL]
    .map(({ key }) => ({
      key,
      checks: checks
        .filter((check) => sectionOf(definitions, check) === key)
        .sort(byAttentionThenName),
    }))
    .filter((section) => section.checks.length > 0);
};

/**
 * The console screen where the problem of a component is looked at and fixed. Grows as
 * screens are added; a component absent from it has no link.
 */
const COMPONENT_SCREENS: Record<string, string> = {
  EmptyErrorMailRepository: "/mail-repositories/repository/var%2Fmail%2Ferror",
  EventDeadLettersHealthCheck: "/event-dead-letter",
  "Tasks execution": "/tasks",
  // Twake Calendar
  UnsentMails: "/unsent-mails",
};

export const componentScreen = (componentName: string): string | undefined => COMPONENT_SCREENS[componentName];

export type HealthSummary = {
  count: number;
  unhealthy: number;
  degraded: number;
  problems: HealthCheckType[];
};

/** How many components need attention, and which, worst first. */
export const summarizeHealthChecks = (checks: HealthCheckType[]): HealthSummary => {
  const problems = checks
    .filter((check) => check.status !== HealthStatuses.HEALTHY)
    .sort((a, b) => Number(a.status === HealthStatuses.DEGRADED) - Number(b.status === HealthStatuses.DEGRADED)
      || a.componentName.localeCompare(b.componentName, "en"));
  return {
    count: checks.length,
    unhealthy: problems.filter((check) => check.status === HealthStatuses.UNHEALTHY).length,
    degraded: problems.filter((check) => check.status === HealthStatuses.DEGRADED).length,
    problems,
  };
};
