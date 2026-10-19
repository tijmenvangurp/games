/**
 * A plain DOM event keeps the account screen and the sync feature decoupled:
 * the auth feature only announces that the session changed, and sync decides
 * whether it can start. This works after passkey sign-in, the Google redirect
 * and sign-out without a shared store.
 */
export const ACCOUNT_CHANGED_EVENT = "spellen:account-changed";

export function announceAccountChange(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(ACCOUNT_CHANGED_EVENT));
}
