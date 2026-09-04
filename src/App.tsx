import React, { useEffect, useMemo } from "react";
import { resolveSiteType, getSiteConfig } from "./sites/registry";
import { useAnimalGallery } from "./hooks/useAnimalGallery";
import { Gallery } from "./components/Gallery";
import { LoadingGallery } from "./components/LoadingGallery";
import { HeaderControls } from "./components/HeaderControls";
import { CustomScrollbar } from "./components/CustomScrollbar";

export const App: React.FC = () => {
  const siteType = useMemo(() => resolveSiteType(), []);
  const siteConfig = useMemo(() => getSiteConfig(siteType), [siteType]);

  useEffect(() => {
    document.title = siteConfig.title;
  }, [siteConfig.title]);

  const {
    items,
    count,
    isLoading,
    isFetchingMore,
    error,
    refresh,
    loadMore,
    retry,
    clearError,
  } = useAnimalGallery(siteConfig, 60);

  if (isLoading && items.length === 0) {
    return <LoadingGallery config={siteConfig} />;
  }

  if (error && items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="font-mono text-xs tracking-widest text-neutral-400 uppercase mb-4">
          {siteConfig.labels.connectionErrorTag}
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
          {siteConfig.labels.failedInitialSummon}
        </h2>
        <button
          onClick={refresh}
          aria-label={`Retry loading ${siteConfig.pluralName} gallery`}
          className="px-6 py-3 min-h-[44px] min-w-[44px] rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium tracking-wide hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
        >
          {siteConfig.labels.tryAgainButton}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-neutral-900 focus:text-white focus:rounded-full focus:shadow-lg dark:focus:bg-white dark:focus:text-neutral-900 font-mono text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 dark:focus-visible:ring-white"
      >
        Skip to main content
      </a>

      <HeaderControls
        count={count}
        onRefresh={refresh}
        onLoadMore={() => loadMore(20)}
        isLoading={isLoading}
        isFetchingMore={isFetchingMore}
        config={siteConfig}
      />

      <CustomScrollbar />

      <Gallery
        items={items}
        onLoadMore={() => loadMore(20)}
        isFetchingMore={isFetchingMore}
        config={siteConfig}
      />

      {error && items.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 max-w-[90vw] sm:max-w-md bg-neutral-900/95 dark:bg-neutral-100/95 text-white dark:text-neutral-900 backdrop-blur-md rounded-2xl shadow-2xl border border-neutral-700/50 dark:border-neutral-300/50 text-xs sm:text-sm font-medium"
        >
          <span className="truncate flex-1">{error}</span>
          <button
            onClick={retry}
            aria-label={`Retry loading ${siteConfig.pluralName}`}
            className="px-3 py-1.5 min-h-[36px] bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white rounded-xl font-semibold hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white dark:focus-visible:ring-neutral-900"
          >
            Retry
          </button>
          <button
            onClick={clearError}
            aria-label="Dismiss error message"
            className="px-2.5 py-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-neutral-400 hover:text-white dark:text-neutral-500 dark:hover:text-neutral-900 transition-colors cursor-pointer focus-visible:outline-none"
          >
            X
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
