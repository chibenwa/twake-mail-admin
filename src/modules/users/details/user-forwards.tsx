import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { useIsAllowed } from "@/lib/proxy-resolver-context";
import { useFetchData } from "@/hooks/use-fetch-data";
import { useUserMappingsRevision } from "./user-mappings-revision";
import { getUserForwards, addUserForward, removeUserForward } from "../api-client";
import { GetUserForwardsResponseType } from "../types";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { Checkbox } from "@/components/ui/checkbox";
import ErrorDisplayer from "@/components/custom/error-displayer";
import { SectionToggle, useSectionFact, useSectionOpen } from "@/components/custom/collapsible-section";
import FormDialog, { FIELD_CLASS } from "@/components/custom/form-dialog";
import UserSuggestInput from "@/components/custom/user-suggest-input";

interface Props {
  username: string;
}

export default function UserForwards({ username }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const confirm = useConfirm();
  const canView = useIsAllowed("GET", "/address/forwards/{username}");
  const canAdd = useIsAllowed("PUT", "/address/forwards/{username}/targets/{destination}");
  const canRemove = useIsAllowed("DELETE", "/address/forwards/{username}/targets/{destination}");

  const { revision, notifyMappingsChanged } = useUserMappingsRevision();
  const fetchForwards = useCallback(() => getUserForwards(username), [username]);
  const {
    data: forwards,
    isLoading,
    error,
  } = useFetchData<GetUserForwardsResponseType>(canView ? fetchForwards : null, revision);

  const [open, setOpen, openContentId] = useSectionOpen("forwards");
  useSectionFact("forwards", forwards ?? undefined);
  const [newForward, setNewForward] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const sorted = useMemo(() => {
    if (!forwards) return [];
    return [...forwards].sort((a, b) => a.mailAddress.localeCompare(b.mailAddress));
  }, [forwards]);

  const userInForwards = useMemo(() => {
    if (!forwards) return false;
    return forwards.some((f) => f.mailAddress === username);
  }, [forwards, username]);

  const hasExternalForwards = useMemo(() => {
    if (!forwards) return false;
    return forwards.some((f) => f.mailAddress !== username);
  }, [forwards, username]);

  if (!canView) return null;

  // Checkbox is disabled when there are no external forwards
  // (no forwards at all, or only the user itself)
  const checkboxDisabled = !hasExternalForwards;

  const handleToggleUserReceives = async () => {
    try {
      if (userInForwards) {
        await removeUserForward(username, username);
        toast({ title: t("users.forwards.removedFromDestinations") });
      } else {
        await addUserForward(username, username);
        toast({ title: t("users.forwards.addedToDestinations") });
      }
      notifyMappingsChanged();
    } catch (err) {
      toast({
        title: t("users.forwards.errorUpdating"),
        description: <ErrorDisplayer error={err} />,
      });
    }
  };

  // A refusal throws: the modal shows it and keeps the typed destination
  const handleAdd = async () => {
    await addUserForward(username, newForward.trim());
    toast({ title: t("users.forwards.added") });
    setNewForward("");
    notifyMappingsChanged();
  };

  const handleRemove = async (destination: string) => {
    const confirmed = await confirm({
      header: t("users.forwards.removeTitle"),
      destructive: true,
      confirmLabel: t("common.remove"),
      message: t("users.forwards.removeConfirm", { destination, username }),
    });
    if (!confirmed) return;
    try {
      await removeUserForward(username, destination);
      toast({ title: t("users.forwards.removed") });
      notifyMappingsChanged();
    } catch (err) {
      toast({
        title: t("users.forwards.errorRemoving"),
        description: <ErrorDisplayer error={err} />,
      });
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2">
        <SectionToggle open={open} onToggle={() => setOpen(!open)} controls={openContentId}>
          {t("users.forwards.title")}
          {forwards && (
            <span className="text-sm font-normal text-gray-500">
              ({forwards.length})
            </span>
          )}
        </SectionToggle>
        {canAdd && (
          <button
            type="button"
            onClick={() => { setOpen(true); setShowAddDialog(true); }}
            className="p-1 rounded-md hover:bg-gray-200 transition"
            title={t("users.forwards.addTooltip")}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <FormDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        title={t("users.forwards.addTooltip")}
        submitLabel={t("common.add")}
        submitDisabled={!newForward.trim()}
        onSubmit={handleAdd}
      >
        <div>
          <label htmlFor="add-forward-destination" className="text-sm font-medium">{t("users.forwards.fieldLabel")}</label>
          <UserSuggestInput
            autoFocus
            value={newForward}
            onValueChange={setNewForward}
            id="add-forward-destination"
            placeholder={t("users.forwards.placeholder")}
            className={FIELD_CLASS}
          />
        </div>
      </FormDialog>

      {open && (
        <div id={openContentId} className="mt-2">
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
              <div className="h-[58px] rounded-2 animate-pulse bg-gray-200" />
            </div>
          )}
          {error && <p className="text-red-500 mt-2">{t("common.errorPrefix", { message: error })}</p>}

          {forwards && (
            <div>
              <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-2 my-2 transition-colors hover:bg-gray-100">
                <Checkbox
                  id="user-receives"
                  checked={!hasExternalForwards || userInForwards}
                  disabled={checkboxDisabled}
                  onCheckedChange={handleToggleUserReceives}
                />
                <label htmlFor="user-receives" className="text-sm font-medium cursor-pointer select-none">
                  {t("users.forwards.stillReceives")}
                </label>
              </div>

              {sorted.map((fwd, index) => (
                <div
                  key={fwd.mailAddress}
                  className="space-y-1 p-4 bg-gray-50 rounded-2 my-2 flex justify-between items-center gap-2 transition-colors hover:bg-gray-100"
                >
                  <h4 className="min-w-0 text-sm font-medium leading-none break-all">
                    <span className="text-gray-500 mr-2">{index + 1}/</span>
                    {fwd.mailAddress}
                    {fwd.mailAddress === username && (
                      <span className="ml-2 text-xs text-blue-500">{t("users.forwards.selfLabel")}</span>
                    )}
                  </h4>
                  {canRemove && (
                    <button
                      onClick={() => handleRemove(fwd.mailAddress)}
                      className="shrink-0 p-2 rounded-md hover:bg-gray-200"
                      title={t("users.forwards.removeTooltip")}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  )}
                </div>
              ))}
              {forwards.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">{t("users.forwards.empty")}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
