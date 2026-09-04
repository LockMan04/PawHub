// @vitest-environment jsdom
import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { isImagePreloaded, preloadImage, clearPreloadCache } from "../core/images/preloader";
import { readGalleryCache } from "../core/gallery/storage";
import { useAnimalGallery } from "../hooks/useAnimalGallery";
import { catSiteConfig } from "../sites/cat";

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
  srcset = "";
  sizes = "";
  currentSrc = "";
  decoding = "async";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  decode(): Promise<void> {
    return Promise.resolve();
  }

  set src(val: string) {
    this._src = val;
    this.currentSrc = val;
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

  it("should return null from readGalleryCache when storage has corrupt JSON", () => {
    sessionStorage.setItem("test-store-key", "{ broken corrupt json content");

    const result = readGalleryCache("test-store-key");
    expect(result).toBeNull();
  });

  it("should recover useAnimalGallery gracefully when sessionStorage has corrupt JSON", async () => {
    sessionStorage.setItem(catSiteConfig.storageKey, "{ corrupt: true !!!");

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

    const { result } = renderHook(() => useAnimalGallery(catSiteConfig, 2));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items.length).toBeGreaterThan(0);
    expect(result.current.count).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it("should bound image preload cache within MAX_CACHE_SIZE limit", async () => {
    for (let i = 0; i < 95; i++) {
      await preloadImage(`https://example.com/cat-${i}.jpg`);
    }

    expect(isImagePreloaded("https://example.com/cat-94.jpg")).toBe(true);
    expect(isImagePreloaded("https://example.com/cat-0.jpg")).toBe(false);
  });

  it("should preload image with responsive srcSet and sizes", async () => {
    const testUrl = "https://example.com/cat-responsive.jpg";
    await preloadImage(testUrl, {
      srcSet: "https://example.com/cat-360.jpg 360w, https://example.com/cat-640.jpg 640w",
      sizes: "(max-width: 640px) 100vw, 50vw",
      priority: "high",
    });

    expect(isImagePreloaded(testUrl)).toBe(true);
  });
});
