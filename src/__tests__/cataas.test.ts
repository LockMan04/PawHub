import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCatImageUrl,
  VERIFIED_FALLBACK_IDS,
  fetchUniqueNewCats,
} from "../sites/cat";

describe("CATAAS Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should generate proper cat image URLs", () => {
    expect(getCatImageUrl("test-cat-1")).toBe("https://cataas.com/cat/test-cat-1");
    expect(getCatImageUrl("test-cat-1", 400)).toBe(
      "https://cataas.com/cat/test-cat-1?width=400"
    );
  });

  it("should have a non-empty list of verified fallback IDs", () => {
    expect(VERIFIED_FALLBACK_IDS.length).toBeGreaterThanOrEqual(10);
    for (const id of VERIFIED_FALLBACK_IDS) {
      expect(typeof id).toBe("string");
      expect(id.trim().length).toBeGreaterThan(0);
    }
  });

  it("should fetch exact target count of unique new cats excluding existing IDs", async () => {
    const existingIds = new Set(["cat-1", "cat-2"]);

    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First batch returns some duplicates and 2 new cats
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve([
                { id: "cat-1", tags: ["duplicate"] },
                { id: "cat-2", tags: ["duplicate"] },
                { id: "cat-3", tags: ["fresh"] },
                { id: "cat-4", tags: ["fresh"] },
              ]),
          });
        }
        // Second batch returns 2 more new cats
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: "cat-5", tags: ["fresh"] },
              { id: "cat-6", tags: ["fresh"] },
            ]),
        });
      })
    );

    const result = await fetchUniqueNewCats(existingIds, 4);

    expect(result.length).toBe(4);
    const resultIds = result.map((c) => c.id);
    expect(resultIds).toEqual(["cat-3", "cat-4", "cat-5", "cat-6"]);
    expect(resultIds.some((id) => existingIds.has(id))).toBe(false);
  });

  it("should throw error when maxRetries is exhausted and cannot reach target count", async () => {
    const existingIds = new Set(["cat-1"]);

    // Always returns only 1 duplicate and 1 new cat per call
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: "cat-1", tags: [] },
              { id: "cat-new", tags: [] },
            ]),
        })
      )
    );

    // Asking for 5 new cats with maxRetries = 2. Only 1 unique cat will be collected.
    await expect(
      fetchUniqueNewCats(existingIds, 5, undefined, 2)
    ).rejects.toThrow(/Could not fetch exactly 5 new unique cats/);
  });

  it("should handle network connection errors (TypeError) gracefully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    );

    await expect(fetchUniqueNewCats(new Set(), 5, undefined, 1)).rejects.toThrow(
      /Network connection error/
    );
  });

  it("should handle timeout errors (TimeoutError) gracefully", async () => {
    const timeoutErr = new Error("The operation was aborted due to timeout");
    timeoutErr.name = "TimeoutError";

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutErr));

    await expect(fetchUniqueNewCats(new Set(), 5, undefined, 1)).rejects.toThrow(
      /timed out/
    );
  });

  it("should generate valid URLs for all verified fallback IDs", () => {
    for (const id of VERIFIED_FALLBACK_IDS) {
      const url = getCatImageUrl(id);
      expect(url).toBe(`https://cataas.com/cat/${id}`);
      expect(id).toMatch(/^[0-9a-zA-Z_-]+$/);
    }
  });
});
