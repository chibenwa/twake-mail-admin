import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfirm } from "@/hooks/use-confirm";
import { useToast } from "@/hooks/use-toast";
import { currentLocale } from "@/i18n/locale";
import { formatByteSize } from "@/i18n/format-size";
import ErrorDisplayer from "./error-displayer";
import FormDialog from "./form-dialog";

/** A count or size limit: null when none is set at this level, -1 when unlimited. */
export interface QuotaLimitValues {
  count: number | null;
  size: number | null;
}

export const NO_LIMITS: QuotaLimitValues = { count: null, size: null };

/** The WebAdmin calls of one quota level, each limit set and removed on its own. */
export interface QuotaLimitsApi {
  putCount: (count: number) => Promise<void>;
  deleteCount: () => Promise<void>;
  putSize: (size: number) => Promise<void>;
  deleteSize: () => Promise<void>;
}

const UNITS = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 } as const;
type Unit = keyof typeof UNITS;

const hasAtMostOneDecimal = (value: number) => Math.abs(value * 10 - Math.round(value * 10)) < 1e-9;

/** The largest unit giving a whole or one-decimal number: 50 MB is "50" "MB", not "0.05" "GB". */
export function toSizeField(bytes: number): { value: string; unit: Unit } {
  for (const unit of ["GB", "MB", "KB"] as const) {
    const value = bytes / UNITS[unit];
    if (value >= 1 && hasAtMostOneDecimal(value)) return { value: String(Math.round(value * 10) / 10), unit };
  }
  return { value: String(bytes), unit: "B" };
}

interface LimitField {
  value: string;
  unlimited: boolean;
}

const fieldOf = (limit: number | null, toValue: (n: number) => string): LimitField => ({
  value: limit === null || limit === -1 ? "" : toValue(limit),
  unlimited: limit === -1,
});

/** What the operator typed: a limit, -1 for unlimited, null for none at this level, undefined when invalid. */
function parse(field: LimitField, multiplier = 1): number | null | undefined {
  if (field.unlimited) return -1;
  const raw = field.value.trim();
  if (raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n * multiplier);
}

interface Props {
  // Named in the dialog title: the user, the domain, the team mailbox, "all users"
  target: string;
  // The limits set at this level
  current: QuotaLimitValues;
  // The levels a limit is inherited from when none is set here, nearest first (none at the global level)
  parents?: { label: string; values: QuotaLimitValues }[];
  api: QuotaLimitsApi;
  canEditCount: boolean;
  canEditSize: boolean;
  canRemove: boolean;
  removeLabel: string;
  removeConfirm: string;
  onChanged: () => void;
}

/**
 * "Edit limits" and "Remove specific limits" of a quota section, the same at the user,
 * team mailbox, domain and global levels: both limits are edited together, prefilled with
 * the current ones, in a modal.
 */
export default function QuotaLimits({ target, current, parents = [], api, canEditCount, canEditSize, canRemove, removeLabel, removeConfirm, onChanged }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const confirm = useConfirm();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<LimitField>({ value: "", unlimited: false });
  const [size, setSize] = useState<LimitField>({ value: "", unlimited: false });
  const [unit, setUnit] = useState<Unit>("MB");

  const hasSpecificLimit = current.count !== null || current.size !== null;

  const openDialog = () => {
    setCount(fieldOf(current.count, String));
    const sizeField = current.size !== null && current.size !== -1 ? toSizeField(current.size) : null;
    setSize({ value: sizeField?.value ?? "", unlimited: current.size === -1 });
    setUnit(sizeField?.unit ?? "MB");
    setOpen(true);
  };

  const validate = () =>
    (canEditCount && parse(count) === undefined) || (canEditSize && parse(size, UNITS[unit]) === undefined)
      ? t("quotaLimits.invalid")
      : null;

  // Each limit that changed is sent on its own: a value is put, an emptied field removes it
  const handleSave = async () => {
    const nextCount = parse(count);
    const nextSize = parse(size, UNITS[unit]);
    if (canEditCount && nextCount !== undefined && nextCount !== current.count) {
      await (nextCount === null ? api.deleteCount() : api.putCount(nextCount));
    }
    if (canEditSize && nextSize !== undefined && nextSize !== current.size) {
      await (nextSize === null ? api.deleteSize() : api.putSize(nextSize));
    }
    toast({ title: t("quotaLimits.updated") });
    onChanged();
  };

  const handleRemove = async () => {
    const confirmed = await confirm({ header: removeLabel, message: removeConfirm });
    if (!confirmed) return;
    try {
      if (current.count !== null) await api.deleteCount();
      if (current.size !== null) await api.deleteSize();
      toast({ title: t("quotaLimits.removed") });
      onChanged();
    } catch (err) {
      toast({ title: t("common.errorResettingQuota"), description: <ErrorDisplayer error={err} /> });
    }
  };

  // What an emptied field falls back to: the nearest level setting this limit, or no limit at all
  const inheritHint = (key: "count" | "size", format: (n: number) => string) => {
    const parent = parents.find((p) => p.values[key] !== null);
    if (!parent) return t("quotaLimits.noLimitHint");
    const limit = parent.values[key]!;
    return t("quotaLimits.inheritHint", { parent: parent.label, value: limit === -1 ? t("common.unlimited") : format(limit) });
  };

  const row = (
    key: "count" | "size",
    label: string,
    field: LimitField,
    setField: (f: LimitField) => void,
    hint: string,
    unitSelect?: React.ReactNode,
  ) => (
    <fieldset className="space-y-1">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={`${id}-${key}`}
          type="number"
          min="1"
          aria-label={label}
          value={field.value}
          disabled={field.unlimited}
          onChange={(e) => setField({ ...field, value: e.target.value })}
          className="flex-1 min-w-32 px-3 py-2 border rounded-md text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        {unitSelect}
        <div className="flex items-center gap-1">
          <Checkbox
            id={`${id}-${key}-unlimited`}
            checked={field.unlimited}
            onCheckedChange={(checked) => setField({ ...field, unlimited: checked === true })}
          />
          <label htmlFor={`${id}-${key}-unlimited`} className="text-sm cursor-pointer select-none">{t("quotaLimits.unlimited")}</label>
        </div>
      </div>
      <p className="text-xs text-gray-500">{hint}</p>
    </fieldset>
  );

  if (!canEditCount && !canEditSize && !(canRemove && hasSpecificLimit)) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {(canEditCount || canEditSize) && (
        <Button variant="outline" className="rounded-sm" onClick={openDialog}>{t("quotaLimits.edit")}</Button>
      )}
      {canRemove && hasSpecificLimit && (
        <Button variant="outline" className="rounded-sm" onClick={handleRemove}>{removeLabel}</Button>
      )}
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("quotaLimits.title", { target })}
        submitLabel={t("common.save")}
        validate={validate}
        onSubmit={handleSave}
      >
        {canEditCount && row("count", t("quotaLimits.count"), count, setCount,
          inheritHint("count", (n) => n.toLocaleString(currentLocale())))}
        {canEditSize && row("size", t("quotaLimits.size"), size, setSize,
          inheritHint("size", formatByteSize),
          <select
            aria-label={t("common.sizeUnit")}
            value={unit}
            disabled={size.unlimited}
            onChange={(e) => setUnit(e.target.value as Unit)}
            className="px-3 py-2 border rounded-md text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            {/* KB and B only when the current limit needs them */}
            {(unit === "B" || unit === "KB" ? (["B", "KB", "MB", "GB"] as const) : (["MB", "GB"] as const)).map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        )}
      </FormDialog>
    </div>
  );
}
