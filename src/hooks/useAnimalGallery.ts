import { useState, useEffect, useCallback, useRef } from "react";
import { AnimalImage, GalleryItem } from "../types/gallery";
import { SiteConfig } from "../types/site-config";
import { buildGallerySequence } from "../core/gallery/sequence";
import {
  readGalleryCache,
  writeGalleryCache,
  clearGalleryCache,
  StoredGalleryData,
} from "../core/gallery/storage";

export type { StoredGalleryData };
export const safeGetCachedGalleryData = readGalleryCache;

export interface UseAnimalGalleryReturn {
  items: GalleryItem[];
  count: number;
  catCount: number;
  isLoading: boolean;
  isFetchingMore: boolean;
  error: string | null;
  refresh: () => void;
  loadMore: (extra?: number) => Promise<void>;
  retry: () => void;
  clearError: () => void;
  setTargetLimit: (newLimit: number) => void;
  currentLimit: number;
}

export function useAnimalGallery(
  config: SiteConfig,
  initialTarget = 60
): UseAnimalGalleryReturn {
  const [currentLimit, setCurrentLimit] = useState<number>(initialTarget);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [images, setImages] = useState<AnimalImage[]>([]);
  const imagesRef = useRef<AnimalImage[]>([]);
  imagesRef.current = images;

  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeRequestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadMoreRequestIdRef = useRef(0);
  const loadMoreAbortRef = useRef<AbortController | null>(null);

  const lastFailedActionRef = useRef<(() => void | Promise<void>) | null>(null);
  const forceFreshRef = useRef(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const buildSequence = useCallback(
    (imgs: AnimalImage[]) => {
      return buildGallerySequence(imgs, {
        heroStart: config.heroStart,
        heroEnd: config.heroEnd,
        messages: config.messages,
        animal: config.animal,
      });
    },
    [config.animal, config.heroEnd, config.heroStart, config.messages]
  );

  const loadData = useCallback(
    async (target: number, forceFresh = false) => {
      setIsLoading(true);
      setError(null);

      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const currentRequestId = ++activeRequestIdRef.current;

      if (!forceFresh) {
        const cached = readGalleryCache(config.storageKey);
        if (cached && cached.images.length >= Math.min(target, 30)) {
          setImages(cached.images);
          imagesRef.current = cached.images;
          setItems(cached.items);
          setCount(cached.images.length);
          setIsLoading(false);
          return;
        }
      }

      try {
        const fetchedImages = await config.fetchImages(target, abortController.signal);
        if (currentRequestId !== activeRequestIdRef.current || abortController.signal.aborted) {
          return;
        }

        const sequence = buildSequence(fetchedImages);

        setImages(fetchedImages);
        imagesRef.current = fetchedImages;
        setItems(sequence);
        setCount(fetchedImages.length);
        lastFailedActionRef.current = null;

        writeGalleryCache(config.storageKey, {
          images: fetchedImages,
          items: sequence,
        });
      } catch (err) {
        if (abortController.signal.aborted || currentRequestId !== activeRequestIdRef.current) {
          return;
        }
        lastFailedActionRef.current = () => loadData(target, true);
        setError(
          err instanceof Error
            ? err.message
            : `Failed to load ${config.pluralName}`
        );
      } finally {
        if (currentRequestId === activeRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [config.storageKey, config.fetchImages, config.pluralName, buildSequence]
  );

  useEffect(() => {
    const isForce = forceFreshRef.current;
    forceFreshRef.current = false;
    loadData(currentLimit, isForce);
  }, [loadData, currentLimit]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      loadMoreAbortRef.current?.abort();
    };
  }, []);

  const refresh = useCallback(() => {
    clearGalleryCache(config.storageKey);
    loadData(currentLimit, true);
  }, [config.storageKey, loadData, currentLimit]);

  const loadMore = useCallback(
    async (extra = 20) => {
      if (isFetchingMore) return;
      setIsFetchingMore(true);
      setError(null);

      loadMoreAbortRef.current?.abort();
      const abortController = new AbortController();
      loadMoreAbortRef.current = abortController;
      const currentRequestId = ++loadMoreRequestIdRef.current;

      try {
        const currentImgs = imagesRef.current;
        const existingIds = new Set(currentImgs.map((img) => img.id));
        const newImages = await config.fetchUniqueNewImages(
          existingIds,
          extra,
          abortController.signal
        );

        if (currentRequestId !== loadMoreRequestIdRef.current || abortController.signal.aborted) {
          return;
        }

        const mergedImages = [...currentImgs, ...newImages];
        const sequence = buildSequence(mergedImages);

        setImages(mergedImages);
        imagesRef.current = mergedImages;
        setItems(sequence);
        setCount(mergedImages.length);
        setCurrentLimit(mergedImages.length);
        lastFailedActionRef.current = null;

        writeGalleryCache(config.storageKey, {
          images: mergedImages,
          items: sequence,
        });
      } catch (err) {
        if (abortController.signal.aborted || currentRequestId !== loadMoreRequestIdRef.current) {
          return;
        }
        lastFailedActionRef.current = () => loadMore(extra);
        setError(
          err instanceof Error
            ? err.message
            : `Failed to load more ${config.pluralName}`
        );
      } finally {
        if (currentRequestId === loadMoreRequestIdRef.current) {
          setIsFetchingMore(false);
        }
      }
    },
    [isFetchingMore, config, buildSequence]
  );

  const retry = useCallback(() => {
    clearError();
    if (lastFailedActionRef.current) {
      const action = lastFailedActionRef.current;
      lastFailedActionRef.current = null;
      action();
    } else {
      refresh();
    }
  }, [clearError, refresh]);

  const setTargetLimit = useCallback(
    (newLimit: number) => {
      setCurrentLimit((prev) => {
        if (prev === newLimit) {
          loadData(newLimit, true);
          return prev;
        }
        forceFreshRef.current = true;
        return newLimit;
      });
    },
    [loadData]
  );

  return {
    items,
    count,
    catCount: count,
    isLoading,
    isFetchingMore,
    error,
    refresh,
    loadMore,
    retry,
    clearError,
    setTargetLimit,
    currentLimit,
  };
}
