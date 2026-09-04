import { describe, it, expect } from "vitest";
import { resolveSiteType, getSiteConfig, SITES } from "../sites/registry";

describe("Site Configuration & Resolver", () => {
  it("should resolve dog site from dog subdomain", () => {
    expect(resolveSiteType("dog.lockman.dev")).toBe("dog");
    expect(resolveSiteType("dog.example.org")).toBe("dog");
  });

  it("should resolve cat site from cat subdomain", () => {
    expect(resolveSiteType("cat.lockman.dev")).toBe("cat");
    expect(resolveSiteType("cat.example.org")).toBe("cat");
  });

  it("should resolve site from query parameter when provided", () => {
    expect(resolveSiteType("localhost", "?site=dog")).toBe("dog");
    expect(resolveSiteType("localhost", "?site=cat")).toBe("cat");
  });

  it("should default to cat when subdomain or parameter is unknown", () => {
    expect(resolveSiteType("unknown.lockman.dev")).toBe("cat");
    expect(resolveSiteType("localhost")).toBe("cat");
  });

  it("should retrieve valid configuration for both cat and dog", () => {
    const catConfig = getSiteConfig("cat");
    expect(catConfig.animal).toBe("cat");
    expect(catConfig.title).toBe("PawHub | Cats");
    expect(catConfig.heroStart.text).toBe("HELLO");
    expect(catConfig.heroEnd.text).toBe("BYEBYE");
    expect(catConfig.messages.length).toBeGreaterThan(0);

    const dogConfig = getSiteConfig("dog");
    expect(dogConfig.animal).toBe("dog");
    expect(dogConfig.title).toBe("PawHub | Dogs");
    expect(dogConfig.heroStart.text).toBe("WOOF");
    expect(dogConfig.heroEnd.text).toBe("GOOD BOY");
    expect(dogConfig.messages.length).toBeGreaterThan(0);
  });

  it("should contain both registered sites in SITES registry", () => {
    expect(Object.keys(SITES)).toEqual(["cat", "dog"]);
  });
});
