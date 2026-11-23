import type { WordSet } from "./types";

/**
 * Engelse woordensets met dezelfde ids, thema's, niveaus en rondes als de
 * Nederlandse. Dezelfde regels gelden: 4–6 woorden, korte woorden op niveau 1
 * en hoogstens 12 of 14 verschillende letters; de test bewaakt dat.
 */
export const ENGLISH_WORD_SETS: readonly WordSet[] = [
  {
    id: "sinterklaas-1-1",
    theme: "sinterklaas",
    level: 1,
    round: 1,
    words: ["boat", "gift", "star", "sack"],
  },
  {
    id: "sinterklaas-1-2",
    theme: "sinterklaas",
    level: 1,
    round: 2,
    words: ["book", "shoe", "hat", "poem"],
  },
  {
    id: "sinterklaas-2-1",
    theme: "sinterklaas",
    level: 2,
    round: 1,
    words: ["gift", "boat", "sack", "star", "horse", "staff"],
  },
  {
    id: "sinterklaas-2-2",
    theme: "sinterklaas",
    level: 2,
    round: 2,
    words: ["beard", "shoe", "sweet", "book", "boat", "star"],
  },
  {
    id: "sinterklaas-3-1",
    theme: "sinterklaas",
    level: 3,
    round: 1,
    words: ["mitre", "sweet", "shoe", "boat", "gift", "star"],
  },
  {
    id: "sinterklaas-3-2",
    theme: "sinterklaas",
    level: 3,
    round: 2,
    words: ["parcel", "horse", "boat", "book", "star", "sack"],
  },
  { id: "tuin-1-1", theme: "tuin", level: 1, round: 1, words: ["bee", "rose", "tree", "slug"] },
  { id: "tuin-1-2", theme: "tuin", level: 1, round: 2, words: ["leaf", "nest", "pond", "rake"] },
  {
    id: "tuin-2-1",
    theme: "tuin",
    level: 2,
    round: 1,
    words: ["flower", "tree", "grass", "snail", "rose", "rake"],
  },
  {
    id: "tuin-2-2",
    theme: "tuin",
    level: 2,
    round: 2,
    words: ["tree", "grass", "snail", "rose", "rake", "nest"],
  },
  {
    id: "tuin-3-1",
    theme: "tuin",
    level: 3,
    round: 1,
    words: ["flower", "pond", "leaf", "rose", "nest"],
  },
  {
    id: "tuin-3-2",
    theme: "tuin",
    level: 3,
    round: 2,
    words: ["water", "bird", "nest", "sun", "rose", "leaf"],
  },
  {
    id: "onderwater-1-1",
    theme: "onderwater",
    level: 1,
    round: 1,
    words: ["fish", "crab", "sea", "boat"],
  },
  {
    id: "onderwater-1-2",
    theme: "onderwater",
    level: 1,
    round: 2,
    words: ["sand", "wave", "deep", "reef"],
  },
  {
    id: "onderwater-2-1",
    theme: "onderwater",
    level: 2,
    round: 1,
    words: ["fish", "crab", "boat", "coral", "whale", "shark"],
  },
  {
    id: "onderwater-2-2",
    theme: "onderwater",
    level: 2,
    round: 2,
    words: ["sea", "sand", "whale", "shark", "deep", "wave"],
  },
  {
    id: "onderwater-3-1",
    theme: "onderwater",
    level: 3,
    round: 1,
    words: ["fish", "crab", "boat", "coral", "whale", "shell"],
  },
  {
    id: "onderwater-3-2",
    theme: "onderwater",
    level: 3,
    round: 2,
    words: ["sea", "sand", "whale", "seal", "deep", "wave"],
  },
];
