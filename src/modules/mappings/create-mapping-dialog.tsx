import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import FormDialog, { FIELD_CLASS } from "@/components/custom/form-dialog";
import { useToast } from "@/hooks/use-toast";
import { createAddressMapping, createDomainMapping, createRegexMapping } from "./api-client";

export type MappingKind = "address" | "regex" | "domain";

const KINDS: Record<MappingKind, {
  title: string;
  sourcePlaceholder: string;
  destinationPlaceholder: string;
  created: string;
  create: (source: string, destination: string) => Promise<unknown>;
  hint?: string;
}> = {
  address: {
    title: "mappings.addAddress",
    sourcePlaceholder: "mappings.sourcePlaceholder",
    destinationPlaceholder: "mappings.destinationPlaceholder",
    created: "mappings.addressCreated",
    create: createAddressMapping,
  },
  regex: {
    title: "mappings.addRegex",
    sourcePlaceholder: "mappings.mappingSourcePlaceholder",
    destinationPlaceholder: "mappings.regexPlaceholder",
    created: "mappings.regexCreated",
    create: createRegexMapping,
  },
  domain: {
    title: "mappings.addDomain",
    sourcePlaceholder: "mappings.domainSourcePlaceholder",
    destinationPlaceholder: "mappings.domainDestinationPlaceholder",
    created: "mappings.domainCreated",
    create: createDomainMapping,
    hint: "mappings.domainHint",
  },
};

interface Props {
  kind: MappingKind | null;
  onClose: () => void;
  onCreated: () => void;
}

/** The modal each "Add … mapping" button of the toolbar opens: a source and its destination. */
export default function CreateMappingDialog({ kind, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const idPrefix = useId();
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const config = KINDS[kind ?? "address"];

  const close = () => {
    setSource("");
    setDestination("");
    onClose();
  };

  const handleCreate = async () => {
    await config.create(source.trim(), destination.trim());
    toast({ title: t(config.created) });
    onCreated();
    setSource("");
    setDestination("");
  };

  return (
    <FormDialog
      open={kind !== null}
      onClose={close}
      title={t(config.title)}
      submitLabel={t("common.create")}
      submitDisabled={!source.trim() || !destination.trim()}
      onSubmit={handleCreate}
    >
      <div>
        <label htmlFor={`${idPrefix}-source`} className="text-sm font-medium">{t("mappings.source")}</label>
        <input id={`${idPrefix}-source`} type="text" autoFocus value={source} onChange={(e) => setSource(e.target.value)}
          placeholder={t(config.sourcePlaceholder)} className={FIELD_CLASS} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-destination`} className="text-sm font-medium">{t("mappings.destination")}</label>
        <input id={`${idPrefix}-destination`} type="text" value={destination} onChange={(e) => setDestination(e.target.value)}
          placeholder={t(config.destinationPlaceholder)} className={FIELD_CLASS} />
      </div>
      {config.hint && <p className="text-xs text-muted-foreground">{t(config.hint)}</p>}
    </FormDialog>
  );
}
