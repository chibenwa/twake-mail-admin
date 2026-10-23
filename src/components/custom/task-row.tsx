import { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RiskBadge, RunTaskButton, TaskRisk } from "./run-task-button";

interface TaskRowProps {
  title: ReactNode;
  description?: ReactNode;
  doc?: string;
  risk?: TaskRisk;
  // The WebAdmin call, shown in the tooltip of the Run button
  command?: ReactNode;
  onRun: () => void;
  disabled?: boolean;
  loading?: boolean;
  // Inline controls of the task, e.g. the port of a certificate reload
  children?: ReactNode;
}

/**
 * One task of a task list: Common Tasks, or the Tasks section of a user or a domain, in
 * both applications. Same layout everywhere: title, risk, description, then Run.
 */
export default function TaskRow({ title, description, doc, risk = "safe", command, onRun, disabled, loading, children }: TaskRowProps) {
  const button = <RunTaskButton risk={risk} loading={loading} disabled={disabled} onClick={onRun} />;
  return (
    <div data-task-row className="flex justify-between items-center gap-4 p-4 bg-gray-50 rounded-2">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-medium">
            {title}
            {doc && <> <a className="text-blue-500 hover:underline font-normal" href={doc} target="_blank" rel="noreferrer">(doc)</a></>}
          </p>
          <RiskBadge risk={risk} />
        </div>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        {children && <div className="flex flex-wrap items-center gap-2 mt-2">{children}</div>}
      </div>
      {command ? (
        // On the side and not hoverable: above, the command would cover the Run button of the previous task
        <TooltipProvider>
          <Tooltip delayDuration={0} disableHoverableContent>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="left" className="max-w-md break-all">{command}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : button}
    </div>
  );
}
