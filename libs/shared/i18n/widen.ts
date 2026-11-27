/**
 * Maakt van Nederlandse letterlijke teksten vrije tekst, zodat een andere taal
 * dezelfde vorm moet volgen maar eigen woorden mag gebruiken. Functies houden hun
 * parameters; alleen hun teksten worden vrij.
 */
export type Widen<T> = T extends string
  ? string
  : T extends (...args: infer Args) => infer Result
    ? (...args: Args) => Widen<Result>
    : T extends readonly (infer Item)[]
      ? readonly Widen<Item>[]
      : T extends object
        ? { readonly [Key in keyof T]: Widen<T[Key]> }
        : T;
