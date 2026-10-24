/**
 * The remembered open state of the sections of the detail pages, per page type: in the
 * browser storage, or in memory when it is unavailable, with who listens to each one.
 */

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();
const memory = new Map<string, boolean>();

const storageKey = (page: string, id: string) => `section:${page}:${id}`;

/** The remembered open state of one section of one page type, and who listens to it. */
export interface StoredFlag {
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

export const sectionFlag = (page: string, id: string) => storedFlag(storageKey(page, id));
