import React, { useState, useEffect, useCallback, useId, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Copy, Check, Share2, Download, ExternalLink, X, Loader2 } from "lucide-react";
import { ImageGalleryItem, OriginRect } from "../types/gallery";
import { SiteConfig } from "../types/site-config";
import { copyImageToClipboard, shareImage, downloadImage } from "../core/images/actions";

export interface ImageDetailModalProps {
  item: ImageGalleryItem;
  initialSrc?: string;
  originRect?: OriginRect;
  config: SiteConfig;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

export const ImageDetailModal: React.FC<ImageDetailModalProps> = ({
  item,
  initialSrc,
  originRect,
  config,
  onClose,
  onShowToast,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  const targetImage = item.image;
  const rawUrl = targetImage.url;
  const highResUrl = config.getImageUrl
    ? config.getImageUrl(targetImage, 1280)
    : rawUrl;

  const hasHighResUpgrade = Boolean(initialSrc && highResUrl && initialSrc !== highResUrl);
  const [isHighResLoaded, setIsHighResLoaded] = useState(!hasHighResUpgrade);
  const shouldReduceMotion = useReducedMotion();

  const animationParams = useMemo(() => {
    if (shouldReduceMotion || !originRect || typeof window === "undefined") {
      return {
        initial: { opacity: 0, scale: 0.94, y: 16, x: 0 },
        animate: { opacity: 1, scale: 1, y: 0, x: 0 },
        exit: { opacity: 0, scale: 0.94, y: 16, x: 0 },
      };
    }

    const modalEstWidth = Math.min(window.innerWidth * 0.9, 896);
    const thumbCenterX = originRect.left + originRect.width / 2;
    const thumbCenterY = originRect.top + originRect.height / 2;
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;

    const deltaX = Math.round(thumbCenterX - viewportCenterX);
    const deltaY = Math.round(thumbCenterY - viewportCenterY);
    const initialScale = Math.max(0.15, Math.min(0.65, originRect.width / modalEstWidth));

    return {
      initial: { opacity: 0, scale: initialScale, x: deltaX, y: deltaY },
      animate: { opacity: 1, scale: 1, x: 0, y: 0 },
      exit: { opacity: 0, scale: initialScale, x: deltaX, y: deltaY },
    };
  }, [originRect, shouldReduceMotion]);

  useEffect(() => {
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

    const focusTimer = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(focusTimer);
      previouslyFocusedElementRef.current?.focus();
    };
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const dialogEl = dialogRef.current;
        if (!dialogEl) return;

        const focusableElements = dialogEl.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement || !dialogEl.contains(document.activeElement)) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !dialogEl.contains(document.activeElement)) {
            event.preventDefault();
            firstElement.focus();
          }
        }
        return;
      }

      const scrollKeys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", " ", "Home", "End"];
      if (scrollKeys.includes(event.key) && event.target === document.body) {
        event.preventDefault();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!hasHighResUpgrade) return;

    let isCancelled = false;
    const img = new Image();
    img.src = highResUrl;

    img.onload = () => {
      if (!isCancelled) {
        setIsHighResLoaded(true);
      }
    };

    return () => {
      isCancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [hasHighResUpgrade, highResUrl]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [handleKeyDown]);

  const filename = `pawhub-${config.animal}-${targetImage.id}.jpg`;

  const handleCopy = async () => {
    const result = await copyImageToClipboard(rawUrl);
    if (result.success) {
      setIsCopied(true);
      if (result.type === "image") {
        onShowToast(config.labels.copyImageSuccessToast);
      } else {
        onShowToast(config.labels.copyImageFallbackToast);
      }
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const result = await shareImage({
      title: config.title,
      text: `${config.labels.altText(targetImage.tags, targetImage.id)} on PawHub`,
      url: rawUrl,
    });

    if (result.success) {
      if (result.method === "clipboard") {
        setIsCopied(true);
        onShowToast(config.labels.shareSuccessToast);
        setTimeout(() => setIsCopied(false), 2000);
      }
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const result = await downloadImage(rawUrl, filename);
      if (result.success) {
        onShowToast(config.labels.saveSuccessToast);
      } else if (result.fallbackOpened) {
        onShowToast(config.labels.saveErrorToast);
      } else {
        onShowToast(config.labels.downloadBlockedToast);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md"
        aria-hidden="true"
      />

      <motion.div
        ref={dialogRef}
        initial={animationParams.initial}
        animate={animationParams.animate}
        exit={animationParams.exit}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col items-center bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden origin-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <h2
              id={titleId}
              className="font-mono text-xs sm:text-sm font-semibold tracking-wide truncate text-neutral-800 dark:text-neutral-200"
            >
              {config.labels.altText(targetImage.tags, targetImage.id)}
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label={config.labels.closeModalAction}
            className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative w-full flex-1 flex items-center justify-center p-3 sm:p-6 min-h-[240px] max-h-[66vh] bg-black/[0.03] dark:bg-black/20 overflow-hidden">
          <img
            src={initialSrc || highResUrl}
            alt={config.labels.altText(targetImage.tags, targetImage.id)}
            className={`w-auto h-auto max-h-[60vh] max-w-full object-contain rounded-xl shadow-md select-none transition-opacity duration-700 ease-in-out ${
              isHighResLoaded && hasHighResUpgrade ? "opacity-0" : "opacity-100"
            }`}
            loading="eager"
            decoding="sync"
          />

          {hasHighResUpgrade && (
            <img
              src={highResUrl}
              alt={config.labels.altText(targetImage.tags, targetImage.id)}
              className={`absolute inset-0 m-auto w-auto h-auto max-h-[60vh] max-w-full object-contain rounded-xl shadow-md select-none transition-all duration-700 ease-in-out ${
                isHighResLoaded ? "opacity-100 scale-100" : "opacity-0 scale-[1.015] pointer-events-none"
              }`}
              loading="eager"
              decoding="async"
            />
          )}
        </div>

        <div className="w-full flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-black/5 dark:border-white/5 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-1.5 flex-wrap">
            {targetImage.tags && targetImage.tags.length > 0 ? (
              targetImage.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 text-[11px] font-mono rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-neutral-600 dark:text-neutral-300"
                >
                  #{tag.trim()}
                </span>
              ))
            ) : (
              <span className="text-[11px] font-mono text-neutral-400">
                ID: {targetImage.id}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <button
              onClick={handleCopy}
              aria-label={isCopied ? config.labels.copiedAction : config.labels.copyImageAction}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl font-mono text-xs font-medium border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>{isCopied ? config.labels.copiedAction : config.labels.copyImageAction}</span>
            </button>

            <button
              onClick={handleShare}
              aria-label={config.labels.shareAction}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl font-mono text-xs font-medium border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
            >
              <Share2 className="w-4 h-4" />
              <span>{config.labels.shareAction}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              aria-label={isDownloading ? config.labels.savingAction : config.labels.saveAction}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl font-mono text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isDownloading ? config.labels.savingAction : config.labels.saveAction}</span>
            </button>

            <a
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={config.labels.openOriginalAction}
              className="p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
              title={config.labels.openOriginalAction}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

ImageDetailModal.displayName = "ImageDetailModal";
