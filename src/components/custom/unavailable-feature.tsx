import { Info } from "lucide-react";

interface Props {
  title: string;
  text: string;
  docUrl?: string;
}

/**
 * A feature this server does not expose (its route answers 404): said plainly, in blue,
 * rather than as a red error, and without the forms that cannot work.
 */
export default function UnavailableFeature({ title, text, docUrl }: Props) {
  return (
    <div role="status" className="mt-4 flex gap-3 items-start rounded-lg border border-blue-200 bg-blue-50 text-blue-900 p-4">
      <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" aria-hidden="true" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm mt-1">
          {text}
          {docUrl && <> (<a href={docUrl} target="_blank" rel="noreferrer" className="underline">doc</a>)</>}
        </p>
      </div>
    </div>
  );
}
