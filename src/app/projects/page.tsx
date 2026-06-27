'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Plus, Clock, Trash2, Video, Wand2, ArrowRight, Loader2,
  Sparkles, FolderOpen, Film,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AppHeader } from '@/components/app-header';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Project {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface ActiveJob {
  project_id: string;
  prompt: string;
}

interface SessionUser {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; avatar_url?: string };
}

export default function ProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const fetchProjects = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (!error && data) setProjects(data);
    setLoading(false);
  }, []);

  const fetchCredits = useCallback(async (userId: string) => {
    const { data } = await supabase.from('profiles').select('credits_balance').eq('id', userId).single();
    setCredits(data?.credits_balance ?? 0);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
      } else {
        setUser(session.user as SessionUser);
        fetchProjects(session.user.id);
        fetchCredits(session.user.id);
      }
    });
  }, [router, fetchProjects, fetchCredits]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('jobs')
        .select('project_id, prompt')
        .eq('user_id', user.id)
        .eq('status', 'processing');
      setActiveJobs(data || []);
    }, 3000);
    return () => clearInterval(interval);
  }, [user]);

  function activeJobFor(projectId: string) {
    return activeJobs.find((j) => j.project_id === projectId);
  }

  async function createProject() {
    if (!projectName.trim() || !user) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user.id, name: projectName.trim() })
      .select()
      .single();
    if (!error && data) {
      setShowModal(false);
      setProjectName('');
      router.push(`/studio/${data.id}`);
    }
    setCreating(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await supabase.from('projects').delete().eq('id', deleteTarget.id);
    setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  function formatDate(date: string) {
    const d = new Date(date);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader user={user} credits={credits} onNewProject={() => setShowModal(true)} />

      {/* Decorative background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/8 blur-[150px]" />
        <div className="absolute top-60 -left-40 h-[300px] w-[300px] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 backdrop-blur px-3.5 py-1 text-xs text-muted-foreground mb-4">
            <Sparkles className="h-3 w-3 text-primary" />
            AI Studio
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">Your projects</h1>
          <p className="mx-auto max-w-lg text-muted-foreground text-sm">
            Generate videos, images, and talking avatars. Start a project to begin.
          </p>
        </motion.div>

        {/* Quick create */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <button
            onClick={() => setShowModal(true)}
            className="group mx-auto mb-14 block w-full max-w-xl rounded-2xl border border-border/40 bg-gradient-to-b from-card/50 to-card/10 backdrop-blur p-5 text-left transition-all hover:border-primary/30 hover:from-card/70 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 transition-all group-hover:scale-110 group-hover:shadow-md group-hover:shadow-primary/10">
                <Wand2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Start a new project</p>
                <p className="text-xs text-muted-foreground">Text to Video · Image to Video · AI Images · Talking Avatar</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
          </button>
        </motion.div>

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && projects.length > 0 && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="mx-auto max-w-5xl"
          >
            <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              <FolderOpen className="h-3.5 w-3.5" />
              Recent projects
              <span className="ml-auto text-[11px] font-normal normal-case tracking-normal text-muted-foreground/50">{projects.length} project{projects.length > 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
                const job = activeJobFor(project.id);
                return (
                  <motion.div key={project.id} variants={item}>
                    <Card
                      onClick={() => router.push(`/studio/${project.id}`)}
                      className={cn(
                        'group cursor-pointer overflow-hidden border-border/40 bg-gradient-to-b from-card/60 to-card/10 backdrop-blur-sm p-0 transition-all hover:shadow-xl hover:shadow-black/20',
                        job ? 'border-primary/30 ring-1 ring-primary/10' : 'hover:border-border/60'
                      )}
                    >
                      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-secondary/40 to-secondary/10">
                        {job ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            </div>
                            <p className="text-[10px] font-medium text-primary">Generating now</p>
                          </div>
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(255,255,255,0.01)_8px,rgba(255,255,255,0.01)_16px)]" />
                            <Film className="h-8 w-8 text-muted-foreground/20 transition-all group-hover:scale-110 group-hover:text-muted-foreground/40" />
                          </>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-semibold">{project.name}</h3>
                            {job ? (
                              <p className="mt-1 truncate text-[11px] text-primary/80">{job.prompt.slice(0, 40)}...</p>
                            ) : (
                              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/60">
                                <Clock className="h-3 w-3" />
                                {formatDate(project.updated_at)}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(project);
                            }}
                            className="rounded-lg p-1.5 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {!loading && projects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 mb-5">
              <FolderOpen className="h-7 w-7 text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Create your first project and start generating with AI.
            </p>
            <Button onClick={() => setShowModal(true)} className="gap-2 rounded-xl shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              New project
            </Button>
          </motion.div>
        )}
      </main>

      {/* Create modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md border-border/30 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-center text-lg">New project</DialogTitle>
            <DialogDescription className="text-center">Name your project to get started.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createProject()}
            className="h-11 bg-card/50 border-border/50 focus:border-primary/40 rounded-xl"
            autoFocus
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowModal(false)} className="rounded-xl border-border/50">
              Cancel
            </Button>
            <Button onClick={createProject} disabled={!projectName.trim() || creating} className="gap-1.5 rounded-xl shadow-sm shadow-primary/20">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="border-border/30 bg-background/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">Delete project?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This will permanently delete &ldquo;{deleteTarget?.name}&rdquo; and its generations. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl border-border/50">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm shadow-destructive/20"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
