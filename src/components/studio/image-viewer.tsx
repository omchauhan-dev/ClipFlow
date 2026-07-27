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
  const [downloaded, setDownloaded] = useState(false);

  const handleCopy = useCallback(() => {
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [prompt]);

  const handleDownload = useCallback(() => {
    if (downloading || downloaded) return;
    const name = prompt ? prompt.slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, '') : 'clipflow';
    const dlUrl = `/api/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`;
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = '';
    a.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  }, [url, prompt, downloading, downloaded]);

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
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            key={url}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black/95 p-4 backdrop-blur-2xl shadow-2xl shadow-black/60 max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute -top-2.5 -right-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/90 text-white/50 backdrop-blur transition-all hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Download */}
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              className="absolute -top-2.5 right-7 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/90 text-white/50 backdrop-blur transition-all hover:text-white"
            >
              {downloaded ? <Check className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
            </button>

            {/* Image/Video */}
            {isVideo ? (
              <video src={url} controls autoPlay className="max-h-[65vh] max-w-full rounded-xl" />
            ) : (
              <img src={url} alt={prompt || ''} className="max-h-[65vh] max-w-full rounded-xl object-contain" />
            )}

            {/* Copy prompt */}
            {prompt && (
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/50 backdrop-blur transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy prompt'}
              </button>
            )}

            {/* Nav */}
            {hasPrev && (
              <button
                onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                className="absolute -left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/90 text-white/50 backdrop-blur transition-all hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {hasNext && (
              <button
                onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                className="absolute -right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/90 text-white/50 backdrop-blur transition-all hover:text-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
