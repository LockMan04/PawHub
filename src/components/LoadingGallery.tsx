import React from "react";
import { SiteConfig } from "../types/site-config";

export interface LoadingGalleryProps {
  config: SiteConfig;
}

const SKELETON_ASPECT_RATIOS = ["1 / 1", "4 / 5", "3 / 4", "4 / 3", "16 / 10"];

export const LoadingGallery: React.FC<LoadingGalleryProps> = ({ config }) => {
  return (
    <main
      aria-busy="true"
      aria-label={`Loading ${config.pluralName} gallery`}
      className="relative w-full min-h-screen py-8 sm:py-12"
    >
      <div className="w-full flex flex-col justify-center items-center py-24 sm:py-36 md:py-48 px-4 overflow-hidden select-none text-center">
        <h1 className="text-7xl sm:text-8xl md:text-9xl lg:text-[11rem] font-black tracking-tighter text-neutral-900 dark:text-neutral-50 leading-none uppercase font-sans">
          {config.heroStart.text}
        </h1>
        {config.heroStart.subtitle && (
          <p className="mt-6 sm:mt-8 font-serif italic text-base sm:text-xl md:text-2xl text-neutral-500 dark:text-neutral-400 tracking-wide max-w-xl text-balance">
            &ldquo;{config.heroStart.subtitle}&rdquo;
          </p>
        )}
      </div>

      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 py-8 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-7 md:gap-8 lg:gap-10 items-center">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              aria-hidden="true"
              className="w-full max-w-[85vw] sm:max-w-none mx-auto rounded-2xl bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse border border-black/[0.03] dark:border-white/[0.04]"
              style={{
                aspectRatio: SKELETON_ASPECT_RATIOS[index % SKELETON_ASPECT_RATIOS.length],
                animationDelay: `${index * 90}ms`,
              }}
            />
          ))}
        </div>
      </div>
      <p className="sr-only" role="status">
        gathering {config.pluralName}...
      </p>
    </main>
  );
};
