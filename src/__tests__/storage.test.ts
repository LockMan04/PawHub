// @vitest-environment jsdom
import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { isImagePreloaded, preloadImage, clearPreloadCache } from "../lib/imagePreloader";
import { safeGetCachedData, SESSION_STORAGE_KEY, useCats } from "../hooks/useCats";

class MockStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

class MockImage {
  private _src = "";
  decoding = "async";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  decode(): Promise<void> {
    return Promise.resolve();
  }

  set src(val: string) {
    this._src = val;
    setTimeout(() => {
      this.onload?.();
    }, 0);
  }

  get src(): string {
    return this._src;
  }
}

beforeAll(() => {
  globalThis.sessionStorage = new MockStorage() as unknown as Storage;
  globalThis.Image = MockImage as unknown as typeof Image;
});

describe("Storage & Cache Integrity", () => {
  beforeEach(() => {
    clearPreloadCache();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("should return null from safeGetCachedData when storage has corrupt JSON", () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, "{ broken corrupt json content");

    const result = safeGetCachedData(SESSION_STORAGE_KEY);
    expect(result).toBeNull();
  });

  it("should recover useCats gracefully when sessionStorage has corrupt JSON", async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, "{ corrupt: true !!!");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: "cat-fresh-1", tags: ["cute"] },
            { id: "cat-fresh-2", tags: ["playful"] },
          ]),
      })
    );

    const { result } = renderHook(() => useCats(2));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items.length).toBeGreaterThan(0);
    expect(result.current.catCount).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it("should bound image preload cache within MAX_CACHE_SIZE limit", async () => {
    for (let i = 0; i < 95; i++) {
      await preloadImage(`https://example.com/cat-${i}.jpg`);
    }

    expect(isImagePreloaded("https://example.com/cat-94.jpg")).toBe(true);
    expect(isImagePreloaded("https://example.com/cat-0.jpg")).toBe(false);
  });
});
