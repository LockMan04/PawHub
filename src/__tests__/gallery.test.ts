import { describe, it, expect } from "vitest";
import { buildGallerySequence } from "../lib/gallery";
import { Cat } from "../types/cat";

function createMockCats(count: number): Cat[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `mock-cat-${i + 1}`,
    url: `https://cataas.com/cat/mock-cat-${i + 1}`,
    tags: ["cute"],
  }));
}

describe("Gallery Layout Engine", () => {
  it("should handle 0 cats gracefully without crashing", () => {
    const items = buildGallerySequence([]);
    expect(items.length).toBe(2);
    expect(items[0].type).toBe("text");
    expect((items[0] as { text: string }).text).toBe("HELLO");
    expect(items[1].type).toBe("text");
    expect((items[1] as { text: string }).text).toBe("BYEBYE");
  });

  it("should handle 1 cat correctly", () => {
    const items = buildGallerySequence(createMockCats(1));
    const imageItems = items.filter((i) => i.type === "image");
    expect(imageItems.length).toBe(1);
    expect(items[0].type).toBe("text");
    expect(items[items.length - 1].type).toBe("text");
  });

  it("should handle 9 and 10 cats with proper structure", () => {
    const items9 = buildGallerySequence(createMockCats(9));
    const items10 = buildGallerySequence(createMockCats(10));

    expect(items9.filter((i) => i.type === "image").length).toBe(9);
    expect(items10.filter((i) => i.type === "image").length).toBe(10);
  });

  it("should generate valid metadata for all 60 cats", () => {
    const mockCats = createMockCats(60);
    const items = buildGallerySequence(mockCats);

    const imageItems = items.filter((i): i is Extract<typeof i, { type: "image" }> => i.type === "image");
    expect(imageItems.length).toBe(60);

    for (const img of imageItems) {
      expect(img.meta.speed).toBeGreaterThanOrEqual(0.65);
      expect(img.meta.speed).toBeLessThanOrEqual(1.35);
      expect(img.meta.rotation).toBeGreaterThanOrEqual(-3.5);
      expect(img.meta.rotation).toBeLessThanOrEqual(3.5);
      expect(typeof img.meta.aspectRatio).toBe("string");
      expect(img.meta.aspectRatioValue).toBeGreaterThan(0);
      expect(Number.isNaN(img.meta.xOffset)).toBe(false);
      expect(Number.isNaN(img.meta.yOffset)).toBe(false);
    }

    const textItems = items.filter((i) => i.type === "text");
    expect(textItems.length).toBeGreaterThan(2);
    expect(textItems[0].id).toBe("hero-start");
    expect(textItems[textItems.length - 1].id).toBe("hero-end");
  });
});
