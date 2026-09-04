import type { SiteConfig } from "../../types/site-config";
import { fetchRandomDogs, fetchUniqueNewDogs, getDogImageUrl } from "./provider";
import { DOG_HERO_START, DOG_HERO_END, DOG_MESSAGES } from "./messages";

export const dogSiteConfig: SiteConfig = {
  animal: "dog",
  title: "PawHub | Dogs",
  singularName: "dog",
  pluralName: "dogs",
  storageKey: "dog-scroll-v2-store",
  heroStart: DOG_HERO_START,
  heroEnd: DOG_HERO_END,
  messages: DOG_MESSAGES,
  fetchImages: fetchRandomDogs,
  fetchUniqueNewImages: fetchUniqueNewDogs,
  getImageUrl: (imageOrId) => getDogImageUrl(imageOrId),
  labels: {
    summonButton: (count) => `Summon ${count} more dogs`,
    summoningButton: "Summoning dogs...",
    expandStream: "expand the canine stream",
    counterBadge: (count) => `${count} dogs`,
    addMoreTitle: (count) => `Add ${count} more dogs`,
    refreshTitle: "Fetch new pack",
    connectionErrorTag: "connection error",
    failedInitialSummon: "Failed to summon dogs",
    tryAgainButton: "Try Again",
    failedImageText: "failed to load dog",
    altText: (tags, id) => (tags && tags.length > 0 ? `Dog tagged ${tags.join(" ")}` : `Dog ${id}`),
  },
};
