// Radix components (checkbox, select) measure themselves; jsdom has no ResizeObserver
class NoResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??= NoResizeObserver as unknown as typeof ResizeObserver;
