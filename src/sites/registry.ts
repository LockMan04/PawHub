import type { AnimalType, SiteConfig } from "../types/site-config";
import { catSiteConfig } from "./cat";
import { dogSiteConfig } from "./dog";

export const SITES: Record<AnimalType, SiteConfig> = {
  cat: catSiteConfig,
  dog: dogSiteConfig,
};

export function resolveSiteType(hostname?: string, search?: string): AnimalType {
  const currentSearch = search ?? (typeof window !== "undefined" ? window.location.search : "");
  if (currentSearch) {
    const params = new URLSearchParams(currentSearch);
    const siteParam = params.get("site")?.toLowerCase();
    if (siteParam === "dog") return "dog";
    if (siteParam === "cat") return "cat";
  }

  const currentHostname = (
    hostname ?? (typeof window !== "undefined" ? window.location.hostname : "")
  ).toLowerCase();

  if (currentHostname.startsWith("dog.")) return "dog";
  if (currentHostname.startsWith("cat.")) return "cat";

  return "cat";
}

export function getSiteConfig(type?: AnimalType): SiteConfig {
  const resolvedType = type ?? resolveSiteType();
  return SITES[resolvedType] ?? SITES.cat;
}
