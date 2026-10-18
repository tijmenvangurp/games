import { useEffect, useState, type ReactNode } from "react";
import { avatarFor } from "@entities/profile";
import { Button, KeyRound, LogOut, ShieldCheck } from "@shared/ui";
import { accountAuthClient } from "../model/auth-client";
import type { AccountAuthClient, AccountSession, AuthCapabilities } from "../model/types";

interface Feedback {
  readonly kind: "error" | "success";
  readonly text: string;
}

type BusyAction = "create" | "google" | "passkey" | "add" | "link" | "signout" | null;

interface AccountScreenProps {
  /** Tests pass a fake client; the app uses the same-origin Better Auth client. */
  client?: AccountAuthClient;
}

const defaultClient = accountAuthClient;

function resultFailed(result: unknown): boolean {
  return (
    typeof result === "object" && result !== null && "error" in result && Boolean(result.error)
  );
}

function passkeysSupported(): boolean {
  return typeof window !== "undefined" && "PublicKeyCredential" in window;
}

function isSyntheticEmail(email: string): boolean {
  return email.endsWith("@invalid");
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
  readonly googleEnabled: boolean;
  readonly googleLinked: boolean;
  readonly onAddPasskey: () => void;
  readonly onLinkGoogle: () => void;
  readonly onSignOut: () => void;
}

function AccountIdentity({
  session,
  passkeyOnly,
}: {
  readonly session: AccountSession;
  readonly passkeyOnly: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
      <span aria-hidden="true" className="text-3xl">
        {avatarFor("bear").emoji}
      </span>
      <div className="min-w-0">
        <p className="truncate font-bold">{session.user.name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {passkeyOnly ? "Passkey-account zonder e-mail" : session.user.email}
        </p>
      </div>
    </div>
  );
}

function SignedInActions({
  busy,
  supportsPasskeys,
  googleEnabled,
  googleLinked,
  onAddPasskey,
  onLinkGoogle,
  onSignOut,
}: Omit<SignedInPanelProps, "session">) {
  return (
    <div className="mt-3 grid gap-2">
      <Button
        className="w-full"
        disabled={busy !== null || !supportsPasskeys}
        size="lg"
        variant="outline"
        onClick={onAddPasskey}
      >
        <KeyRound aria-hidden="true" className="size-5" />
        {busy === "add" ? "Bezig…" : "Nog een passkey toevoegen"}
      </Button>

      {googleEnabled && !googleLinked ? (
        <Button
          className="w-full"
          disabled={busy !== null}
          size="lg"
          variant="outline"
          onClick={onLinkGoogle}
        >
          {busy === "link" ? "Bezig…" : "Google koppelen"}
        </Button>
      ) : null}

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
  );
}

function AccountNotes({
  passkeyOnly,
  googleEnabled,
  googleLinked,
  supportsPasskeys,
}: {
  readonly passkeyOnly: boolean;
  readonly googleEnabled: boolean;
  readonly googleLinked: boolean;
  readonly supportsPasskeys: boolean;
}) {
  return (
    <>
      {googleLinked ? (
        <p className="mt-2 text-xs text-muted-foreground">Google is aan dit account gekoppeld.</p>
      ) : null}

      {passkeyOnly ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Er is geen e-mailherstel. Voeg een tweede passkey toe op een ander toestel, of koppel
          Google zodat je later ook met Google kunt inloggen.
        </p>
      ) : null}

      {passkeyOnly && !googleEnabled ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Google koppelen is niet ingesteld. Bewaar je passkey daarom extra goed.
        </p>
      ) : null}

      {!supportsPasskeys ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Deze browser ondersteunt geen passkeys.
        </p>
      ) : null}
    </>
  );
}

function SignedInPanel({
  session,
  busy,
  supportsPasskeys,
  googleEnabled,
  googleLinked,
  onAddPasskey,
  onLinkGoogle,
  onSignOut,
}: SignedInPanelProps) {
  const passkeyOnly = isSyntheticEmail(session.user.email);

  return (
    <div className="mt-4">
      <AccountIdentity passkeyOnly={passkeyOnly} session={session} />

      <p className="mt-3 text-sm text-muted-foreground">
        {googleLinked
          ? "Je kunt inloggen met je passkey en met Google. Je account begint leeg; je lokale voortgang blijft op dit toestel."
          : "Je account begint leeg; je lokale voortgang blijft op dit toestel."}
      </p>

      <SignedInActions
        busy={busy}
        googleEnabled={googleEnabled}
        googleLinked={googleLinked}
        supportsPasskeys={supportsPasskeys}
        onAddPasskey={onAddPasskey}
        onLinkGoogle={onLinkGoogle}
        onSignOut={onSignOut}
      />

      <AccountNotes
        googleEnabled={googleEnabled}
        googleLinked={googleLinked}
        passkeyOnly={passkeyOnly}
        supportsPasskeys={supportsPasskeys}
      />
    </div>
  );
}

interface SignedOutPanelProps {
  readonly busy: BusyAction;
  readonly supportsPasskeys: boolean;
  readonly googleEnabled: boolean;
  readonly onCreateAccount: () => void;
  readonly onGoogle: () => void;
  readonly onPasskey: () => void;
}

function SignedOutActions({
  busy,
  supportsPasskeys,
  googleEnabled,
  onCreateAccount,
  onGoogle,
  onPasskey,
}: SignedOutPanelProps) {
  return (
    <div className="grid gap-2">
      <Button
        className="w-full"
        disabled={busy !== null || !supportsPasskeys}
        size="lg"
        onClick={onCreateAccount}
      >
        <KeyRound aria-hidden="true" className="size-5" />
        {busy === "create" ? "Bezig…" : "Account aanmaken met passkey"}
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

      {googleEnabled ? (
        <Button
          className="w-full"
          disabled={busy !== null}
          size="lg"
          variant="outline"
          onClick={onGoogle}
        >
          {busy === "google" ? "Bezig…" : "Inloggen met Google"}
        </Button>
      ) : null}
    </div>
  );
}

function SignedOutNotes({
  googleEnabled,
  supportsPasskeys,
}: {
  readonly googleEnabled: boolean;
  readonly supportsPasskeys: boolean;
}) {
  return (
    <>
      <p className="mt-3 text-xs text-muted-foreground">
        Nieuw hier? Maak een account met alleen een passkey. Je hebt geen e-mailadres nodig en er
        komt geen wachtwoord aan te pas.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Een passkey-account heeft geen e-mailherstel. Bewaar je passkey goed en voeg later een
        tweede passkey toe op een ander toestel.
      </p>
      {googleEnabled ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Je kunt Google later aan je account koppelen.
        </p>
      ) : null}
      {!googleEnabled && supportsPasskeys ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Inloggen met Google is niet ingesteld. Je kunt gewoon een account met een passkey maken.
        </p>
      ) : null}
      {!supportsPasskeys ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Deze browser ondersteunt geen passkeys. Gebruik een browser of toestel met
          passkey-ondersteuning.
        </p>
      ) : null}
    </>
  );
}

function SignedOutPanel({
  busy,
  supportsPasskeys,
  googleEnabled,
  onCreateAccount,
  onGoogle,
  onPasskey,
}: SignedOutPanelProps) {
  return (
    <div className="mt-4">
      <SignedOutActions
        busy={busy}
        googleEnabled={googleEnabled}
        supportsPasskeys={supportsPasskeys}
        onCreateAccount={onCreateAccount}
        onGoogle={onGoogle}
        onPasskey={onPasskey}
      />
      <SignedOutNotes googleEnabled={googleEnabled} supportsPasskeys={supportsPasskeys} />
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
  const [capabilities, setCapabilities] = useState<AuthCapabilities | null>(null);
  const [linkedProviders, setLinkedProviders] = useState<readonly string[]>([]);
  const supportsPasskeys = passkeysSupported();
  const sessionKey = session?.user.email ?? null;

  useEffect(() => {
    let active = true;
    void client
      .getCapabilities()
      .then((value) => {
        if (active) {
          setCapabilities(value);
        }
      })
      .catch(() => {
        if (active) {
          setCapabilities({ passkey: true, google: false });
        }
      });

    return () => {
      active = false;
    };
  }, [client]);

  useEffect(() => {
    if (!sessionKey) {
      setLinkedProviders([]);
      return;
    }

    let active = true;
    void client.listLinkedProviders().then((providers) => {
      if (active) {
        setLinkedProviders(providers);
      }
    });

    return () => {
      active = false;
    };
  }, [client, sessionKey]);

  const googleEnabled = capabilities?.google === true;
  const googleLinked = linkedProviders.includes("google");

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

  const createAccount = async () => {
    const created = await run(
      "create",
      async () => {
        const context = await client.createPasskeyContext();
        return client.passkey.addPasskey({
          name: "Ouderpasskey",
          context,
          createSession: true,
        });
      },
      "Het aanmaken van een account met een passkey lukte niet. Probeer het opnieuw.",
    );
    if (created) {
      await refetch();
      setFeedback({
        kind: "success",
        text: "Je account is aangemaakt. Je bent meteen ingelogd.",
      });
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

  const linkGoogle = async () => {
    const linked = await run(
      "link",
      () => client.linkSocial({ provider: "google", callbackURL: "/account" }),
      "Google koppelen lukte niet. Probeer het opnieuw.",
    );
    if (linked) {
      setLinkedProviders(await client.listLinkedProviders());
      setFeedback({ kind: "success", text: "Google is gekoppeld aan je account." });
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
          googleEnabled={googleEnabled}
          googleLinked={googleLinked}
          session={session}
          supportsPasskeys={supportsPasskeys}
          onAddPasskey={() => void addPasskey()}
          onLinkGoogle={() => void linkGoogle()}
          onSignOut={() => void signOut()}
        />
      ) : null}
      {!isPending && !error && !session ? (
        <SignedOutPanel
          busy={busy}
          googleEnabled={googleEnabled}
          supportsPasskeys={supportsPasskeys}
          onCreateAccount={() => void createAccount()}
          onGoogle={signInWithGoogle}
          onPasskey={signInWithPasskey}
        />
      ) : null}

      <FeedbackNotice feedback={feedback} />
    </section>
  );
}
