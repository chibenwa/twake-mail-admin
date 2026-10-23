import { useEffect } from "react";
import { appConfig } from "@/lib/config";

export const appName = () => (appConfig.application === "CALENDAR" ? "Twake Calendar Admin" : "Twake Mail Admin");

/** Names the browser tab after the page or the object it shows: "alice@example.com — Twake Calendar Admin". */
export function useDocumentTitle(title: string | undefined): void {
  useEffect(() => {
    document.title = title ? `${title} — ${appName()}` : appName();
  }, [title]);
}
