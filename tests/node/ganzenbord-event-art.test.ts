import { describe, expect, it } from "vitest";
import type { TurnEvent } from "@entities/ganzenbord";
import { eventArt } from "../../libs/features/ganzenbord/model/event-art";

function event(kind: TurnEvent["kind"], extra: Partial<TurnEvent> = {}): TurnEvent {
  return { kind, player: "one", ...extra };
}

describe("ganzenbord: prenten bij gebeurtenissen", () => {
  it("gebruikt de prent van het vak", () => {
    const cases: ReadonlyArray<readonly [TurnEvent["kind"], string]> = [
      ["goose", "/ganzenbord/events/goose.webp"],
      ["first-throw", "/ganzenbord/events/goose.webp"],
      ["bridge", "/ganzenbord/events/bridge.webp"],
      ["inn", "/ganzenbord/events/inn.webp"],
      ["well", "/ganzenbord/events/well.webp"],
      ["prison", "/ganzenbord/events/prison.webp"],
      ["maze", "/ganzenbord/events/maze.webp"],
      ["death", "/ganzenbord/events/death.webp"],
      ["win", "/ganzenbord/events/treasure.webp"],
    ];

    for (const [kind, art] of cases) {
      expect(eventArt(event(kind))).toBe(art);
    }
  });

  it("kiest bij vrijlaten de put of de gevangenis", () => {
    expect(eventArt(event("free", { value: 31 }))).toBe("/ganzenbord/events/well.webp");
    expect(eventArt(event("free", { value: 52 }))).toBe("/ganzenbord/events/prison.webp");
  });

  it("valt terug op het icoon als er geen prent is", () => {
    expect(eventArt(event("roll"))).toBeNull();
    expect(eventArt(event("bounce"))).toBeNull();
    expect(eventArt(event("skip"))).toBeNull();
  });
});
