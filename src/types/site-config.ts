import { AnimalImage, TypographyVariant } from "./gallery";

export type AnimalType = "cat" | "dog";

export interface MessageDefinition {
  text: string;
  subtitle?: string;
  size: "small" | "medium" | "hero";
  variant: TypographyVariant;
}

export interface SiteLabels {
  summonButton: (count: number) => string;
  summoningButton: string;
  expandStream: string;
  counterBadge: (count: number) => string;
  addMoreTitle: (count: number) => string;
  refreshTitle: string;
  connectionErrorTag: string;
  failedInitialSummon: string;
  tryAgainButton: string;
  failedImageText: string;
  altText: (tags: string[] | null, id: string) => string;
}

export interface SiteConfig {
  animal: AnimalType;
  title: string;
  singularName: string;
  pluralName: string;
  storageKey: string;
  heroStart: MessageDefinition;
  heroEnd: MessageDefinition;
  messages: MessageDefinition[];
  fetchImages: (targetCount?: number, signal?: AbortSignal) => Promise<AnimalImage[]>;
  fetchUniqueNewImages: (
    existingIds: Set<string>,
    targetNewCount: number,
    signal?: AbortSignal
  ) => Promise<AnimalImage[]>;
  getImageUrl: (imageOrId: AnimalImage | string, width?: number) => string;
  getImageSrcSet?: (imageOrId: AnimalImage | string) => string;
  labels: SiteLabels;
}
