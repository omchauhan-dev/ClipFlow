'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AppHeader } from '@/components/app-header';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Download, Copy, Check, X, Search, Grid3X3,
  Image as ImageIcon, Trash2, Heart, Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LibraryImage {
  id: string;
  user_id: string;
  url: string;
  name: string;
  prompt: string;
  category: string;
  tags: string[];
  likes: number;
  created_at: string;
}

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'inspiration', label: 'Inspiration' },
  { value: 'product', label: 'Product' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'abstract', label: 'Abstract' },
  { value: 'other', label: 'Other' },
];

export default function LibraryPage() {
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<LibraryImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id);
    });
  }, []);

  const fetchImages = useCallback(async (pageNum: number, reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: '50',
        category,
      });
      const res = await fetch(`/api/library?${params}`);
      const data = await res.json();
      if (reset) {
        setImages(data.images || []);
      } else {
        setImages((prev) => [...prev, ...(data.images || [])]);
      }
      setHasMore((data.images || []).length === 50);
    } catch (error) {
      console.error('Failed to fetch library:', error);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    setPage(1);
    fetchImages(1, true);
  }, [fetchImages]);

  const handleUpload = async (file: File) => {
    if (!userId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('category', 'inspiration');
      formData.append('prompt', '');

      const res = await fetch('/api/library', { method: 'POST', body: formData });
      if (res.ok) {
        const { image } = await res.json();
        setImages((prev) => [image, ...prev]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    try {
      await fetch(`/api/library?id=${id}&userId=${userId}`, { method: 'DELETE' });
      setImages((prev) => prev.filter((img) => img.id !== id));
      if (selectedImage?.id === id) setSelectedImage(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const filteredImages = images.filter((img) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      img.name.toLowerCase().includes(q) ||
      img.prompt?.toLowerCase().includes(q) ||
      img.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Inspiration Library</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Community-uploaded images for creative inspiration
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search images..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-border/40 bg-card/50 pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <label
                className={cn(
                  "flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground cursor-pointer transition-opacity hover:bg-primary/90",
                  uploading && "opacity-50 pointer-events-none"
                )}
              >
                <Upload className="h-4 w-4" />
                {uploading ? 'Uploading...' : 'Upload'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>

          {/* Categories */}
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  category === cat.value
                    ? "bg-primary/10 text-primary"
                    : "bg-card/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading && images.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/20 mb-4">
                <Grid3X3 className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No images yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Be the first to upload something inspiring</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredImages.map((img) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative overflow-hidden rounded-xl border border-border/40 bg-card/30 shadow-lg hover:border-border hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => setSelectedImage(img)}
                >
                  <div className="aspect-square overflow-hidden bg-black/20">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                    <p className="truncate text-[10px] text-white/80 mb-2 leading-tight">
                      {img.prompt || img.name}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(img.url, '_blank');
                        }}
                        className="flex-1 rounded-md bg-white/10 backdrop-blur px-2 py-1 text-[10px] text-white hover:bg-white/20 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const a = document.createElement('a');
                          a.href = img.url;
                          a.download = img.name;
                          a.click();
                        }}
                        className="rounded-md bg-white/10 backdrop-blur p-1 text-white hover:bg-white/20 transition-colors"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(img.url);
                          setCopiedId(img.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="rounded-md bg-white/10 backdrop-blur p-1 text-white hover:bg-white/20 transition-colors"
                      >
                        {copiedId === img.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                  {img.user_id === userId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(img.id);
                      }}
                      className="absolute right-2 top-2 rounded-md bg-black/50 backdrop-blur p-1 text-white/60 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                  <div className="absolute left-2 top-2">
                    <span className="rounded-md bg-black/50 backdrop-blur px-1.5 py-0.5 text-[9px] text-white/80">
                      {img.category || 'Inspiration'}
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* Upload card */}
              <label className="group relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border/40 bg-card/10 transition-all hover:border-primary/40 hover:bg-primary/[0.02]">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/20 group-hover:bg-primary/10 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">Add image</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          )}

          {/* Load more */}
          {hasMore && images.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  fetchImages(nextPage);
                }}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Preview dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(o) => !o && setSelectedImage(null)}>
        <DialogContent className="max-w-3xl border-border/30 bg-background/95 backdrop-blur-xl p-1 shadow-2xl">
          {selectedImage && (
            <>
              <div className="overflow-hidden rounded-lg bg-black">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.name}
                  className="w-full object-contain"
                />
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{selectedImage.prompt || selectedImage.name}</p>
                  {selectedImage.tags?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedImage.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedImage.url, '_blank')}
                    className="h-8 gap-1.5 rounded-lg text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedImage.url);
                      setCopiedId(selectedImage.id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="h-8 gap-1.5 rounded-lg text-xs"
                  >
                    {copiedId === selectedImage.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy link
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
