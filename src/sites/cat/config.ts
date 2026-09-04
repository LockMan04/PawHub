import type { SiteConfig } from "../../types/site-config";
import { fetchRandomCats, fetchUniqueNewCats, getCatImageUrl, createCatSrcSet } from "./provider";
import { HERO_START, HERO_END, INTERMEDIATE_MESSAGES } from "./messages";

export const catSiteConfig: SiteConfig = {
  animal: "cat",
  title: "PawHub | Cats",
  singularName: "cat",
  pluralName: "cats",
  storageKey: "cat-scroll-v6-store",
  heroStart: HERO_START,
  heroEnd: HERO_END,
  messages: INTERMEDIATE_MESSAGES,
  fetchImages: fetchRandomCats,
  fetchUniqueNewImages: fetchUniqueNewCats,
  getImageUrl: (imageOrId, width) => getCatImageUrl(imageOrId, width),
  getImageSrcSet: (imageOrId) => createCatSrcSet(imageOrId),
  labels: {
    summonButton: (count) => `Summon ${count} more cats`,
    summoningButton: "Summoning cats...",
    expandStream: "expand the feline stream",
    counterBadge: (count) => `${count} cats`,
    addMoreTitle: (count) => `Add ${count} more cats`,
    refreshTitle: "Fetch new litter",
    connectionErrorTag: "connection error",
    failedInitialSummon: "Failed to summon cats",
    tryAgainButton: "Try Again",
    failedImageText: "failed to load cat",
    altText: (tags, id) => (tags && tags.length > 0 ? `Cat tagged ${tags.join(" ")}` : `Cat ${id}`),
  },
};
