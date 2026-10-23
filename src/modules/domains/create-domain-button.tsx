import { FormEvent, useId, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ErrorDisplayer from "@/components/custom/error-displayer";
import { useToast } from "@/hooks/use-toast";
import { createDomain } from "./api-client";

/** "Create a domain", next to the search of the domain list: the name is typed in a modal. */
export default function CreateDomainButton({ onCreated }: { onCreated: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const close = () => {
    setOpen(false);
    setName("");
    setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const domain = name.trim();
    if (!domain) return;
    setCreating(true);
    setError(null);
    try {
      await createDomain(domain);
      toast({ title: t("domains.created", { name: domain }) });
      close();
      onCreated();
    } catch (err) {
      // Kept in the modal with the typed name, so that it can be corrected
      setError(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" aria-hidden="true" />
        {t("domains.createButton")}
      </Button>
      <Dialog open={open} onOpenChange={(v) => { if (!v && !creating) close(); }}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t("domains.createConfirmTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor={fieldId} className="text-sm font-medium">{t("domains.domainName")}</label>
              <input
                id={fieldId}
                type="text"
                autoFocus
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
                placeholder={t("domains.newDomainPlaceholder")}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-muted-foreground mt-1">{t("domains.createHint")}</p>
            </div>
            {error !== null && <div role="alert" className="text-sm text-red-600"><ErrorDisplayer error={error} /></div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={close} disabled={creating}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={creating || !name.trim()}>
                {creating && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {t("common.create")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
