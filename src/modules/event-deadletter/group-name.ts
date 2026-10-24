/**
 * The readable name of a listener group, the last segment of its class name:
 * "org.apache.james.vault.DeletedMessageVaultDeletionListener$DeletedMessageVaultListenerGroup"
 * reads "DeletedMessageVaultListenerGroup".
 */
export const groupDisplayName = (group: string): string => group.split(/[.$]/).filter(Boolean).pop() ?? group;
