import { useState, useEffect, useCallback, useRef } from "react";
import { Cat, GalleryItem } from "../types/cat";
import { fetchRandomCats, fetchUniqueNewCats } from "../lib/cataas";
import { buildGallerySequence } from "../lib/gallery";

export const SESSION_STORAGE_KEY = "cat-scroll-v6-store";

export interface StoredData {
  cats: Cat[];
  items: GalleryItem[];
}

export function safeGetCachedData(key = SESSION_STORAGE_KEY): StoredData | null {
  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (
      Array.isArray(parsed.cats) &&
      Array.isArray(parsed.items) &&
      parsed.items.length > 0
    ) {
      return parsed as StoredData;
    }
  } catch {
    // Gracefully handle corrupt storage or disabled access
  }
  return null;
}

interface UseCatsReturn {
  items: GalleryItem[];
  catCount: number;
  isLoading: boolean;
  isFetchingMore: boolean;
  error: string | null;
  refreshCats: () => void;
  loadMore: (extra?: number) => Promise<void>;
  clearError: () => void;
  setTargetLimit: (newLimit: number) => void;
  currentLimit: number;
}

export function useCats(initialTarget = 60): UseCatsReturn {
  const [currentLimit, setCurrentLimit] = useState<number>(initialTarget);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const catsRef = useRef<Cat[]>([]);
  catsRef.current = cats;

  const [catCount, setCatCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadData = useCallback(
    async (target: number, forceFresh = false) => {
      setIsLoading(true);
      setError(null);

      try {
        sessionStorage.removeItem("cat-scroll-v1-store");
        sessionStorage.removeItem("cat-scroll-v2-store");
        sessionStorage.removeItem("cat-scroll-v3-store");
        sessionStorage.removeItem("cat-scroll-v4-store");
        sessionStorage.removeItem("cat-scroll-v5-store");
      } catch {
        // Ignore
      }

      if (!forceFresh) {
        const cached = safeGetCachedData(SESSION_STORAGE_KEY);
        if (cached && cached.cats.length >= Math.min(target, 30)) {
          setCats(cached.cats);
          catsRef.current = cached.cats;
          setItems(cached.items);
          setCatCount(cached.cats.length);
          setIsLoading(false);
          return;
        }
      }

      try {
        const fetchedCats = await fetchRandomCats(target);
        const sequence = buildGallerySequence(fetchedCats);

        setCats(fetchedCats);
        catsRef.current = fetchedCats;
        setItems(sequence);
        setCatCount(fetchedCats.length);

        try {
          const payload: StoredData = {
            cats: fetchedCats,
            items: sequence,
          };
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
        } catch {
          // Storage quota exceeded or disabled
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load cats");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData(currentLimit, false);
  }, [loadData, currentLimit]);

  const refreshCats = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore
    }
    loadData(currentLimit, true);
  }, [loadData, currentLimit]);

  const loadMore = useCallback(
    async (extra = 20) => {
      if (isFetchingMore) return;
      setIsFetchingMore(true);
      setError(null);

      try {
        const currentCats = catsRef.current;
        const existingIds = new Set(currentCats.map((c) => c.id));
        const newCats = await fetchUniqueNewCats(existingIds, extra);

        const mergedCats = [...currentCats, ...newCats];
        const sequence = buildGallerySequence(mergedCats);

        setCats(mergedCats);
        catsRef.current = mergedCats;
        setItems(sequence);
        setCatCount(mergedCats.length);
        setCurrentLimit(mergedCats.length);

        try {
          sessionStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify({ cats: mergedCats, items: sequence })
          );
        } catch {
          // Storage write failure ignored
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load more cats");
      } finally {
        setIsFetchingMore(false);
      }
    },
    [isFetchingMore]
  );

  const setTargetLimit = useCallback(
    (newLimit: number) => {
      setCurrentLimit(newLimit);
      loadData(newLimit, true);
    },
    [loadData]
  );

  return {
    items,
    catCount,
    isLoading,
    isFetchingMore,
    error,
    refreshCats,
    loadMore,
    clearError,
    setTargetLimit,
    currentLimit,
  };
}
