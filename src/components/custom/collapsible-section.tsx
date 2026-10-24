import { ReactNode, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { contentIdOf, Facts, FactsContext, SectionIdsContext, SectionsContext } from "./section-contexts";
import { NO_FLAG, sectionFlag, type StoredFlag } from "./section-flags";
import { useWriteSection } from "./use-write-section";

export { default as SectionToggle } from "./section-toggle";
export { default as ExpandCollapseAll } from "./expand-collapse-all";

/**
 * Collapsible sections of the detail pages (user, domain, team mailbox…), in both
 * applications. Their open state is remembered per page type, not per object: opening
 * Calendars on alice's page keeps it open on bob's, and across reloads.
 */

/** Groups the sections of a page: they remember their state under `page`, and Expand all reaches them. */
export function SectionsProvider({ page, children }: { page: string; children: ReactNode }) {
  const sections = useRef(new Map<string, number>());
  const [, setVersion] = useState(0);
  const [facts, setFacts] = useState<Facts>({});
  const report = useCallback((id: string, value: unknown) =>
    setFacts((current) => (Object.is(current[id], value) ? current : { ...current, [id]: value })), []);
  // A section can be rendered twice (e.g. while a dialog of it is open): counted, not flagged
  const count = useCallback((id: string, delta: number) => {
    const next = (sections.current.get(id) ?? 0) + delta;
    if (next > 0) sections.current.set(id, next);
    else sections.current.delete(id);
    setVersion((v) => v + 1);
  }, []);
  const register = useCallback((id: string) => {
    count(id, 1);
    return () => count(id, -1);
  }, [count]);
  return (
    <SectionsContext.Provider value={{ page, register }}>
      <SectionIdsContext.Provider value={sections}>
        <FactsContext.Provider value={{ facts, report }}>{children}</FactsContext.Provider>
      </SectionIdsContext.Provider>
    </SectionsContext.Provider>
  );
}

type NextOpen = boolean | ((open: boolean) => boolean);
type SetOpen = (open: NextOpen) => void;

const resolveOpen = (next: NextOpen, current: boolean) => (typeof next === "function" ? next(current) : next);

// The open state kept in a flag, `defaultOpen` until the section was opened or closed once
function useRememberedOpen(flag: StoredFlag, defaultOpen: boolean): [boolean, SetOpen] {
  const stored = useSyncExternalStore(flag.subscribe, flag.read);
  const setOpen = useCallback((next: NextOpen) => flag.write(resolveOpen(next, flag.read() ?? defaultOpen)), [flag, defaultOpen]);
  return [stored ?? defaultOpen, setOpen];
}

/**
 * Open state of a section: [open, setOpen, contentId]. Inside a SectionsProvider it is
 * remembered, `defaultOpen` applying to a first visit; outside, it is plain state.
 */
export function useSectionOpen(id: string, defaultOpen = false): [boolean, SetOpen, string] {
  const context = useContext(SectionsContext);
  const generatedId = useId();
  const [local, setLocal] = useState(defaultOpen);
  const page = context?.page;
  const flag = useMemo(() => (page ? sectionFlag(page, id) : NO_FLAG), [page, id]);
  const [remembered, setRemembered] = useRememberedOpen(flag, defaultOpen);
  const register = context?.register;
  useEffect(() => register?.(id, defaultOpen), [register, id, defaultOpen]);

  // Inside a page the content id is known in advance, so that its summary strip can scroll to the section
  return context ? [remembered, setRemembered, contentIdOf(id)] : [local, setLocal, generatedId];
}

/** Reports a fact of a section (e.g. its count) to the summary strip of its page. */
export function useSectionFact(id: string, value: unknown): void {
  const report = useContext(FactsContext)?.report;
  useEffect(() => {
    if (value !== undefined) report?.(id, value);
  }, [report, id, value]);
}

export function useSectionFacts(): Facts {
  return useContext(FactsContext)?.facts ?? {};
}

/** Opens a section of the page and scrolls to it, e.g. from its summary strip. */
export function useRevealSection(): (id: string) => void {
  const writeSection = useWriteSection();
  return useCallback((id: string) => {
    writeSection(id, true);
    requestAnimationFrame(() => {
      const content = document.getElementById(contentIdOf(id));
      const toggle = document.querySelector<HTMLElement>(`[aria-controls="${contentIdOf(id)}"]`);
      (toggle ?? content)?.scrollIntoView({ behavior: "smooth", block: "start" });
      toggle?.focus({ preventScroll: true });
    });
  }, [writeSection]);
}
