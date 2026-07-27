'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  prompt?: string;
  isVideo?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function ImageViewer({
  isOpen,
  onClose,
  url,
  prompt,
  isVideo,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: ImageViewerProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev?.();
      if (e.key === 'ArrowRight' && hasNext) onNext?.();
    },
    [onClose, onPrev, onNext, hasPrev, hasNext]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={onClose}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Download button */}
          <a
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 right-16 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-white"
          >
            <Download className="h-5 w-5" />
          </a>

          {/* Previous button */}
          {hasPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-white"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Next button */}
          {hasNext && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext?.(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-white"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Image/Video */}
          <motion.div
            key={url}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-4 px-4"
            onClick={(e) => e.stopPropagation()}
          >
            {isVideo ? (
              <video
                src={url}
                controls
                autoPlay
                className="max-h-[90vh] max-w-full rounded-2xl shadow-2xl"
              />
            ) : (
              <img
                src={url}
                alt={prompt || ''}
                className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain"
              />
            )}

            {/* Prompt caption */}
            {prompt && (
              <p className="max-w-2xl text-center text-sm text-white/60 px-4 pb-2">
                {prompt}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
