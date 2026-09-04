import React from "react";

export const LoadingGallery: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-24">
      <div className="text-center space-y-4 mb-16">
        <h1 className="text-6xl sm:text-8xl font-black tracking-tighter text-neutral-900 dark:text-neutral-100 uppercase animate-pulse">
          HELLO
        </h1>
        <p className="font-mono text-xs sm:text-sm tracking-widest text-neutral-400 uppercase">
          gathering cats...
        </p>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse border border-black/[0.03] dark:border-white/[0.04]"
            style={{
              aspectRatio: idx % 2 === 0 ? "4/5" : "1/1",
              animationDelay: `${idx * 120}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
