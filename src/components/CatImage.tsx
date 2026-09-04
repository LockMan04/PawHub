import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "motion/react";
import { ImageGalleryItem } from "../types/cat";
import { isImagePreloaded, preloadImage } from "../lib/imagePreloader";
import { createCatSrcSet, getCatImageUrl } from "../lib/cataas";

interface CatImageProps {
  item: ImageGalleryItem;
  priority?: boolean;
}

export const CatImage: React.FC<CatImageProps> = React.memo(({ item, priority = false }) => {
  const ref = useRef<HTMLElement>(null);
  const imageUrl = getCatImageUrl(item.cat.id, 640);
  const srcSet = createCatSrcSet(item.cat.id);
  const [isLoaded, setIsLoaded] = useState(() => isImagePreloaded(imageUrl));
  const [hasError, setHasError] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    mass: 0.2,
  });

  const travelDistance = Math.round(80 * item.meta.speed);
  const transformY = useTransform(smoothProgress, [0, 1], [travelDistance, -travelDistance]);

  const y = shouldReduceMotion ? undefined : transformY;
  const rotate = shouldReduceMotion ? undefined : `${item.meta.rotation}deg`;

  useEffect(() => {
    if (isLoaded) return;

    if (priority) {
      preloadImage(imageUrl, "high").then(() => setIsLoaded(true));
      return;
    }

    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      preloadImage(imageUrl, "low").then(() => setIsLoaded(true));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          preloadImage(imageUrl, "high").then(() => setIsLoaded(true));
          observer.disconnect();
        }
      },
      { rootMargin: "1000px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [imageUrl, isLoaded, priority]);

  const tags = item.cat.tags && item.cat.tags.length > 0
    ? item.cat.tags.slice(0, 2).map((t) => `#${t.trim()}`).join(" ")
    : null;

  const calculatedHeight = Math.round(640 / (item.meta.aspectRatioValue || 1));

  return (
    <motion.figure
      ref={ref}
      style={{
        y,
        rotate,
      }}
      className="relative my-6 md:my-10 group"
    >
      <div
        className="relative overflow-hidden rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/70 shadow-sm transition-[transform,box-shadow] duration-300 hover:shadow-xl hover:scale-[1.015] border border-black/[0.04] dark:border-white/[0.06]"
        style={{
          aspectRatio: item.meta.aspectRatio,
        }}
      >
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-tr from-neutral-200 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700" />
        )}

        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-xs font-mono text-neutral-400">
            <span>failed to load cat</span>
            <span className="text-[10px] opacity-70 mt-1">{item.cat.id}</span>
          </div>
        ) : (
          <img
            src={imageUrl}
            srcSet={srcSet}
            sizes="(max-width: 640px) 85vw, (max-width: 1024px) 33vw, 25vw"
            alt={tags ? `Cat tagged ${tags}` : `Cat ${item.cat.id}`}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "low"}
            decoding="async"
            width={640}
            height={calculatedHeight}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {tags && isLoaded && (
          <div className="absolute bottom-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span className="px-2.5 py-1 text-[11px] font-mono tracking-tight bg-black/60 dark:bg-white/80 text-white dark:text-black backdrop-blur-md rounded-full shadow-sm">
              {tags}
            </span>
          </div>
        )}
      </div>
    </motion.figure>
  );
});

CatImage.displayName = "CatImage";
