import { useState, type ReactNode } from "react";
import { avatarFor } from "@entities/profile";
import { Button, KeyRound, LogOut, ShieldCheck } from "@shared/ui";
import { authClient } from "../model/auth-client";
import type { AccountAuthClient, AccountSession } from "../model/types";

interface Feedback {
  readonly kind: "error" | "success";
  readonly text: string;
}

type BusyAction = "google" | "passkey" | "add" | "signout" | null;

interface AccountScreenProps {
  /** Tests pass a fake client; the app uses the same-origin Better Auth client. */
  client?: AccountAuthClient;
}

const defaultClient = authClient as unknown as AccountAuthClient;

function resultFailed(result: unknown): boolean {
  return (
    typeof result === "object" && result !== null && "error" in result && Boolean(result.error)
  );
}

function passkeysSupported(): boolean {
  return typeof window !== "undefined" && "PublicKeyCredential" in window;
}

function AccountHeader() {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
        <ShieldCheck aria-hidden="true" className="size-6" />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Optioneel
        </p>
        <h2 id="account-kop" className="text-lg font-black">
          Ouderaccount
        </h2>
      </div>
    </div>
  );
}

function FeedbackNotice({ feedback }: { feedback: Feedback | null }) {
  if (!feedback) {
    return null;
  }

  return (
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
  );
}

function UnavailableNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
      <p role="alert">Inloggen is nu niet beschikbaar. Je kunt gewoon blijven spelen.</p>
      <Button className="mt-2" size="sm" variant="outline" onClick={onRetry}>
        Opnieuw proberen
      </Button>
    </div>
  );
}

interface SignedInPanelProps {
  readonly session: AccountSession;
  readonly busy: BusyAction;
  readonly supportsPasskeys: boolean;
  readonly onAddPasskey: () => void;
  readonly onSignOut: () => void;
}

function SignedInPanel({
  session,
  busy,
  supportsPasskeys,
  onAddPasskey,
  onSignOut,
}: SignedInPanelProps) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
        <span aria-hidden="true" className="text-3xl">
          {avatarFor("bear").emoji}
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold">{session.user.name}</p>
          <p className="truncate text-sm text-muted-foreground">{session.user.email}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        <Button
          className="w-full"
          disabled={busy !== null || !supportsPasskeys}
          size="lg"
          variant="outline"
          onClick={onAddPasskey}
        >
          <KeyRound aria-hidden="true" className="size-5" />
          {busy === "add" ? "Bezig…" : "Passkey toevoegen"}
        </Button>
        <Button
          className="w-full"
          disabled={busy !== null}
          size="lg"
          variant="ghost"
          onClick={onSignOut}
        >
          <LogOut aria-hidden="true" className="size-5" />
          {busy === "signout" ? "Bezig…" : "Uitloggen"}
        </Button>
      </div>

      {!supportsPasskeys ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Deze browser ondersteunt geen passkeys.
        </p>
      ) : null}
    </div>
  );
}

interface SignedOutPanelProps {
  readonly busy: BusyAction;
  readonly supportsPasskeys: boolean;
  readonly onGoogle: () => void;
  readonly onPasskey: () => void;
}

function SignedOutPanel({ busy, supportsPasskeys, onGoogle, onPasskey }: SignedOutPanelProps) {
  return (
    <div className="mt-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <Button className="w-full" disabled={busy !== null} size="lg" onClick={onGoogle}>
          {busy === "google" ? "Bezig…" : "Inloggen met Google"}
        </Button>
        <Button
          className="w-full"
          disabled={busy !== null || !supportsPasskeys}
          size="lg"
          variant="outline"
          onClick={onPasskey}
        >
          <KeyRound aria-hidden="true" className="size-5" />
          {busy === "passkey" ? "Bezig…" : "Inloggen met passkey"}
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Nog geen passkey? Log eerst in met Google en voeg daarna een passkey toe. Beide manieren
        horen bij hetzelfde ouderaccount.
      </p>
      {!supportsPasskeys ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Deze browser ondersteunt geen passkeys.
        </p>
      ) : null}
    </div>
  );
}

function StatusLine({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 text-sm font-semibold text-muted-foreground" role="status">
      {children}
    </p>
  );
}

export function AccountScreen({ client = defaultClient }: AccountScreenProps) {
  const { data: session, isPending, error, refetch } = client.useSession();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState<BusyAction>(null);
  const supportsPasskeys = passkeysSupported();

  const run = async (action: BusyAction, task: () => Promise<unknown>, failure: string) => {
    setBusy(action);
    setFeedback(null);
    try {
      const result = await task();
      if (resultFailed(result)) {
        setFeedback({ kind: "error", text: failure });
      }
      return !resultFailed(result);
    } catch {
      setFeedback({ kind: "error", text: failure });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const signInWithGoogle = () => {
    void run(
      "google",
      () => client.signIn.social({ provider: "google", callbackURL: "/account" }),
      "Inloggen met Google lukte niet. Probeer het opnieuw.",
    );
  };

  const signInWithPasskey = () => {
    void run(
      "passkey",
      () => client.signIn.passkey(),
      "Inloggen met een passkey lukte niet. Probeer het opnieuw.",
    );
  };

  const addPasskey = async () => {
    const added = await run(
      "add",
      () => client.passkey.addPasskey({ name: "Ouderpasskey" }),
      "De passkey toevoegen lukte niet. Probeer het opnieuw.",
    );
    if (added) {
      setFeedback({
        kind: "success",
        text: "Passkey toegevoegd. Je kunt hem nu gebruiken om in te loggen.",
      });
    }
  };

  const signOut = async () => {
    const signedOut = await run(
      "signout",
      () => client.signOut(),
      "Uitloggen lukte niet. Probeer het opnieuw.",
    );
    if (signedOut) {
      await refetch();
    }
  };

  return (
    <section aria-labelledby="account-kop" className="rounded-3xl border bg-card p-4 shadow-sm">
      <AccountHeader />

      <p className="mt-3 text-sm text-muted-foreground">
        Je kunt altijd blijven spelen zonder account. Je account begint leeg; je lokale voortgang
        blijft op dit toestel staan.
      </p>

      {isPending ? <StatusLine>Bezig met laden…</StatusLine> : null}
      {!isPending && error ? <UnavailableNotice onRetry={() => void refetch()} /> : null}
      {!isPending && !error && session ? (
        <SignedInPanel
          busy={busy}
          session={session}
          supportsPasskeys={supportsPasskeys}
          onAddPasskey={() => void addPasskey()}
          onSignOut={() => void signOut()}
        />
      ) : null}
      {!isPending && !error && !session ? (
        <SignedOutPanel
          busy={busy}
          supportsPasskeys={supportsPasskeys}
          onGoogle={signInWithGoogle}
          onPasskey={signInWithPasskey}
        />
      ) : null}

      <FeedbackNotice feedback={feedback} />
    </section>
  );
}
