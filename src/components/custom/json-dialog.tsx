import { useState } from "react";
import { Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Shown {
  title: string;
  value: unknown;
}

/**
 * The JSON of a stored object (a dead-lettered event, a repository mail), read in the
 * console rather than in a blank tab. Rendered as text: the data is never parsed as HTML.
 */
export function useJsonDialog() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [shown, setShown] = useState<Shown | null>(null);
  const text = shown ? JSON.stringify(shown.value, null, 2) : "";

  const copy = () => {
    navigator.clipboard?.writeText(text)
      .then(() => toast({ title: t("common.copied") }))
      .catch(() => { /* the text stays selectable */ });
  };

  const dialog = (
    <Dialog open={shown !== null} onOpenChange={(open) => { if (!open) setShown(null); }}>
      <DialogContent className="max-w-3xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="break-all">{shown?.title}</DialogTitle>
        </DialogHeader>
        <pre className="max-h-[60vh] overflow-auto text-xs bg-gray-50 p-3 rounded-md whitespace-pre-wrap break-all">{text}</pre>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={copy}>
            <Copy className="w-4 h-4" aria-hidden="true" />
            {t("common.copy")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return { show: (title: string, value: unknown) => setShown({ title, value }), dialog };
}
