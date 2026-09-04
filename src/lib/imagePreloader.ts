const MAX_CACHE_SIZE = 80;
const loadedCache = new Set<string>();

export function isImagePreloaded(url: string): boolean {
  return loadedCache.has(url);
}

export function clearPreloadCache(): void {
  loadedCache.clear();
}

export function preloadImage(url: string, priority: "high" | "low" = "low"): Promise<void> {
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
      if (loadedCache.size >= MAX_CACHE_SIZE) {
        const oldest = loadedCache.values().next().value;
        if (oldest) loadedCache.delete(oldest);
      }
      loadedCache.add(url);
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

    img.src = url;
  });
}
