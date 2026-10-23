import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import FormDialog, { FIELD_CLASS } from "@/components/custom/form-dialog";
import { useToast } from "@/hooks/use-toast";
import { createAddressMapping, createDomainMapping, createRegexMapping } from "./api-client";

export type MappingKind = "address" | "regex" | "domain";

const KINDS: Record<MappingKind, {
  sourcePlaceholder: string;
  destinationPlaceholder: string;
  created: string;
  create: (source: string, destination: string) => Promise<unknown>;
  hint?: string;
}> = {
  address: {
    sourcePlaceholder: "mappings.sourcePlaceholder",
    destinationPlaceholder: "mappings.destinationPlaceholder",
    created: "mappings.addressCreated",
    create: createAddressMapping,
  },
  regex: {
    sourcePlaceholder: "mappings.mappingSourcePlaceholder",
    destinationPlaceholder: "mappings.regexPlaceholder",
    created: "mappings.regexCreated",
    create: createRegexMapping,
  },
  domain: {
    sourcePlaceholder: "mappings.domainSourcePlaceholder",
    destinationPlaceholder: "mappings.domainDestinationPlaceholder",
    created: "mappings.domainCreated",
    create: createDomainMapping,
    hint: "mappings.domainHint",
  },
};

interface Props {
  open: boolean;
  // The kinds the operator may create, in the order of the type select
  kinds: MappingKind[];
  onClose: () => void;
  onCreated: () => void;
}

/** The modal each "Add … mapping" button of the toolbar opens: a source and its destination. */
export default function CreateMappingDialog({ open, kinds, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const idPrefix = useId();
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [kind, setKind] = useState<MappingKind>(kinds[0] ?? "address");
  const config = KINDS[kinds.includes(kind) ? kind : kinds[0] ?? "address"];

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
      open={open}
      onClose={close}
      title={t("mappings.addTitle")}
      submitLabel={t("common.create")}
      submitDisabled={!source.trim() || !destination.trim()}
      onSubmit={handleCreate}
    >
      {kinds.length > 1 && (
        <div>
          <label htmlFor={`${idPrefix}-kind`} className="text-sm font-medium">{t("mappings.type")}</label>
          <select id={`${idPrefix}-kind`} value={kind} onChange={(e) => setKind(e.target.value as MappingKind)} className={FIELD_CLASS}>
            {kinds.map((k) => <option key={k} value={k}>{t(`mappings.kinds.${k}`)}</option>)}
          </select>
        </div>
      )}
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
