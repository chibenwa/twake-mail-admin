import { useId, useState } from "react";
import { UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import FormDialog, { FIELD_CLASS } from "@/components/custom/form-dialog";
import { useCheckUserExists, UserExistsStatus } from "@/hooks/use-check-user-exists";
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

// What the typed account is, as the line under the field says it
type AccountState = UserExistsStatus | "registered";

const ACCOUNT_LINES: Partial<Record<AccountState, { key: string; className: string }>> = {
  checking: { key: "common.checking", className: "text-gray-400" },
  registered: { key: "registeredUsers.alreadyRegistered", className: "text-orange-600" },
  exists: { key: "common.userExists", className: "text-green-700" },
  not_found: { key: "common.userNotFound", className: "text-orange-600" },
  invalid: { key: "common.invalidUsername", className: "text-red-600" },
};

function AccountLine({ state }: { state: AccountState }) {
  const { t } = useTranslation();
  const line = ACCOUNT_LINES[state];
  // Reserved height: the status appearing does not move the fields below
  return <p className="h-4 mt-1 text-xs">{line && <span className={line.className}>{t(line.key)}</span>}</p>;
}

// The DAV server refuses to register a user twice: tell it before sending
const isRegistered = (registered: RegisteredUser[], email: string) =>
  registered.some((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());

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
  const state: AccountState = !trimmed ? "idle" : isRegistered(registered, trimmed) ? "registered" : status;
  const accountReady = state === "exists";

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
          <AccountLine state={state} />
        </div>
        {accountReady && (
          // Remounted per account, so that the suggested firstname follows the typed address
          <RegisterUserForm key={trimmed} username={trimmed} defaults={defaultRegisteredUserNames(trimmed)} onChange={setNames} />
        )}
      </FormDialog>
    </>
  );
}
