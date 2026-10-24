import { createContext, ReactNode, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Collapsible sections of the detail pages (user, domain, team mailbox…), in both
 * applications. Their open state is remembered per page type, not per object: opening
 * Calendars on alice's page keeps it open on bob's, and across reloads.
 */

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();
const memory = new Map<string, boolean>();

const storageKey = (page: string, id: string) => `section:${page}:${id}`;

/** The remembered open state of one section of one page type, and who listens to it. */
interface StoredFlag {
  read(): boolean | undefined;
  write(open: boolean): void;
  subscribe(listener: Listener): () => void;
}

// The storage can be unavailable (private window, blocked site data): the state then lives in memory
const storedFlag = (key: string): StoredFlag => ({
  read() {
    if (memory.has(key)) return memory.get(key);
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? undefined : value === "true";
    } catch {
      return undefined;
    }
  },
  write(open) {
    memory.set(key, open);
    try {
      window.localStorage.setItem(key, String(open));
    } catch {
      // kept in memory only
    }
    listeners.get(key)?.forEach((listener) => listener());
  },
  subscribe(listener) {
    const set = listeners.get(key) ?? new Set();
    set.add(listener);
    listeners.set(key, set);
    return () => set.delete(listener);
  },
});

const sectionFlag = (page: string, id: string) => storedFlag(storageKey(page, id));

interface SectionsContextValue {
  page: string;
  register: (id: string, defaultOpen: boolean) => () => void;
}

// What the sections of a page know about their object (a count…), for its summary strip
type Facts = Record<string, unknown>;
const FactsContext = createContext<{ facts: Facts; report: (id: string, value: unknown) => void } | null>(null);

const contentIdOf = (id: string) => `section-${id}-content`;

const SectionsContext = createContext<SectionsContextValue | null>(null);

/** Groups the sections of a page: they remember their state under `page`, and Expand all reaches them. */
export function SectionsProvider({ page, children }: { page: string; children: ReactNode }) {
  const sections = useRef(new Map<string, number>());
  const [, setVersion] = useState(0);
  const [facts, setFacts] = useState<Facts>({});
  const report = useCallback((id: string, value: unknown) =>
    setFacts((current) => (Object.is(current[id], value) ? current : { ...current, [id]: value })), []);
  const register = useCallback((id: string) => {
    sections.current.set(id, (sections.current.get(id) ?? 0) + 1);
    setVersion((v) => v + 1);
    return () => {
      const count = (sections.current.get(id) ?? 1) - 1;
      if (count <= 0) sections.current.delete(id);
      else sections.current.set(id, count);
      setVersion((v) => v + 1);
    };
  }, []);
  return (
    <SectionsContext.Provider value={{ page, register }}>
      <SectionIdsContext.Provider value={sections}>
        <FactsContext.Provider value={{ facts, report }}>{children}</FactsContext.Provider>
      </SectionIdsContext.Provider>
    </SectionsContext.Provider>
  );
}

const SectionIdsContext = createContext<React.MutableRefObject<Map<string, number>> | null>(null);

type NextOpen = boolean | ((open: boolean) => boolean);
type SetOpen = (open: NextOpen) => void;

const resolveOpen = (next: NextOpen, current: boolean) => (typeof next === "function" ? next(current) : next);
const NO_FLAG: StoredFlag = { read: () => undefined, write: () => {}, subscribe: () => () => {} };

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

interface SectionToggleProps {
  open: boolean;
  onToggle: () => void;
  // Id of the content, rendered while open
  controls?: string;
  children: ReactNode;
}

/** The title button of a section: chevron, title and count, with its disclosure state exposed. */
export function SectionToggle({ open, onToggle, controls, children }: SectionToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      // Revealed from the summary strip: its title stays clear of the sticky header of the page
      className="flex items-center gap-2 text-md font-semibold text-left hover:text-blue-600 transition scroll-mt-16"
    >
      {open ? <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" /> : <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />}
      {children}
    </button>
  );
}

// Opens or closes a section of the enclosing SectionsProvider; nothing outside of one
function useWriteSection(): (id: string, open: boolean) => void {
  const page = useContext(SectionsContext)?.page;
  return useCallback((id: string, open: boolean) => {
    if (page) sectionFlag(page, id).write(open);
  }, [page]);
}

/** "Expand all" / "Collapse all" for the sections of the enclosing SectionsProvider. */
export function ExpandCollapseAll() {
  const { t } = useTranslation();
  const writeSection = useWriteSection();
  const sections = useContext(SectionIdsContext);
  // A page without sections (e.g. an unregistered user) has nothing to expand
  if (!sections || sections.current.size === 0) return null;
  const setAll = (open: boolean) => {
    for (const id of sections.current.keys()) writeSection(id, open);
  };
  return (
    <div className="flex gap-3 text-sm">
      <button type="button" className="text-blue-600 hover:underline" onClick={() => setAll(true)}>{t("common.expandAll")}</button>
      <button type="button" className="text-blue-600 hover:underline" onClick={() => setAll(false)}>{t("common.collapseAll")}</button>
    </div>
  );
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
