import { cn } from "../cn";

describe("cn", () => {
  it("returns a single class unchanged", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("joins multiple classes with a space", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("omits falsy values", () => {
    expect(cn("foo", false, null, undefined, "bar")).toBe("foo bar");
  });

  it("handles conditional object syntax", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("handles array syntax", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("resolves conflicting Tailwind classes (last wins via tailwind-merge)", () => {
    // tailwind-merge should resolve p-2 vs p-4 to the last one
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("resolves conflicting text color classes", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("handles mixed arrays, objects, and strings", () => {
    expect(cn("foo", { bar: true }, ["baz"])).toBe("foo bar baz");
  });
});
