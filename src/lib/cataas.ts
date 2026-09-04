import { Cat } from "../types/cat";

export const CATAAS_BASE_URL = "https://cataas.com";

export const VERIFIED_FALLBACK_IDS: readonly string[] = [
  "04eEQhDfAL8l5nt3",
  "05Xd4JtN14983pns",
  "09wFxpacQzvf9jfM",
  "0B2g7aTANObiqPJJ",
  "0BTTVEVWXNyOgXYd",
  "0C2bQ39x8kuhx31p",
  "0DVs2d6bIVIt3ehk",
  "0EsIYDG0at0TPpPD",
  "0F0IKAPOdWiE755P",
  "0GC9MRUAqxhBzPyA",
  "0M0Lo3dsYft79xNd",
  "0mstmOIucwiN80jb",
  "0mxliw1UgtFdDkU8",
  "0nnJxjVoMK6GVmRS",
  "0oJmiPshaDZD54M8",
];

interface RawCataasCat {
  id?: string;
  _id?: string;
  tags?: string[];
  mimetype?: string;
  createdAt?: string;
  created_at?: string;
}

export function getCatImageUrl(id: string, width?: number): string {
  if (width) {
    return `${CATAAS_BASE_URL}/cat/${id}?width=${width}`;
  }
  return `${CATAAS_BASE_URL}/cat/${id}`;
}

export function createCatSrcSet(id: string): string {
  return `${getCatImageUrl(id, 360)} 360w, ${getCatImageUrl(id, 640)} 640w, ${getCatImageUrl(id, 960)} 960w`;
}

function combineSignals(timeoutMs = 8000, externalSignal?: AbortSignal): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!externalSignal) return timeoutSignal;
  return AbortSignal.any([timeoutSignal, externalSignal]);
}

function formatFetchError(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "TimeoutError") {
      return "Request to CATAAS API timed out (8s).";
    }
    if (err instanceof TypeError && err.message.toLowerCase().includes("fetch")) {
      return "Network connection error. Check your internet connection.";
    }
    return err.message;
  }
  return "Unknown network error";
}

export async function fetchRandomCats(
  targetCount = 60,
  signal?: AbortSignal
): Promise<Cat[]> {
  const catsMap = new Map<string, Cat>();
  const combinedSignal = combineSignals(8000, signal);
  const requestsCount = Math.max(1, Math.ceil(targetCount / 40));
  let lastError: Error | null = null;

  const fetchBatch = async (skip: number, limit: number) => {
    try {
      const response = await fetch(
        `${CATAAS_BASE_URL}/api/cats?limit=${limit}&skip=${skip}`,
        { signal: combinedSignal }
      );
      if (!response.ok) {
        throw new Error(`CATAAS API returned HTTP ${response.status}`);
      }
      const data: RawCataasCat[] = await response.json();
      for (const item of data) {
        const id = item.id || item._id;
        if (id && !catsMap.has(id)) {
          catsMap.set(id, {
            id,
            url: getCatImageUrl(id),
            tags: Array.isArray(item.tags) ? item.tags : [],
            mimetype: item.mimetype || "image/jpeg",
            createdAt: item.createdAt || item.created_at,
          });
        }
        if (catsMap.size >= targetCount) break;
      }
    } catch (err) {
      if (signal?.aborted) {
        throw err;
      }
      if (err instanceof Error) {
        lastError = err;
      }
    }
  };

  const skipOffsets = Array.from({ length: requestsCount }).map((_, idx) =>
    Math.floor(Math.random() * 250) + idx * 80
  );

  await Promise.all(
    skipOffsets.map((skip) => fetchBatch(skip, Math.min(targetCount + 15, 80)))
  );

  if (signal?.aborted) {
    throw new Error("Request aborted");
  }

  if (catsMap.size === 0) {
    if (lastError) {
      throw new Error(`Failed to load cats: ${formatFetchError(lastError)}`);
    }
    throw new Error("Unable to load cats from CATAAS API. Check your internet connection.");
  }

  return Array.from(catsMap.values()).slice(0, targetCount);
}

export async function fetchUniqueNewCats(
  existingIds: Set<string>,
  targetNewCount: number,
  signal?: AbortSignal,
  maxRetries = 4
): Promise<Cat[]> {
  const newCatsMap = new Map<string, Cat>();
  let attempts = 0;
  let lastError: Error | null = null;

  while (newCatsMap.size < targetNewCount && attempts < maxRetries) {
    if (signal?.aborted) {
      throw new Error("Request aborted");
    }
    attempts++;
    const needed = targetNewCount - newCatsMap.size;
    const fetchLimit = Math.min(needed + 20, 60);
    const randomSkip = Math.floor(Math.random() * 400);
    const combinedSignal = combineSignals(8000, signal);

    try {
      const response = await fetch(
        `${CATAAS_BASE_URL}/api/cats?limit=${fetchLimit}&skip=${randomSkip}`,
        { signal: combinedSignal }
      );

      if (!response.ok) {
        throw new Error(`CATAAS API returned HTTP ${response.status}`);
      }

      const data: RawCataasCat[] = await response.json();
      for (const item of data) {
        const id = item.id || item._id;
        if (id && !existingIds.has(id) && !newCatsMap.has(id)) {
          newCatsMap.set(id, {
            id,
            url: getCatImageUrl(id),
            tags: Array.isArray(item.tags) ? item.tags : [],
            mimetype: item.mimetype || "image/jpeg",
            createdAt: item.createdAt || item.created_at,
          });
        }
        if (newCatsMap.size >= targetNewCount) break;
      }
    } catch (err) {
      if (signal?.aborted) {
        throw err;
      }
      if (err instanceof Error) {
        lastError = err;
      }
    }
  }

  if (newCatsMap.size < targetNewCount) {
    const errorDetails = lastError ? ` (${formatFetchError(lastError)})` : "";
    throw new Error(
      `Could not fetch exactly ${targetNewCount} new unique cats. Only gathered ${newCatsMap.size} after ${attempts} attempts${errorDetails}.`
    );
  }

  return Array.from(newCatsMap.values()).slice(0, targetNewCount);
}
