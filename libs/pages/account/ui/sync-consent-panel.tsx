import { useState, useMemo } from "react";
import { accountAuthClient, type AccountAuthClient } from "@features/auth";
import { isProfileSyncEnabled, setProfileSyncEnabled } from "@features/sync";
import {
  avatarFor,
  createInitialProfileState,
  parseProfileState,
  type Profile,
} from "@entities/profile";
import { PROFILE_STORAGE_KEY, readStoredJson } from "@shared/lib";
import { Button, ShieldCheck } from "@shared/ui";

interface Feedback {
  readonly kind: "error" | "success";
  readonly text: string;
}

interface SyncConsentPanelProps {
  /** Tests pass a fake client; the app uses the same-origin Better Auth client. */
  readonly client?: AccountAuthClient;
}

function localProfiles(): readonly Profile[] {
  const parsed = parseProfileState(readStoredJson(PROFILE_STORAGE_KEY));
  return parsed?.profiles ?? createInitialProfileState().profiles;
}

function readFlags(): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  for (const profile of localProfiles()) {
    flags[profile.id] = isProfileSyncEnabled(profile.id);
  }
  return flags;
}

function ProfileRow({
  busy,
  feedback,
  onToggle,
  profile,
  syncEnabled,
}: {
  readonly busy: boolean;
  readonly feedback: string;
  readonly onToggle: () => void;
  readonly profile: Profile;
  readonly syncEnabled: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 p-3">
      <span className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className="text-2xl">
          {avatarFor(profile.avatar).emoji}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold">{profile.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{feedback}</span>
        </span>
      </span>
      <Button
        aria-pressed={syncEnabled}
        className="h-11 shrink-0 px-4 text-sm"
        disabled={busy}
        variant="outline"
        onClick={onToggle}
      >
        {syncEnabled ? "Synchroniseren: aan" : "Synchroniseren: uit"}
      </Button>
    </li>
  );
}

/**
 * Page-level panel for the per-profile progress sync opt-in (ADR 0012,
 * beslissingen 5, 6 en 7). Guest-first: without a session nothing renders and
 * every game keeps working locally. Errors are caught: a failing Worker never
 * blocks playing or toggling again later.
 */
export function SyncConsentPanel({ client = accountAuthClient }: SyncConsentPanelProps) {
  const { data: session, isPending } = client.useSession();
  const profiles = useMemo(localProfiles, []);
  const [flags, setFlags] = useState<Record<string, boolean>>(readFlags);
  const [saving, setSaving] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  if (isPending || !session) {
    return null;
  }

  const toggle = async (profile: Profile) => {
    const previous = flags;
    const enabled = !(flags[profile.id] === true);
    setFlags({ ...flags, [profile.id]: enabled });
    setSaving(profile.id);
    setFeedback(null);
    try {
      await setProfileSyncEnabled(profile.id, enabled);
      setFeedback(
        enabled
          ? { kind: "success", text: "Voortgang van dit profiel wordt nu gesynchroniseerd." }
          : { kind: "success", text: "Synchronisatie staat uit; alles blijft lokaal." },
      );
    } catch {
      setFlags(previous);
      setFeedback({
        kind: "error",
        text: "Synchroniseren lukte niet. Probeer het opnieuw; je kunt gewoon verder spelen.",
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <section aria-labelledby="sync-kop" className="rounded-3xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck aria-hidden="true" className="size-6" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Jouw keuze
          </p>
          <h2 id="sync-kop" className="text-lg font-black">
            Voortgang synchroniseren
          </h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Je account begint leeg; je lokale voortgang blijft op dit toestel. Zet een profiel aan om de
        voortgang daarvan op meerdere toestellen beschikbaar te komen. Een profiel dat uit staat,
        synchroniseert niets.
      </p>

      <ul className="mt-3 grid gap-2">
        {profiles.map((profile) => (
          <ProfileRow
            busy={saving !== null}
            feedback={
              flags[profile.id] === true
                ? "Voortgang wordt gesynchroniseerd"
                : "Alles blijft lokaal op dit toestel"
            }
            key={profile.id}
            onToggle={() => void toggle(profile)}
            profile={profile}
            syncEnabled={flags[profile.id] === true}
          />
        ))}
      </ul>

      {feedback ? (
        <p
          className={
            feedback.kind === "error"
              ? "mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
              : "mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
          }
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.text}
        </p>
      ) : null}
    </section>
  );
}
