import { AnimalImage, GalleryItem } from "../../types/gallery";

export interface StoredGalleryData {
  images: AnimalImage[];
  items: GalleryItem[];
}

export function migrateLegacyCache(raw: unknown): StoredGalleryData | null {
  if (!raw || typeof raw !== "object") return null;

  const candidate = raw as {
    images?: unknown;
    cats?: unknown;
    items?: unknown;
  };

  const rawImages = candidate.images ?? candidate.cats;
  if (!Array.isArray(rawImages) || !Array.isArray(candidate.items)) {
    return null;
  }

  const images: AnimalImage[] = rawImages.map((img: any) => ({
    id: String(img.id ?? img._id ?? ""),
    url: String(img.url ?? ""),
    tags: Array.isArray(img.tags) ? img.tags.map(String) : [],
    mimetype: img.mimetype ? String(img.mimetype) : undefined,
    createdAt: img.createdAt || img.created_at ? String(img.createdAt || img.created_at) : undefined,
  }));

  const items: GalleryItem[] = candidate.items.map((item: any) => {
    if (item.type === "image") {
      const canonicalImage: AnimalImage = item.image ?? item.cat ?? {
        id: item.id ?? "",
        url: "",
        tags: [],
      };

      return {
        type: "image",
        id: String(item.id ?? ""),
        image: canonicalImage,
        meta: item.meta,
      };
    }
    return item as GalleryItem;
  });

  return { images, items };
}

export function readGalleryCache(key: string): StoredGalleryData | null {
  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    return migrateLegacyCache(parsed);
  } catch {
    return null;
  }
}

export function writeGalleryCache(key: string, data: StoredGalleryData): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or disabled
  }
}

export function clearGalleryCache(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Storage access blocked or disabled
  }
}
