import { CheckCircle2 } from "lucide-react";

/**
 * "All clear" on a triage page (dead letters, mail repositories, unsent mails): nothing
 * failed, said plainly so that it cannot be taken for a page still loading or broken.
 */
export default function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div role="status" className="mt-4 flex gap-3 items-start rounded-lg border border-green-200 bg-green-50 text-green-900 p-4">
      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-600" aria-hidden="true" />
      <div>
        <p className="font-medium">{title}</p>
        {text && <p className="text-sm mt-1">{text}</p>}
      </div>
    </div>
  );
}
