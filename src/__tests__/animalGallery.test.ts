// @vitest-environment jsdom
import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAnimalGallery } from "../hooks/useAnimalGallery";
import { dogSiteConfig } from "../sites/dog";
import { catSiteConfig } from "../sites/cat";
import { LoadingGallery } from "../components/LoadingGallery";
import React from "react";
import { render, screen } from "@testing-library/react";

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

beforeAll(() => {
  globalThis.sessionStorage = new MockStorage() as unknown as Storage;
});

describe("Animal Gallery Reviews Verification", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("should render LoadingGallery with dog content when dog config is passed", () => {
    render(React.createElement(LoadingGallery, { config: dogSiteConfig }));
    expect(screen.getByText("WOOF")).toBeDefined();
    expect(screen.getByText("gathering dogs...")).toBeDefined();
  });

  it("should render LoadingGallery with cat content when cat config is passed", () => {
    render(React.createElement(LoadingGallery, { config: catSiteConfig }));
    expect(screen.getByText("HELLO")).toBeDefined();
    expect(screen.getByText("gathering cats...")).toBeDefined();
  });

  it("should not let stale slow requests overwrite newer fast requests (race condition)", async () => {
    let callIndex = 0;
    const mockConfig = {
      ...catSiteConfig,
      storageKey: "test-race-condition-key",
      fetchImages: vi.fn().mockImplementation(() => {
        callIndex++;
        const currentCall = callIndex;
        if (currentCall === 1) {
          // Slow first call (takes 100ms)
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve([{ id: "stale-cat-1", url: "https://cataas.com/cat/stale", tags: [] }]);
            }, 100);
          });
        }
        // Fast second call (takes 10ms)
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([{ id: "fresh-cat-2", url: "https://cataas.com/cat/fresh", tags: [] }]);
          }, 10);
        });
      }),
    };

    const { result } = renderHook(() => useAnimalGallery(mockConfig, 1));

    // Quickly trigger refresh to start second request while first is pending
    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.count).toBe(1);
    });

    // Wait for the slow 100ms call to have definitely elapsed
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Result should strictly remain the fresh cat from second request, not overwritten by stale cat
    const firstImageItem = result.current.items.find((i) => i.type === "image");
    expect((firstImageItem as { image: { id: string } }).image.id).toBe("fresh-cat-2");
  });

  it("should invoke loadData only once when setTargetLimit is called", async () => {
    const fetchSpy = vi.fn().mockResolvedValue([
      { id: "cat-1", url: "https://cataas.com/cat/1", tags: [] },
      { id: "cat-2", url: "https://cataas.com/cat/2", tags: [] },
    ]);

    const mockConfig = {
      ...catSiteConfig,
      storageKey: "test-set-limit-key",
      fetchImages: fetchSpy,
    };

    const { result } = renderHook(() => useAnimalGallery(mockConfig, 1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setTargetLimit(2);
    });

    await waitFor(() => {
      expect(result.current.currentLimit).toBe(2);
    });

    // Should only be called once more for the new limit (total 2 times, not 3)
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("should retry the exact failed action when retry() is called", async () => {
    let failFirst = true;
    const fetchSpy = vi.fn().mockImplementation(() => {
      if (failFirst) {
        failFirst = false;
        return Promise.reject(new Error("Network glitch on initial load"));
      }
      return Promise.resolve([{ id: "recovered-cat", url: "https://cataas.com/cat/rec", tags: [] }]);
    });

    const mockConfig = {
      ...catSiteConfig,
      storageKey: "test-retry-action-key",
      fetchImages: fetchSpy,
    };

    const { result } = renderHook(() => useAnimalGallery(mockConfig, 1));

    await waitFor(() => {
      expect(result.current.error).toBe("Network glitch on initial load");
    });

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.count).toBe(1);
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
