import { ChevronLeft } from "lucide-react";
import { Link } from "react-router";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/hooks/use-document-title";

export interface BreadcrumbItem {
  label: string;
  to: string;
}

interface HeaderProps {
  headerTitle?: string | ReactNode;
  headerSubTitle?: string | ReactNode;
  docuUrl?: string;
  // On a detail page: its parents, from the list down; the back link leads to the last one
  breadcrumb?: BreadcrumbItem[];
  // Browser tab title, when the title is not plain text
  documentTitle?: string;
  // Next to the title, e.g. the actions of the object
  actions?: ReactNode;
}

const DocLink = ({ url }: { url?: string }) =>
  url ? <> (<a href={url} target="_blank" rel="noreferrer" className="text-blue-500 underline">doc</a>)</> : null;

/**
 * The single h1 of a page. A list page shows its name, subtitle and doc; a detail page shows
 * the object it is about, under a breadcrumb leading back to its list.
 */
const Header: React.FC<HeaderProps> = ({
  headerTitle,
  headerSubTitle,
  docuUrl,
  breadcrumb,
  documentTitle,
  actions,
}) => {
  const { t } = useTranslation();
  useDocumentTitle(documentTitle ?? (typeof headerTitle === "string" ? headerTitle : undefined));
  // The page one level up: the list of a detail page, the parent of a nested one
  const back = breadcrumb?.[breadcrumb.length - 1];

  return (
    <div className="min-w-0">
      {back && (
        <nav aria-label={t("common.breadcrumb")} className="mb-1">
          {/* Chevron and name of the page it returns to, one link: both are clickable */}
          <Link
            to={back.to}
            className="inline-flex items-center gap-1 -ml-2 px-2 py-1 rounded-md text-sm text-blue-600 hover:bg-gray-100 hover:underline break-all"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
            {back.label}
          </Link>
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {headerTitle && (
            <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 break-all">
              {headerTitle}{!headerSubTitle && <DocLink url={docuUrl} />}
            </h1>
          )}
          {headerSubTitle && (
            <p className={`leading-7 text-muted-foreground ${headerTitle ? 'mt-1' : ''}`}>
              {headerSubTitle}<DocLink url={docuUrl} />
            </p>
          )}
        </div>
        {/* Anchored right, also when the title wraps it onto its own line */}
        {actions && <div className="ml-auto shrink-0">{actions}</div>}
      </div>
    </div>
  );
};

export default Header;
