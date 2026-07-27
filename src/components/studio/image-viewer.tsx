'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
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

const slideVariants = {
  enter: (dir: number) => ({ x: dir * 400, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -400, opacity: 0 }),
};

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
  const [dir, setDir] = useState(0);
  const dirRef = useRef(0);

  const handleCopy = useCallback(() => {
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [prompt]);

  const goNext = useCallback(() => { dirRef.current = 1; setDir(1); onNext?.(); }, [onNext]);
  const goPrev = useCallback(() => { dirRef.current = -1; setDir(-1); onPrev?.(); }, [onPrev]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) goPrev();
      if (e.key === 'ArrowRight' && hasNext) goNext();
    },
    [onClose, goPrev, goNext, hasPrev, hasNext]
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
          <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-sm" />

          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

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

          {hasPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-5 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {hasNext && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-5 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          <div className="relative flex flex-col items-center gap-5 px-4" onClick={(e) => e.stopPropagation()}>
            <AnimatePresence mode="popLayout" custom={dirRef.current}>
              <motion.div
                key={url}
                custom={dirRef.current}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                layout
              >
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
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={url + '-copy'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
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
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
