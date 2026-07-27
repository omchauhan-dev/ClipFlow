'use client';

import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [prompt]);

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black via-zinc-950 to-black"
          onClick={onClose}
        >
          {/* Glass backdrop */}
          <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-sm" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
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
            className="absolute top-5 right-16 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <Download className="h-5 w-5" />
          </a>

          {/* Previous button */}
          {hasPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
              className="absolute left-5 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Next button */}
          {hasNext && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext?.(); }}
              className="absolute right-5 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Image/Video */}
          <motion.div
            key={url}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative flex flex-col items-center gap-5 px-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glass frame */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-2xl shadow-2xl shadow-black/50">
              {isVideo ? (
                <video
                  src={url}
                  controls
                  autoPlay
                  className="max-h-[80vh] max-w-full rounded-xl"
                />
              ) : (
                <img
                  src={url}
                  alt={prompt || ''}
                  className="max-h-[80vh] max-w-full rounded-xl object-contain"
                />
              )}
            </div>

            {/* Copy prompt */}
            {prompt && (
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/60 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy prompt'}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
