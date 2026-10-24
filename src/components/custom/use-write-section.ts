import { useCallback, useContext } from "react";
import { SectionsContext } from "./section-contexts";
import { sectionFlag } from "./section-flags";

// Opens or closes a section of the enclosing SectionsProvider; nothing outside of one
export function useWriteSection(): (id: string, open: boolean) => void {
  const page = useContext(SectionsContext)?.page;
  return useCallback((id: string, open: boolean) => {
    if (page) sectionFlag(page, id).write(open);
  }, [page]);
}
