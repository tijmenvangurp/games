/**
 * De instellingen van Wie was het?. Ze horen bij het kind, niet bij één zaak,
 * en blijven daarom bewaard naast de lopende zaak.
 */
export interface MurdokuSettings {
  /** Streep de rij en kolom van een geplaatst persoon automatisch weg. */
  autoCross: boolean;
}

export const DEFAULT_MURDOKU_SETTINGS: MurdokuSettings = {
  autoCross: true,
};
