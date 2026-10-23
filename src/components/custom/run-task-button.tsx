import { forwardRef, ReactNode } from "react";
import { Loader2, Play, Trash2, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * How much a task changes: safe ones only read or rebuild derived data, caution ones
 * modify data, destructive ones delete it. Told by an icon and a badge, not only by colour.
 */
export type TaskRisk = "safe" | "caution" | "destructive";

const ICONS = { safe: Play, caution: TriangleAlert, destructive: Trash2 } as const;

// Every style keeps a text contrast of at least 4.5:1 against its background
const CAUTION_CLASS = "border border-amber-600 bg-background text-amber-800 hover:bg-amber-50 hover:text-amber-900";

interface RunTaskButtonProps extends Omit<ButtonProps, "variant"> {
  risk?: TaskRisk;
  loading?: boolean;
  label?: ReactNode;
}

export const RunTaskButton = forwardRef<HTMLButtonElement, RunTaskButtonProps>(
  ({ risk = "safe", loading, label, className, children, ...props }, ref) => {
    const { t } = useTranslation();
    const Icon = ICONS[risk];
    return (
      <Button
        ref={ref}
        variant={risk === "destructive" ? "destructive" : "outline"}
        className={cn("rounded-sm shrink-0", risk === "caution" && CAUTION_CLASS, className)}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Icon aria-hidden="true" />}
        {label ?? children ?? t("common.run")}
      </Button>
    );
  }
);
RunTaskButton.displayName = "RunTaskButton";

const BADGE_CLASS = {
  caution: "bg-amber-100 text-amber-800",
  destructive: "bg-red-100 text-red-800",
} as const;

export function RiskBadge({ risk }: { risk: TaskRisk }) {
  const { t } = useTranslation();
  if (risk === "safe") return null;
  return (
    <span className={cn("inline-block text-xs font-medium rounded px-1.5 py-0.5 whitespace-nowrap", BADGE_CLASS[risk])}>
      {t(`tasks.risk.${risk}`)}
    </span>
  );
}
