import type { AlchemyElement, ElementId } from "./types";

/**
 * The first vertical slice of Mengelmoes. Every icon is a local Fluent Emoji
 * Flat SVG; see LICENSES/fluent-emoji-MIT.txt for the source and license.
 */
export const ELEMENTS: readonly AlchemyElement[] = [
  {
    id: "water",
    name: "Water",
    icon: "/elements/water.svg",
    category: "water",
    fact: "Water heb je nodig om dingen te laten groeien.",
  },
  {
    id: "fire",
    name: "Vuur",
    icon: "/elements/fire.svg",
    category: "fire",
    fact: "Vuur is warm en kan dingen veranderen.",
  },
  {
    id: "earth",
    name: "Aarde",
    icon: "/elements/earth.svg",
    category: "earth",
    fact: "Aarde is de grond onder je voeten.",
  },
  {
    id: "air",
    name: "Lucht",
    icon: "/elements/air.svg",
    category: "air",
    fact: "Lucht kun je niet zien, maar wel voelen.",
  },
  {
    id: "mud",
    name: "Modder",
    icon: "/elements/mud.svg",
    category: "earth",
    fact: "Modder is natte aarde.",
  },
  {
    id: "steam",
    name: "Stoom",
    icon: "/elements/steam.svg",
    category: "water",
    fact: "Stoom is water dat heel warm is geworden.",
  },
  {
    id: "lava",
    name: "Lava",
    icon: "/elements/lava.svg",
    category: "fire",
    fact: "Lava is gesmolten steen.",
  },
  {
    id: "energy",
    name: "Energie",
    icon: "/elements/energy.svg",
    category: "fire",
    fact: "Energie zorgt dat dingen bewegen.",
  },
  {
    id: "rain",
    name: "Regen",
    icon: "/elements/rain.svg",
    category: "water",
    fact: "Regen valt uit een wolk.",
  },
  {
    id: "dust",
    name: "Stof",
    icon: "/elements/dust.svg",
    category: "earth",
    fact: "Stof dwarrelt door de lucht.",
  },
  {
    id: "plant",
    name: "Plant",
    icon: "/elements/plant.svg",
    category: "earth",
    fact: "Planten groeien uit zaadjes.",
  },
  {
    id: "stone",
    name: "Steen",
    icon: "/elements/stone.svg",
    category: "earth",
    fact: "Steen is hard en zwaar.",
  },
  {
    id: "cloud",
    name: "Wolk",
    icon: "/elements/cloud.svg",
    category: "water",
    fact: "Een wolk bestaat uit heel kleine waterdruppeltjes.",
  },
  {
    id: "life",
    name: "Leven",
    icon: "/elements/life.svg",
    category: "life",
    fact: "Leven groeit, beweegt en leert.",
  },
  {
    id: "metal",
    name: "Metaal",
    icon: "/elements/metal.svg",
    category: "tech",
    fact: "Metaal kun je buigen en smelten.",
  },
  {
    id: "tree",
    name: "Boom",
    icon: "/elements/tree.svg",
    category: "earth",
    fact: "Een boom is een heel grote plant.",
  },
  {
    id: "wood",
    name: "Hout",
    icon: "/elements/wood.svg",
    category: "earth",
    fact: "Hout komt van een boom.",
  },
  {
    id: "house",
    name: "Huis",
    icon: "/elements/house.svg",
    category: "tech",
    fact: "Een huis geeft je een plek om te wonen.",
  },
  {
    id: "fish",
    name: "Vis",
    icon: "/elements/fish.svg",
    category: "water",
    fact: "Vissen leven in water.",
  },
  {
    id: "bird",
    name: "Vogel",
    icon: "/elements/bird.svg",
    category: "life",
    fact: "Vogels hebben vleugels en veren.",
  },
  {
    id: "human",
    name: "Mens",
    icon: "/elements/human.svg",
    category: "life",
    fact: "Mensen kunnen denken en praten.",
  },
  {
    id: "dragon",
    name: "Draak",
    icon: "/elements/dragon.svg",
    category: "fantasy",
    fact: "Een draak is een verzonnen dier.",
  },
];

export const BASE_ELEMENT_IDS: readonly ElementId[] = ["water", "fire", "earth", "air"];

const ELEMENT_BY_ID = new Map(ELEMENTS.map((element) => [element.id, element]));

export function getElement(id: ElementId): AlchemyElement | undefined {
  return ELEMENT_BY_ID.get(id);
}

export function isElementId(value: string): boolean {
  return ELEMENT_BY_ID.has(value);
}
