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

const SectionsContext = createContext<SectionsContextValue | null>(null);

/** Groups the sections of a page: they remember their state under `page`, and Expand all reaches them. */
export function SectionsProvider({ page, children }: { page: string; children: ReactNode }) {
  const sections = useRef(new Map<string, number>());
  const [, setVersion] = useState(0);
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
      <SectionIdsContext.Provider value={sections}>{children}</SectionIdsContext.Provider>
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
  const contentId = useId();
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
