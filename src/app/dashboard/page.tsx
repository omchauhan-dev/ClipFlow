"use client";

import { useEffect, useState, useCallback } from "react";
import { Play, Image as ImageIcon, Music, Loader2, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Content {
  id: string;
  type: "video" | "image" | "audio";
  prompt: string;
  file_url: string;
  thumbnail_url?: string;
  mode: string;
  created_at: string;
}

type Filter = "all" | "video" | "image" | "audio";

interface SessionUser {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; avatar_url?: string };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const fetchContents = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      const res = await fetch(`/api/contents?type=${filter}&limit=50`, { headers });
      const data = await res.json();
      if (data.contents) setContents(data.contents);
    } catch (err) {
      console.error("Failed to fetch contents:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace("/login");
      else setUser(session.user as SessionUser);
    });
  }, [router]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Your library</h1>
            <p className="text-sm text-muted-foreground">Everything you&apos;ve created.</p>
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="video">Video</TabsTrigger>
              <TabsTrigger value="image">Image</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
            </TabsList>
          </Tabs>
          </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : contents.length === 0 ? (
          <div className="py-20 text-center">
            <p className="mb-1 text-sm text-muted-foreground">No creations yet</p>
            <p className="text-xs text-muted-foreground/70">Start creating from a project</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {contents.map((content) => (
              <Card
                key={content.id}
                className="group relative aspect-square overflow-hidden p-0"
              >
                {content.type === "video" ? (
                  <video
                    src={content.file_url}
                    className="h-full w-full object-cover"
                    muted
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                ) : content.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={content.file_url} alt={content.prompt} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-secondary/40">
                    <Music className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md bg-background/70 text-foreground backdrop-blur">
                  {content.type === "video" ? (
                    <Play className="h-3 w-3" />
                  ) : content.type === "image" ? (
                    <ImageIcon className="h-3 w-3" />
                  ) : (
                    <Music className="h-3 w-3" />
                  )}
                </div>

                <button
                  onClick={() => window.open(content.file_url, "_blank")}
                  className={cn(
                    "absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md bg-background/70 text-foreground opacity-0 backdrop-blur transition-opacity hover:text-primary group-hover:opacity-100",
                  )}
                >
                  <Download className="h-3 w-3" />
                </button>

                <p className="absolute bottom-2 left-2 right-2 truncate text-[11px] text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100">
                  {content.prompt}
                </p>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
