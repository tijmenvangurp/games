import { useNavigate } from "@tanstack/react-router";
import { AccountScreen } from "@features/auth";
import { PageHeader } from "@shared/ui";
import { SyncConsentPanel } from "./sync-consent-panel";

export function AccountPage() {
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 px-4 pb-10 pt-safe">
      <PageHeader
        onBack={() => navigate({ to: "/" })}
        subtitle="Optioneel, voor ouders"
        title="Account"
      />

      <AccountScreen />

      {/* Per-profile progress sync opt-in (ADR 0012): hidden for guests. */}
      <SyncConsentPanel />

      <p className="mt-auto pt-6 text-center text-xs text-muted-foreground">
        Er is geen kindlogin. Kinderen spelen met een lokaal profiel.
      </p>
    </main>
  );
}
