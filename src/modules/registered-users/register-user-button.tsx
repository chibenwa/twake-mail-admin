import { useId, useState } from "react";
import { UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import FormDialog, { FIELD_CLASS } from "@/components/custom/form-dialog";
import { useCheckUserExists } from "@/hooks/use-check-user-exists";
import { useToast } from "@/hooks/use-toast";
import { createRegisteredUser } from "./api-client";
import { RegisteredUser } from "./types";
import { defaultRegisteredUserNames, validateRegisteredUserNames } from "./validation";
import { RegisterUserForm } from "./register-user-form";
import UserSuggestInput from "@/components/custom/user-suggest-input";

interface Props {
  registered: RegisteredUser[];
  domain?: string;
  onRegistered: () => void;
}

/** "Register a user", next to the search: the account, then its names, in one modal. */
export default function RegisterUserButton({ registered, domain, onRegistered }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [names, setNames] = useState(defaultRegisteredUserNames(""));
  const status = useCheckUserExists(username);
  const trimmed = username.trim();
  // The DAV server refuses to register a user twice: tell it before sending
  const alreadyRegistered = !!trimmed && registered.some((u) => (u.email ?? "").toLowerCase() === trimmed.toLowerCase());
  const accountReady = !!trimmed && status === "exists" && !alreadyRegistered;

  const close = () => {
    setOpen(false);
    setUsername("");
    setNames(defaultRegisteredUserNames(""));
  };

  const handleRegister = async () => {
    await createRegisteredUser({ id: trimmed, email: trimmed, ...names }, domain);
    toast({ title: t("registeredUsers.registered", { username: trimmed }) });
    onRegistered();
    close();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="w-4 h-4" aria-hidden="true" />
        {t("registeredUsers.registerButton")}
      </Button>
      <FormDialog
        open={open}
        onClose={close}
        title={t("users.registration.registerTitle")}
        submitLabel={t("registeredUsers.registerSubmit")}
        submitDisabled={!accountReady}
        validate={() => validateRegisteredUserNames(names, t)}
        onSubmit={handleRegister}
      >
        <div>
          <label htmlFor={fieldId} className="text-sm font-medium">{t("registeredUsers.email")}</label>
          <UserSuggestInput
            id={fieldId}
            autoFocus
            value={username}
            onValueChange={(value) => { setUsername(value); setNames(defaultRegisteredUserNames(value.trim())); }}
            placeholder={t("registeredUsers.placeholder")}
            className={FIELD_CLASS}
          />
          {/* Reserved height: the status appearing does not move the fields below */}
          <p className="h-4 mt-1 text-xs">
            {trimmed && status === "checking" && <span className="text-gray-400">{t("common.checking")}</span>}
            {alreadyRegistered && <span className="text-orange-600">{t("registeredUsers.alreadyRegistered")}</span>}
            {!alreadyRegistered && trimmed && status === "exists" && <span className="text-green-700">{t("common.userExists")}</span>}
            {trimmed && status === "not_found" && <span className="text-orange-600">{t("common.userNotFound")}</span>}
            {trimmed && status === "invalid" && <span className="text-red-600">{t("common.invalidUsername")}</span>}
          </p>
        </div>
        {accountReady && (
          // Remounted per account, so that the suggested firstname follows the typed address
          <RegisterUserForm key={trimmed} username={trimmed} defaults={defaultRegisteredUserNames(trimmed)} onChange={setNames} />
        )}
      </FormDialog>
    </>
  );
}
