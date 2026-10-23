import { useCallback } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import UserMailboxes from "./user-mailboxes";
import UserQuota from "./user-quota";
import UserAliases from "./user-aliases";
import UserForwards from "./user-forwards";
import UserTeamMailboxes from "./user-team-mailboxes";
import UserVacation from "./user-vacation";
import UserDelegation from "./user-delegation";
import UserAllowedFrom from "./user-allowed-from";
import UserIdentities from "./user-identities";
import UserTasks from "./user-tasks";
import UserChannels from "./user-channels";
import UserMappings from "./user-mappings";
import UserDeletedMessageVault from "./user-deleted-message-vault";
import UserLabels from "./user-labels";
import UserJmapSettings from "./user-jmap-settings";
import { UserMappingsRevisionContext, useUserMappingsRevisionState } from "./user-mappings-revision";
import RateLimitsSection from "@/components/custom/rate-limits-section";
import { useIsAllowed } from "@/lib/proxy-resolver-context";
import { getUserRateLimits, updateUserRateLimits, searchDeletedMessages, restoreDeletedMessages } from "../api-client";
import { appConfig } from "@/lib/config";
import Header from "@/components/custom/header";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { ExpandCollapseAll, SectionsProvider } from "@/components/custom/collapsible-section";

export default function UserDetail() {
  const { t } = useTranslation();
  const { username } = useParams();
  const canUpdateRateLimits = useIsAllowed("PUT", "/users/{username}/ratelimits");
  const canSearchDeleted = useIsAllowed("POST", "/deletedMessages/users/{username}/messages");
  const canRestoreDeleted = useIsAllowed("POST", "/deletedMessages/users/{username}");

  const breadcrumbs = useBreadcrumbs();
  const mappingsRevision = useUserMappingsRevisionState();
  const fetchRateLimits = useCallback(() => getUserRateLimits(username!), [username]);
  const updateRateLimits = useCallback((limits: any) => updateUserRateLimits(username!, limits), [username]);

  return (
    <SectionsProvider page="user">
    <Header headerTitle={username} headerSubTitle={t("users.detailKind")} breadcrumb={breadcrumbs.users()} actions={<ExpandCollapseAll />} />
    <div className="mt-4 p-4 bg-white rounded-2">

      <UserMailboxes username={username!} />
      <UserQuota username={username!} />
      <UserMappingsRevisionContext.Provider value={mappingsRevision}>
        <UserAliases username={username!} />
        <UserForwards username={username!} />
        <UserMappings username={username!} />
        <UserTeamMailboxes username={username!} />
        <UserVacation username={username!} />
        <UserDelegation username={username!} />
        <UserAllowedFrom username={username!} />
        <UserIdentities username={username!} />
      </UserMappingsRevisionContext.Provider>
      <UserLabels username={username!} />
      {appConfig.application === 'MAIL' && <UserJmapSettings username={username!} />}
      <RateLimitsSection fetchRateLimits={fetchRateLimits} updateRateLimits={updateRateLimits} canUpdate={canUpdateRateLimits} />
      {(canSearchDeleted || canRestoreDeleted) && (
        <UserDeletedMessageVault
          label={username!}
          onSearch={(body) => searchDeletedMessages(username!, body)}
          onRestore={(body) => restoreDeletedMessages(username!, body)}
          canSearch={canSearchDeleted}
          canRestore={canRestoreDeleted}
        />
      )}
      <UserTasks username={username!} />
      <UserChannels username={username!} />
    </div>
    </SectionsProvider>
  );
}
