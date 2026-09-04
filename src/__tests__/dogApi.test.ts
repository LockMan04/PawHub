import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractBreedTags,
  extractDogId,
  getDogImageUrl,
  VERIFIED_FALLBACK_DOGS,
  fetchRandomDogs,
  fetchUniqueNewDogs,
} from "../sites/dog";

describe("Dog CEO API Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should extract tags from single-word and hyphenated breeds", () => {
    expect(
      extractBreedTags("https://images.dog.ceo/breeds/hound-english/n02089973_1132.jpg")
    ).toEqual(["hound", "english"]);

    expect(
      extractBreedTags("https://images.dog.ceo/breeds/mexicanhairless/n02113978_759.jpg")
    ).toEqual(["mexicanhairless"]);

    expect(
      extractBreedTags("https://images.dog.ceo/breeds/retriever-golden/image.jpg")
    ).toEqual(["retriever", "golden"]);

    expect(extractBreedTags("https://example.com/other/path.jpg")).toEqual(["dog"]);
  });

  it("should extract clean dog ID from URL", () => {
    const id = extractDogId("https://images.dog.ceo/breeds/hound-english/n02089973_1132.jpg");
    expect(id).toBe("hound-english-n02089973_1132-jpg");
  });

  it("should return valid dog image URLs and fallback correctly", () => {
    const directUrl = "https://images.dog.ceo/breeds/shiba/test.jpg";
    expect(getDogImageUrl(directUrl)).toBe(directUrl);

    const fallback = VERIFIED_FALLBACK_DOGS[0];
    expect(getDogImageUrl(fallback.id)).toBe(fallback.url);
  });

  it("should have at least 5 verified fallback dogs", () => {
    expect(VERIFIED_FALLBACK_DOGS.length).toBeGreaterThanOrEqual(5);
    for (const dog of VERIFIED_FALLBACK_DOGS) {
      expect(dog.id).toBeTruthy();
      expect(dog.url).toContain("https://images.dog.ceo/breeds/");
      expect(dog.tags.length).toBeGreaterThan(0);
    }
  });

  it("should fetch random dogs with batching and deduplicate", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: "success",
              message: [
                "https://images.dog.ceo/breeds/hound-english/n1.jpg",
                "https://images.dog.ceo/breeds/terrier/n2.jpg",
                "https://images.dog.ceo/breeds/retriever/n3.jpg",
              ],
            }),
        });
      })
    );

    const dogs = await fetchRandomDogs(3);
    expect(dogs.length).toBe(3);
    expect(dogs[0].tags).toEqual(["hound", "english"]);
  });

  it("should fetch unique new dogs excluding existing IDs", async () => {
    const existingIds = new Set(["hound-english-n1-jpg"]);

    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: "success",
                message: [
                  "https://images.dog.ceo/breeds/hound-english/n1.jpg",
                  "https://images.dog.ceo/breeds/mastiff/n2.jpg",
                ],
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: "success",
              message: ["https://images.dog.ceo/breeds/corgi/n3.jpg"],
            }),
        });
      })
    );

    const newDogs = await fetchUniqueNewDogs(existingIds, 2);
    expect(newDogs.length).toBe(2);
    const ids = newDogs.map((d) => d.id);
    expect(ids).toEqual(["mastiff-n2-jpg", "corgi-n3-jpg"]);
    expect(ids.some((id) => existingIds.has(id))).toBe(false);
  });

  it("should throw error when maxRetries exhausted", async () => {
    const existingIds = new Set(["hound-english-n1-jpg"]);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "success",
            message: ["https://images.dog.ceo/breeds/hound-english/n1.jpg"],
          }),
      })
    );

    await expect(fetchUniqueNewDogs(existingIds, 3, undefined, 2)).rejects.toThrow(
      /Could not fetch exactly 3 new unique dogs/
    );
  });

  it("should handle timeout errors properly", async () => {
    const timeoutErr = new Error("aborted timeout");
    timeoutErr.name = "TimeoutError";

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutErr));

    await expect(fetchRandomDogs(5)).rejects.toThrow(/timed out/);
  });

  it("should handle network connection errors properly", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(fetchRandomDogs(5)).rejects.toThrow(/Network connection error/);
  });
});
