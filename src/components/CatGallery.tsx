import React, { useMemo } from "react";
import { GalleryItem, TextGalleryItem } from "../types/cat";
import { CatImage } from "./CatImage";
import { FloatingText } from "./FloatingText";

interface CatGalleryProps {
  items: GalleryItem[];
  onLoadMore?: () => void;
  isFetchingMore?: boolean;
}

type GallerySection =
  | { type: "major-text"; item: TextGalleryItem }
  | { type: "cluster"; items: GalleryItem[] };

export const CatGallery: React.FC<CatGalleryProps> = React.memo(({
  items,
  onLoadMore,
  isFetchingMore = false,
}) => {
  const sections = useMemo(() => {
    const result: GallerySection[] = [];
    let currentCluster: GalleryItem[] = [];

    for (const item of items) {
      const isMajorText =
        item.type === "text" &&
        (item.size === "hero" || item.id.startsWith("major-break"));

      if (isMajorText) {
        if (currentCluster.length > 0) {
          result.push({ type: "cluster", items: currentCluster });
          currentCluster = [];
        }
        result.push({ type: "major-text", item });
      } else {
        currentCluster.push(item);
      }
    }

    if (currentCluster.length > 0) {
      result.push({ type: "cluster", items: currentCluster });
    }

    return result;
  }, [items]);

  return (
    <main id="main-content" tabIndex={-1} className="relative w-full min-h-screen py-8 sm:py-12 focus:outline-none">
      {sections.map((section, sectionIdx) => {
        if (section.type === "major-text") {
          const isHeroEnd = section.item.id === "hero-end";
          return (
            <React.Fragment key={section.item.id}>
              {isHeroEnd && onLoadMore && (
                <div className="w-full flex flex-col items-center justify-center py-16 px-4 select-none">
                  <button
                    onClick={onLoadMore}
                    disabled={isFetchingMore}
                    aria-label="Summon 20 more cats to the gallery"
                    className="group relative inline-flex items-center gap-3 px-8 py-4 border-2 border-neutral-900 dark:border-neutral-100 bg-white dark:bg-neutral-900 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[5px_5px_0px_0px_rgba(255,255,255,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-[transform,box-shadow,opacity] disabled:opacity-50 cursor-pointer min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-neutral-900 dark:text-neutral-100">
                      {isFetchingMore ? "Summoning cats..." : "Summon 20 more cats"}
                    </span>
                  </button>
                  <p className="font-mono text-[11px] text-neutral-400 mt-3 tracking-widest uppercase">
                    expand the feline stream
                  </p>
                </div>
              )}
              <FloatingText item={section.item} />
            </React.Fragment>
          );
        }

        const isBelowFold = sectionIdx > 2;

        return (
          <div
            key={`cluster-${sectionIdx}`}
            className={`w-full max-w-[1700px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 py-8 md:py-16 ${
              isBelowFold ? "content-visibility-auto" : ""
            }`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-7 md:gap-8 lg:gap-10 items-center">
              {section.items.map((item, itemIdx) => {
                if (item.type === "text") {
                  return (
                    <div
                      key={item.id}
                      style={{
                        marginTop: `${item.meta.yOffset}px`,
                      }}
                      className="w-full flex items-center justify-center p-2"
                    >
                      <FloatingText item={item} inline={true} />
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    style={{
                      marginTop: `${item.meta.yOffset}px`,
                      transform: `translateX(${item.meta.xOffset}px)`,
                    }}
                    className="w-full max-w-[85vw] sm:max-w-none mx-auto"
                  >
                    <CatImage
                      item={item}
                      priority={sectionIdx === 1 && itemIdx < 6}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </main>
  );
});

CatGallery.displayName = "CatGallery";
