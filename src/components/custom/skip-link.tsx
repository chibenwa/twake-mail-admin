import { useTranslation } from "react-i18next";

export const MAIN_CONTENT_ID = "main-content";

/** First focusable element of every layout: jumps over the left bar to the page. */
export function SkipLink() {
  const { t } = useTranslation();
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      onClick={(e) => {
        e.preventDefault();
        document.getElementById(MAIN_CONTENT_ID)?.focus();
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-md focus:bg-white focus:text-blue-700 focus:shadow-lg focus:ring-2 focus:ring-blue-500"
    >
      {t("common.skipToContent")}
    </a>
  );
}
