import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  DEFAULT_PROFILE_AVATAR,
  MAX_PROFILES,
  PROFILE_AVATARS,
  PROFILE_NAME_MAX_LENGTH,
  avatarFor,
  type ProfileAvatarId,
} from "@entities/profile";
import { cn } from "@shared/lib";
import { Button, Check, Download, Plus, Trash2, Upload, X } from "@shared/ui";
import { useProfileStore } from "../model/use-profile-store";

interface ProfileSwitcherProps {
  /** Tests can replace the reload; the app reloads so every game store rehydrates. */
  onProfileChanged?: () => void;
}

export function ProfileSwitcher({ onProfileChanged }: ProfileSwitcherProps) {
  const state = useProfileStore((store) => store.state);
  const error = useProfileStore((store) => store.error);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<ProfileAvatarId>(DEFAULT_PROFILE_AVATAR);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const notifyChange = () => {
    if (onProfileChanged) {
      onProfileChanged();
    } else {
      window.location.reload();
    }
  };

  const switchTo = (id: string) => {
    if (id === state.activeProfileId) {
      return;
    }
    if (useProfileStore.getState().switchProfile(id)) {
      notifyChange();
    }
  };

  const startAdding = () => {
    useProfileStore.getState().clearError();
    setName(`Speler ${state.nextProfileNumber}`);
    setAvatar(DEFAULT_PROFILE_AVATAR);
    setAdding(true);
  };

  const cancelAdding = () => {
    setAdding(false);
    useProfileStore.getState().clearError();
  };

  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (useProfileStore.getState().addProfile(name, avatar)) {
      setAdding(false);
      notifyChange();
    }
  };

  const deleteProfile = (id: string) => {
    if (useProfileStore.getState().deleteProfile(id)) {
      setConfirmingDelete(null);
      notifyChange();
    }
  };

  const exportProfiles = () => {
    const blob = new Blob([useProfileStore.getState().exportProfiles()], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "spellen-profielen.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importProfiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    input.value = "";
    if (useProfileStore.getState().importProfiles(text)) {
      notifyChange();
    }
  };

  return (
    <section aria-labelledby="profiel-kop" className="rounded-3xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Wie speelt er?
          </p>
          <h2 id="profiel-kop" className="text-lg font-black">
            Profiel
          </h2>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {state.profiles.length} van {MAX_PROFILES}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {state.profiles.map((profile) => {
          const active = profile.id === state.activeProfileId;
          const avatarInfo = avatarFor(profile.avatar);
          return (
            <button
              key={profile.id}
              aria-pressed={active}
              className={cn(
                "flex min-h-11 min-w-28 items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left text-sm font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card hover:bg-muted",
              )}
              type="button"
              onClick={() => switchTo(profile.id)}
            >
              <span aria-hidden="true" className="text-2xl">
                {avatarInfo.emoji}
              </span>
              <span className="max-w-24 truncate">{profile.name}</span>
              {active ? <Check aria-hidden="true" className="ml-auto size-4" /> : null}
            </button>
          );
        })}

        {state.profiles.length < MAX_PROFILES ? (
          <button
            aria-label="Profiel toevoegen"
            className="grid size-14 place-items-center rounded-2xl border-2 border-dashed border-border text-muted-foreground transition hover:bg-muted active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            type="button"
            onClick={startAdding}
          >
            <Plus aria-hidden="true" className="size-6" />
          </button>
        ) : null}
      </div>

      {error ? (
        <p
          className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {adding ? (
        <form className="mt-3 rounded-2xl border bg-muted/40 p-3" onSubmit={submitProfile}>
          <label className="text-sm font-semibold" htmlFor="profiel-naam">
            Naam
          </label>
          <input
            autoFocus
            className="mt-1 h-11 w-full rounded-xl border-2 border-border bg-card px-3 text-base font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            id="profiel-naam"
            maxLength={PROFILE_NAME_MAX_LENGTH}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <fieldset className="mt-3">
            <legend className="text-sm font-semibold">Kies een plaatje</legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {PROFILE_AVATARS.map((option) => (
                <button
                  key={option.id}
                  aria-label={option.label}
                  aria-pressed={avatar === option.id}
                  className={cn(
                    "grid size-11 place-items-center rounded-xl border-2 text-2xl transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
                    avatar === option.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:bg-muted",
                  )}
                  type="button"
                  onClick={() => setAvatar(option.id)}
                >
                  <span aria-hidden="true">{option.emoji}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-3 flex gap-2">
            <Button className="min-h-11 flex-1" size="lg" type="submit">
              Profiel maken
            </Button>
            <Button
              aria-label="Annuleren"
              size="icon"
              type="button"
              variant="outline"
              onClick={cancelAdding}
            >
              <X aria-hidden="true" className="size-5" />
            </Button>
          </div>
        </form>
      ) : null}

      <details className="mt-2">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-bold text-muted-foreground">
          Beheer
        </summary>
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap gap-2">
            <Button
              className="min-h-11 flex-1"
              size="lg"
              type="button"
              variant="outline"
              onClick={exportProfiles}
            >
              <Download aria-hidden="true" className="size-5" />
              Exporteren
            </Button>
            <Button
              className="min-h-11 flex-1"
              size="lg"
              type="button"
              variant="outline"
              onClick={() => fileInput.current?.click()}
            >
              <Upload aria-hidden="true" className="size-5" />
              Importeren
            </Button>
            <input
              ref={fileInput}
              accept="application/json,.json"
              aria-label="Profielen importeren"
              className="sr-only"
              type="file"
              onChange={(event) => void importProfiles(event)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Importeren vervangt alle profielen op dit toestel. Het geluid blijft hetzelfde.
          </p>

          <ul className="space-y-2">
            {state.profiles.map((profile) => (
              <li key={profile.id} className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                  <span aria-hidden="true" className="text-xl">
                    {avatarFor(profile.avatar).emoji}
                  </span>
                  <span className="truncate">{profile.name}</span>
                </span>
                {confirmingDelete === profile.id ? (
                  <span className="flex gap-1">
                    <Button
                      className="min-h-11 bg-red-600 text-white hover:bg-red-700"
                      size="lg"
                      type="button"
                      onClick={() => deleteProfile(profile.id)}
                    >
                      Ja, verwijder
                    </Button>
                    <Button
                      className="min-h-11"
                      size="lg"
                      type="button"
                      variant="outline"
                      onClick={() => setConfirmingDelete(null)}
                    >
                      Nee
                    </Button>
                  </span>
                ) : (
                  <Button
                    aria-label={`Verwijder profiel ${profile.name}`}
                    disabled={state.profiles.length <= 1}
                    size="icon"
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      useProfileStore.getState().clearError();
                      setConfirmingDelete(profile.id);
                    }}
                  >
                    <Trash2 aria-hidden="true" className="size-5" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </details>
    </section>
  );
}
