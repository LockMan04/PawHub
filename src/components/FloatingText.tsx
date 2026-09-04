import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "motion/react";
import { TextGalleryItem } from "../types/gallery";

interface FloatingTextProps {
  item: TextGalleryItem;
  inline?: boolean;
}

export const FloatingText: React.FC<FloatingTextProps> = React.memo(({ item, inline = false }) => {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.2,
  });

  const travelY = Math.round(40 * item.meta.speed);
  const transformY = useTransform(smoothProgress, [0, 1], [travelY, -travelY]);
  const y = shouldReduceMotion ? undefined : transformY;
  const variant = item.variant;

  if (variant === "hero") {
    const isMainTitle = item.id === "hero-start";

    return (
      <div
        ref={ref}
        className="w-full flex flex-col justify-center items-center py-24 sm:py-36 md:py-48 px-4 overflow-hidden select-none text-center"
      >
        {isMainTitle ? (
          <motion.h1
            style={{ y }}
            className="text-7xl sm:text-8xl md:text-9xl lg:text-[11rem] font-black tracking-tighter text-neutral-900 dark:text-neutral-50 leading-none uppercase will-change-transform font-sans"
          >
            {item.text}
          </motion.h1>
        ) : (
          <motion.h2
            style={{ y }}
            className="text-7xl sm:text-8xl md:text-9xl lg:text-[11rem] font-black tracking-tighter text-neutral-900 dark:text-neutral-50 leading-none uppercase will-change-transform font-sans"
          >
            {item.text}
          </motion.h2>
        )}

        {item.subtitle && (
          <motion.p
            style={{ y }}
            className="mt-6 sm:mt-8 font-serif italic text-base sm:text-xl md:text-2xl text-neutral-500 dark:text-neutral-400 tracking-wide max-w-xl text-balance will-change-transform"
          >
            &ldquo;{item.subtitle}&rdquo;
          </motion.p>
        )}
      </div>
    );
  }

  if (variant === "editorial-serif") {
    return (
      <div
        ref={ref}
        className={`w-full flex justify-center items-center select-none ${
          inline ? "py-6 px-3" : "py-24 sm:py-32 md:py-40 px-6"
        }`}
      >
        <motion.h2
          style={{ y }}
          className={`font-serif italic font-normal tracking-normal text-neutral-800 dark:text-neutral-100 text-center text-balance will-change-transform ${
            inline
              ? "text-2xl sm:text-3xl lg:text-4xl max-w-xs"
              : "text-4xl sm:text-6xl md:text-7xl lg:text-8xl max-w-5xl"
          }`}
        >
          &ldquo;{item.text}&rdquo;
        </motion.h2>
      </div>
    );
  }

  if (variant === "outlined") {
    return (
      <div
        ref={ref}
        className={`w-full flex justify-center items-center select-none ${
          inline ? "py-6 px-3" : "py-20 sm:py-28 md:py-36 px-6"
        }`}
      >
        <motion.h2
          style={{ y }}
          className={`font-black uppercase tracking-tight text-neutral-900 dark:text-neutral-100 text-center leading-none will-change-transform ${
            inline
              ? "stroke-text text-3xl sm:text-4xl lg:text-5xl max-w-xs"
              : "stroke-text-thick text-5xl sm:text-7xl md:text-8xl lg:text-9xl max-w-5xl"
          }`}
        >
          {item.text}
        </motion.h2>
      </div>
    );
  }

  if (variant === "gradient") {
    return (
      <div
        ref={ref}
        className={`w-full flex justify-center items-center select-none ${
          inline ? "py-6 px-3" : "py-20 sm:py-28 md:py-36 px-6"
        }`}
      >
        <motion.h2
          style={{ y }}
          className={`bg-gradient-to-r from-neutral-900 via-neutral-600 to-neutral-400 dark:from-white dark:via-neutral-300 dark:to-neutral-500 bg-clip-text text-transparent font-extrabold tracking-tight text-center will-change-transform ${
            inline
              ? "text-xl sm:text-2xl lg:text-3xl max-w-xs"
              : "text-3xl sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl"
          }`}
        >
          {item.text}
        </motion.h2>
      </div>
    );
  }

  if (variant === "brutalist-mono") {
    return (
      <div
        ref={ref}
        className={`w-full flex justify-center items-center select-none ${
          inline ? "py-6 px-2" : "py-12 sm:py-16 md:py-20 px-6"
        }`}
      >
        <motion.div
          style={{ y }}
          className={`inline-flex items-center gap-2.5 border-2 border-neutral-900 dark:border-neutral-100 bg-white dark:bg-neutral-900 will-change-transform ${
            inline
              ? "px-3.5 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]"
              : "px-6 py-3.5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[5px_5px_0px_0px_rgba(255,255,255,1)]"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-neutral-900 dark:text-neutral-100">
            {item.text}
          </span>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`w-full flex justify-center items-center select-none ${
        inline ? "py-6 px-2" : "py-12 sm:py-16 md:py-20 px-6"
      }`}
    >
      <motion.div
        style={{ y }}
        className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-800 bg-neutral-100/80 dark:bg-neutral-900/80 backdrop-blur-md will-change-transform"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
        <span className="font-mono text-xs sm:text-sm tracking-widest text-neutral-600 dark:text-neutral-300 uppercase font-medium">
          {item.text}
        </span>
      </motion.div>
    </div>
  );
});

FloatingText.displayName = "FloatingText";
