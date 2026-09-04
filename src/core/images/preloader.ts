const MAX_CACHE_SIZE = 80;
const loadedCache = new Set<string>();

export function isImagePreloaded(url: string): boolean {
  return loadedCache.has(url);
}

export function clearPreloadCache(): void {
  loadedCache.clear();
}

export interface PreloadImageOptions {
  srcSet?: string;
  sizes?: string;
  priority?: "high" | "low";
}

export function preloadImage(
  url: string,
  priorityOrOptions?: "high" | "low" | PreloadImageOptions
): Promise<void> {
  const options: PreloadImageOptions =
    typeof priorityOrOptions === "string"
      ? { priority: priorityOrOptions }
      : priorityOrOptions ?? {};

  const priority = options.priority ?? "low";

  if (loadedCache.has(url)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const img = new Image();
    if ("fetchPriority" in img) {
      (img as HTMLImageElement & { fetchPriority: string }).fetchPriority = priority;
    }
    img.decoding = "async";

    const addToCache = () => {
      const candidates = [url];
      if (img.currentSrc && img.currentSrc !== url) {
        candidates.push(img.currentSrc);
      }
      for (const src of candidates) {
        if (loadedCache.size >= MAX_CACHE_SIZE) {
          const oldest = loadedCache.values().next().value;
          if (oldest) loadedCache.delete(oldest);
        }
        loadedCache.add(src);
      }
    };

    img.onload = () => {
      if ("decode" in img) {
        img.decode()
          .then(() => {
            addToCache();
            resolve();
          })
          .catch(() => {
            addToCache();
            resolve();
          });
      } else {
        addToCache();
        resolve();
      }
    };

    img.onerror = () => {
      resolve();
    };

    if (options.srcSet) {
      img.srcset = options.srcSet;
    }
    if (options.sizes) {
      img.sizes = options.sizes;
    }
    img.src = url;
  });
}
