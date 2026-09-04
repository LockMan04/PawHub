import React, { useEffect, useRef, useState, useCallback } from "react";
import { useReducedMotion } from "motion/react";

export const CustomScrollbar: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [trackHeight, setTrackHeight] = useState(300);
  const [thumbHeight, setThumbHeight] = useState(48);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const shouldReduceMotion = useReducedMotion();
  const dragStartY = useRef(0);
  const startScrollTop = useRef(0);
  const rafId = useRef<number | null>(null);

  const updateScroll = useCallback(() => {
    if (rafId.current !== null) return;

    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      const doc = document.documentElement;
      const scrollHeight = doc.scrollHeight;
      const clientHeight = doc.clientHeight;
      const scrollTop = window.scrollY || doc.scrollTop;
      const maxScroll = scrollHeight - clientHeight;

      if (maxScroll <= 0) {
        setScrollProgress(0);
        return;
      }

      const progress = Math.min(1, Math.max(0, scrollTop / maxScroll));
      setScrollProgress(progress);

      if (trackHeight > 0) {
        const computedHeight = Math.max(
          36,
          Math.min(trackHeight * 0.5, (clientHeight / scrollHeight) * trackHeight)
        );
        setThumbHeight(computedHeight);
      }
    });
  }, [trackHeight]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          setTrackHeight(entry.contentRect.height);
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll, { passive: true });
    updateScroll();

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
    };
  }, [updateScroll]);

  const scrollToY = (targetY: number, smooth = true) => {
    const doc = document.documentElement;
    const maxScroll = doc.scrollHeight - doc.clientHeight;
    const behavior: ScrollBehavior =
      smooth && !shouldReduceMotion ? "smooth" : "auto";
    window.scrollTo({
      top: Math.min(maxScroll, Math.max(0, targetY)),
      behavior,
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;

    const maxTop = Math.max(0, trackHeight - thumbHeight);
    const currentThumbTop = scrollProgress * maxTop;

    const isClickOnThumb =
      clickY >= currentThumbTop && clickY <= currentThumbTop + thumbHeight;

    if (!isClickOnThumb) {
      const newProgress = Math.min(
        1,
        Math.max(0, (clickY - thumbHeight / 2) / (trackHeight - thumbHeight))
      );
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - doc.clientHeight;
      scrollToY(newProgress * maxScroll, true);
    }

    setIsDragging(true);
    dragStartY.current = e.clientY;
    startScrollTop.current = window.scrollY;

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const deltaY = e.clientY - dragStartY.current;
    const doc = document.documentElement;
    const maxScroll = doc.scrollHeight - doc.clientHeight;
    const scrollableTrack = trackHeight - thumbHeight;

    if (scrollableTrack <= 0) return;

    const scrollDelta = (deltaY / scrollableTrack) * maxScroll;
    window.scrollTo({
      top: Math.min(maxScroll, Math.max(0, startScrollTop.current + scrollDelta)),
      behavior: "instant" as ScrollBehavior,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const doc = document.documentElement;
    const maxScroll = doc.scrollHeight - doc.clientHeight;
    const behavior: ScrollBehavior = shouldReduceMotion ? "auto" : "smooth";

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        window.scrollBy({ top: 120, behavior });
        break;
      case "ArrowUp":
        e.preventDefault();
        window.scrollBy({ top: -120, behavior });
        break;
      case "PageDown":
        e.preventDefault();
        window.scrollBy({ top: window.innerHeight * 0.85, behavior });
        break;
      case "PageUp":
        e.preventDefault();
        window.scrollBy({ top: -window.innerHeight * 0.85, behavior });
        break;
      case "Home":
        e.preventDefault();
        window.scrollTo({ top: 0, behavior });
        break;
      case "End":
        e.preventDefault();
        window.scrollTo({ top: maxScroll, behavior });
        break;
      default:
        break;
    }
  };

  const maxTop = Math.max(0, trackHeight - thumbHeight);
  const thumbTop = scrollProgress * maxTop;
  const progressPercent = Math.round(scrollProgress * 100);

  return (
    <div
      ref={containerRef}
      role="scrollbar"
      tabIndex={0}
      aria-label="Page scroll position"
      aria-controls="main-content"
      aria-valuenow={progressPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="fixed right-1 sm:right-2 top-20 bottom-20 z-50 flex items-center justify-center select-none w-11 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white rounded-full touch-none"
    >
      <div
        ref={trackRef}
        className={`relative h-full transition-[width] duration-200 flex justify-center pointer-events-none ${
          isHovered || isDragging ? "w-2.5" : "w-1.5"
        }`}
      >
        <div className="absolute inset-y-0 w-1 sm:w-1.5 rounded-full bg-neutral-300/40 dark:bg-neutral-800/60 backdrop-blur-sm" />

        <div
          style={{
            transform: `translateY(${thumbTop}px)`,
            height: `${thumbHeight}px`,
          }}
          className={`absolute top-0 w-full rounded-full transition-colors duration-150 cursor-grab active:cursor-grabbing ${
            isDragging
              ? "bg-black dark:bg-white shadow-md scale-110"
              : isHovered
              ? "bg-neutral-800 dark:bg-neutral-200"
              : "bg-neutral-500/80 dark:bg-neutral-400/80"
          }`}
        />

        {(isHovered || isDragging) && (
          <div
            style={{
              top: `${Math.min(trackHeight - 24, Math.max(0, thumbTop))}px`,
            }}
            className="absolute right-7 pointer-events-none font-mono text-[10px] tracking-wider px-2 py-0.5 rounded bg-black/80 dark:bg-white/90 text-white dark:text-black backdrop-blur-md shadow-sm whitespace-nowrap"
          >
            {progressPercent}%
          </div>
        )}
      </div>
    </div>
  );
};
