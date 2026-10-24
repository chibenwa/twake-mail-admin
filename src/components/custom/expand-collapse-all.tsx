import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { SectionIdsContext } from "./section-contexts";
import { useWriteSection } from "./use-write-section";

const ALL_ACTIONS = [
  { open: true, labelKey: "common.expandAll" },
  { open: false, labelKey: "common.collapseAll" },
];

/** "Expand all" / "Collapse all" for the sections of the enclosing SectionsProvider. */
export default function ExpandCollapseAll() {
  const { t } = useTranslation();
  const writeSection = useWriteSection();
  const sections = useContext(SectionIdsContext);
  // A page without sections (e.g. an unregistered user) has nothing to expand
  if (!sections || sections.current.size === 0) return null;
  return (
    <div className="flex gap-3 text-sm">
      {ALL_ACTIONS.map(({ open, labelKey }) => (
        <button key={labelKey} type="button" className="text-blue-600 hover:underline"
          onClick={() => sections.current.forEach((_, id) => writeSection(id, open))}>
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}
