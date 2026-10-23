import { createContext, ReactNode, useCallback, useContext, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
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

// The storage can be unavailable (private window, blocked site data): the state then lives in memory
const readStored = (key: string): boolean | undefined => {
  if (memory.has(key)) return memory.get(key);
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? undefined : value === "true";
  } catch {
    return undefined;
  }
};

const writeStored = (key: string, open: boolean) => {
  memory.set(key, open);
  try {
    window.localStorage.setItem(key, String(open));
  } catch {
    // kept in memory only
  }
  listeners.get(key)?.forEach((listener) => listener());
};

const subscribe = (key: string, listener: Listener) => {
  const set = listeners.get(key) ?? new Set();
  set.add(listener);
  listeners.set(key, set);
  return () => set.delete(listener);
};

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

type SetOpen = (open: boolean | ((open: boolean) => boolean)) => void;

/**
 * Open state of a section: [open, setOpen, contentId]. Inside a SectionsProvider it is
 * remembered, `defaultOpen` applying to a first visit; outside, it is plain state.
 */
export function useSectionOpen(id: string, defaultOpen = false): [boolean, SetOpen, string] {
  const context = useContext(SectionsContext);
  const generatedId = useId();
  // Known in advance inside a page, so that its summary strip can scroll to the section
  const contentId = context ? contentIdOf(id) : generatedId;
  const [local, setLocal] = useState(defaultOpen);
  const key = context ? storageKey(context.page, id) : "";
  const stored = useSyncExternalStore(
    (listener) => (key ? subscribe(key, listener) : () => {}),
    () => (key ? readStored(key) : undefined),
  );
  const register = context?.register;
  useEffect(() => register?.(id, defaultOpen), [register, id, defaultOpen]);

  const open = context ? stored ?? defaultOpen : local;
  const setOpen: SetOpen = useCallback((next) => {
    if (!key) {
      setLocal(next);
      return;
    }
    const current = readStored(key) ?? defaultOpen;
    writeStored(key, typeof next === "function" ? next(current) : next);
  }, [key, defaultOpen]);
  return [open, setOpen, contentId];
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
      className="flex items-center gap-2 text-md font-semibold text-left hover:text-blue-600 transition"
    >
      {open ? <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" /> : <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />}
      {children}
    </button>
  );
}

/** "Expand all" / "Collapse all" for the sections of the enclosing SectionsProvider. */
export function ExpandCollapseAll() {
  const { t } = useTranslation();
  const context = useContext(SectionsContext);
  const sections = useContext(SectionIdsContext);
  if (!context || !sections) return null;
  const setAll = (open: boolean) => {
    for (const id of sections.current.keys()) writeStored(storageKey(context.page, id), open);
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
  const context = useContext(SectionsContext);
  return useCallback((id: string) => {
    if (context) writeStored(storageKey(context.page, id), true);
    requestAnimationFrame(() => {
      const content = document.getElementById(contentIdOf(id));
      const toggle = document.querySelector<HTMLElement>(`[aria-controls="${contentIdOf(id)}"]`);
      (toggle ?? content)?.scrollIntoView({ behavior: "smooth", block: "start" });
      toggle?.focus({ preventScroll: true });
    });
  }, [context]);
}
