import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface ToastProps {
  message: string | null;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  onClose,
  duration = 2500,
}) => {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  return (
    <AnimatePresence>
      {message && (
        <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-neutral-900/95 dark:bg-neutral-100/95 text-white dark:text-neutral-900 text-xs sm:text-sm font-mono shadow-2xl backdrop-blur-md border border-neutral-700/50 dark:border-neutral-300/50"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="truncate max-w-[80vw]">{message}</span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
