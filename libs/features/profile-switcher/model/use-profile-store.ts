import { create } from "zustand";
import {
  createProfile,
  removeProfile,
  selectProfile,
  type ProfileAvatarId,
  type ProfileState,
} from "@entities/profile";
import { notifyProfilesChanged } from "@shared/lib";
import {
  clearProfileGames,
  exportProfilesJson,
  importProfilesJson,
  loadProfileState,
  saveProfileState,
} from "./profile-storage";

export interface ProfileStore {
  state: ProfileState;
  error: string | null;
  switchProfile: (id: string) => boolean;
  addProfile: (name: string, avatar: ProfileAvatarId) => boolean;
  deleteProfile: (id: string) => boolean;
  exportProfiles: () => string;
  importProfiles: (text: string) => boolean;
  clearError: () => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  state: loadProfileState(),
  error: null,

  switchProfile: (id) => {
    const next = selectProfile(get().state, id);
    if (!next) {
      return false;
    }
    saveProfileState(next);
    set({ state: next, error: null });
    notifyProfilesChanged();
    return true;
  },

  addProfile: (name, avatar) => {
    const next = createProfile(get().state, { name, avatar });
    if (!next) {
      set({ error: "Dat profiel kon niet worden gemaakt." });
      return false;
    }
    saveProfileState(next);
    set({ state: next, error: null });
    notifyProfilesChanged();
    return true;
  },

  deleteProfile: (id) => {
    const current = get().state;
    if (current.profiles.length <= 1) {
      set({ error: "Je kunt het laatste profiel niet verwijderen." });
      return false;
    }
    const next = removeProfile(current, id);
    if (!next) {
      set({ error: "Dat profiel kon niet worden verwijderd." });
      return false;
    }
    clearProfileGames(id);
    saveProfileState(next);
    set({ state: next, error: null });
    notifyProfilesChanged();
    return true;
  },

  exportProfiles: () => exportProfilesJson(),

  importProfiles: (text) => {
    const next = importProfilesJson(text);
    if (!next) {
      set({ error: "Dit is geen geldig profielenbestand. Er is niets gewijzigd." });
      return false;
    }
    set({ state: next, error: null });
    notifyProfilesChanged();
    return true;
  },

  clearError: () => set({ error: null }),
}));
