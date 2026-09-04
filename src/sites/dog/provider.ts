import { AnimalImage } from "../../types/gallery";
import { combineSignals, formatFetchError } from "../../core/http/client";

export const DOG_API_BASE_URL = "https://dog.ceo/api";

export const VERIFIED_FALLBACK_DOGS: readonly AnimalImage[] = [
  {
    id: "hound-english-1132",
    url: "https://images.dog.ceo/breeds/hound-english/n02089973_1132.jpg",
    tags: ["hound", "english"],
    mimetype: "image/jpeg",
  },
  {
    id: "mastiff-bull-2867",
    url: "https://images.dog.ceo/breeds/mastiff-bull/n02108422_2867.jpg",
    tags: ["mastiff", "bull"],
    mimetype: "image/jpeg",
  },
  {
    id: "basenji-2774",
    url: "https://images.dog.ceo/breeds/basenji/n02110806_2774.jpg",
    tags: ["basenji"],
    mimetype: "image/jpeg",
  },
  {
    id: "eskimo-9973",
    url: "https://images.dog.ceo/breeds/eskimo/n02109961_9973.jpg",
    tags: ["eskimo"],
    mimetype: "image/jpeg",
  },
  {
    id: "terrier-sealyham-3734",
    url: "https://images.dog.ceo/breeds/terrier-sealyham/n02095889_3734.jpg",
    tags: ["terrier", "sealyham"],
    mimetype: "image/jpeg",
  },
  {
    id: "retriever-golden-1171",
    url: "https://images.dog.ceo/breeds/retriever-golden/n02099601_1171.jpg",
    tags: ["retriever", "golden"],
    mimetype: "image/jpeg",
  },
  {
    id: "corgi-cardigan-1142",
    url: "https://images.dog.ceo/breeds/corgi-cardigan/n02113186_1142.jpg",
    tags: ["corgi", "cardigan"],
    mimetype: "image/jpeg",
  },
  {
    id: "pomeranian-7823",
    url: "https://images.dog.ceo/breeds/pomeranian/n02112020_7823.jpg",
    tags: ["pomeranian"],
    mimetype: "image/jpeg",
  },
  {
    id: "samoyed-1234",
    url: "https://images.dog.ceo/breeds/samoyed/n02111889_1234.jpg",
    tags: ["samoyed"],
    mimetype: "image/jpeg",
  },
  {
    id: "shiba-5678",
    url: "https://images.dog.ceo/breeds/shiba/n02110958_5678.jpg",
    tags: ["shiba"],
    mimetype: "image/jpeg",
  },
];

export function extractBreedTags(url: string): string[] {
  try {
    const match = url.match(/\/breeds\/([^/]+)\//);
    if (!match || !match[1]) return ["dog"];
    const breedPart = match[1].toLowerCase();
    const parts = breedPart.split("-").filter(Boolean);
    return parts.length > 0 ? parts : ["dog"];
  } catch {
    return ["dog"];
  }
}

export function extractDogId(url: string): string {
  try {
    const match = url.match(/\/breeds\/(.+)$/);
    if (match && match[1]) {
      return match[1].replace(/[/.]/g, "-");
    }
  } catch {
    // Ignore URL parse error
  }
  return url;
}

export function getDogImageUrl(imageOrIdOrUrl: AnimalImage | string): string {
  if (typeof imageOrIdOrUrl !== "string") {
    return imageOrIdOrUrl.url;
  }
  if (imageOrIdOrUrl.startsWith("http://") || imageOrIdOrUrl.startsWith("https://")) {
    return imageOrIdOrUrl;
  }
  const fallback = VERIFIED_FALLBACK_DOGS.find((d) => d.id === imageOrIdOrUrl);
  if (fallback) return fallback.url;
  return imageOrIdOrUrl;
}

interface DogApiResponse {
  message: string[] | string;
  status: string;
}

export async function fetchRandomDogs(
  targetCount = 60,
  signal?: AbortSignal
): Promise<AnimalImage[]> {
  const dogsMap = new Map<string, AnimalImage>();
  const combinedSignal = combineSignals(8000, signal);
  let lastError: Error | null = null;

  const maxPerBatch = 50;
  const neededBatches = Math.ceil(targetCount / maxPerBatch);

  const fetchBatch = async (count: number) => {
    try {
      const response = await fetch(
        `${DOG_API_BASE_URL}/breeds/image/random/${count}`,
        { signal: combinedSignal }
      );
      if (!response.ok) {
        throw new Error(`Dog CEO API returned HTTP ${response.status}`);
      }
      const data: DogApiResponse = await response.json();
      if (data.status !== "success") {
        throw new Error("Dog CEO API returned unsuccessful status");
      }
      const urls = Array.isArray(data.message) ? data.message : [data.message];
      for (const url of urls) {
        if (!url || typeof url !== "string") continue;
        const id = extractDogId(url);
        if (!dogsMap.has(id)) {
          dogsMap.set(id, {
            id,
            url,
            tags: extractBreedTags(url),
            mimetype: "image/jpeg",
          });
        }
        if (dogsMap.size >= targetCount) break;
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

  const batchPromises: Promise<void>[] = [];
  for (let i = 0; i < neededBatches; i++) {
    const batchSize = Math.min(maxPerBatch, targetCount - i * maxPerBatch + 10);
    batchPromises.push(fetchBatch(batchSize));
  }

  await Promise.all(batchPromises);

  if (signal?.aborted) {
    throw new Error("Request aborted");
  }

  if (dogsMap.size === 0) {
    if (lastError) {
      throw new Error(`Failed to load dogs: ${formatFetchError(lastError, "Dog CEO API")}`);
    }
    throw new Error("Unable to load dogs from Dog CEO API. Check your internet connection.");
  }

  return Array.from(dogsMap.values()).slice(0, targetCount);
}

export async function fetchUniqueNewDogs(
  existingIds: Set<string>,
  targetNewCount: number,
  signal?: AbortSignal,
  maxRetries = 4
): Promise<AnimalImage[]> {
  const newDogsMap = new Map<string, AnimalImage>();
  let attempts = 0;
  let lastError: Error | null = null;

  while (newDogsMap.size < targetNewCount && attempts < maxRetries) {
    if (signal?.aborted) {
      throw new Error("Request aborted");
    }
    attempts++;
    const needed = targetNewCount - newDogsMap.size;
    const fetchLimit = Math.min(Math.max(needed + 10, 20), 50);
    const combinedSignal = combineSignals(8000, signal);

    try {
      const response = await fetch(
        `${DOG_API_BASE_URL}/breeds/image/random/${fetchLimit}`,
        { signal: combinedSignal }
      );

      if (!response.ok) {
        throw new Error(`Dog CEO API returned HTTP ${response.status}`);
      }

      const data: DogApiResponse = await response.json();
      if (data.status !== "success") {
        throw new Error("Dog CEO API returned unsuccessful status");
      }

      const urls = Array.isArray(data.message) ? data.message : [data.message];
      for (const url of urls) {
        if (!url || typeof url !== "string") continue;
        const id = extractDogId(url);
        if (!existingIds.has(id) && !newDogsMap.has(id)) {
          newDogsMap.set(id, {
            id,
            url,
            tags: extractBreedTags(url),
            mimetype: "image/jpeg",
          });
        }
        if (newDogsMap.size >= targetNewCount) break;
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

  if (newDogsMap.size < targetNewCount) {
    const errorDetails = lastError ? ` (${formatFetchError(lastError, "Dog CEO API")})` : "";
    throw new Error(
      `Could not fetch exactly ${targetNewCount} new unique dogs. Only gathered ${newDogsMap.size} after ${attempts} attempts${errorDetails}.`
    );
  }

  return Array.from(newDogsMap.values()).slice(0, targetNewCount);
}
