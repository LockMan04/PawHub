import React, { useState, useEffect } from "react";
import { flushSync } from "react-dom";
import { motion, useScroll, useSpring } from "motion/react";
import { RefreshCw, Moon, Sun, Plus, Github } from "lucide-react";
import { SiteConfig } from "../types/site-config";

export interface HeaderControlsProps {
  count?: number;
  catCount?: number;
  onRefresh: () => void;
  onLoadMore?: () => void;
  isLoading: boolean;
  isFetchingMore?: boolean;
  config: SiteConfig;
}

const THEME_KEY = "animal-scroll-theme";

function applyTheme(isDarkMode: boolean) {
  if (isDarkMode) {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }
}

export const HeaderControls: React.FC<HeaderControlsProps> = ({
  count,
  catCount,
  onRefresh,
  onLoadMore,
  isLoading,
  isFetchingMore = false,
  config,
}) => {
  const displayCount = count ?? catCount ?? 0;

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem(THEME_KEY) || localStorage.getItem("cat-scroll-theme");
      if (stored === "dark") return true;
      if (stored === "light") return false;
    } catch {
      // Storage access blocked or restricted
    }
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  const toggleDarkMode = (event: React.MouseEvent<HTMLButtonElement>) => {
    const nextMode = !isDark;
    const saveTheme = () => {
      try {
        localStorage.setItem(THEME_KEY, nextMode ? "dark" : "light");
      } catch {
        // Storage quota or disabled
      }
    };

    if (
      typeof document === "undefined" ||
      !("startViewTransition" in document) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      applyTheme(nextMode);
      setIsDark(nextMode);
      saveTheme();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX || rect.left + rect.width / 2;
    const y = event.clientY || rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as unknown as { startViewTransition: (cb: () => void) => { ready: Promise<void> } }).startViewTransition(() => {
      flushSync(() => {
        applyTheme(nextMode);
        setIsDark(nextMode);
      });
      saveTheme();
    });

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 700,
            easing: "cubic-bezier(0.25, 0, 0.15, 1)",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      })
      .catch(() => {});
  };

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-neutral-900 dark:bg-white z-50 origin-left"
        style={{ scaleX }}
      />

      <header className="fixed top-3 right-3 sm:top-4 sm:right-4 z-40 flex items-center gap-2 select-none">
        <div
          aria-live="polite"
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.08] shadow-sm font-mono text-xs text-neutral-600 dark:text-neutral-300 min-h-[44px]"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{config.labels.counterBadge(displayCount)}</span>
        </div>

        {onLoadMore && (
          <button
            onClick={onLoadMore}
            disabled={isLoading || isFetchingMore}
            aria-label={config.labels.addMoreTitle(20)}
            title={config.labels.addMoreTitle(20)}
            className="flex items-center justify-center gap-1 px-3.5 py-2 min-h-[44px] min-w-[44px] rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.08] shadow-sm font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white transition-[transform,color,background-color,border-color] active:scale-95 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>20</span>
          </button>
        )}

        <button
          onClick={onRefresh}
          disabled={isLoading || isFetchingMore}
          aria-label={config.labels.refreshTitle}
          title={config.labels.refreshTitle}
          className="flex items-center justify-center p-2.5 min-h-[44px] min-w-[44px] rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.08] shadow-sm text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white transition-[transform,color,background-color,border-color] active:scale-95 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading || isFetchingMore ? "animate-spin" : ""}`} />
        </button>

        <button
          onClick={toggleDarkMode}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          title={isDark ? "Switch to light theme" : "Switch to dark theme"}
          className="flex items-center justify-center p-2.5 min-h-[44px] min-w-[44px] rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.08] shadow-sm text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white transition-[transform,color,background-color,border-color] active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white overflow-hidden"
        >
          <motion.div
            key={isDark ? "sun" : "moon"}
            initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0, 0.15, 1] }}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.div>
        </button>

        <a
          href="https://github.com/LockMan04/PawHub"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit PawHub repository on GitHub"
          title="GitHub @LockMan04/PawHub"
          className="flex items-center justify-center p-2.5 min-h-[44px] min-w-[44px] rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.08] shadow-sm text-neutral-700 dark:text-neutral-200 hover:text-black dark:hover:text-white transition-[transform,color,background-color,border-color] active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
        >
          <Github className="w-4 h-4" />
        </a>
      </header>
    </>
  );
};
