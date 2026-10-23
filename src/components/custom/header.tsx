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
  // On a detail page: the way back to the list, and to the parents in between
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

  return (
    <div className="min-w-0">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label={t("common.breadcrumb")} className="mb-1">
          <ol className="flex flex-wrap items-center gap-1 text-sm">
            {breadcrumb.map((item, index) => (
              <li key={item.to} className="flex items-center gap-1 min-w-0">
                {index === 0
                  ? <ChevronLeft className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  : <span className="text-muted-foreground" aria-hidden="true">›</span>}
                <Link to={item.to} className="text-blue-600 hover:underline break-all">{item.label}</Link>
              </li>
            ))}
          </ol>
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
        {actions}
      </div>
    </div>
  );
};

export default Header;
