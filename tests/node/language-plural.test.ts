import { describe, expect, it } from "vitest";
import { plural } from "@shared/i18n";

describe("plural", () => {
  it("kiest de enkelvoud- of meervoudsvorm met de regels van de taal", () => {
    expect(plural(1, { one: "een", other: "veel" }, "nl")).toBe("een");
    expect(plural(2, { one: "een", other: "veel" }, "nl")).toBe("veel");
    expect(plural(0, { one: "een", other: "veel" }, "nl")).toBe("veel");
    expect(plural(1, { one: "one", other: "many" }, "en")).toBe("one");
    expect(plural(2, { one: "one", other: "many" }, "en")).toBe("many");
  });
});
