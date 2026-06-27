'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, ChevronRight, Upload, Download, Play, Mic,
  Sparkles, Check, Image as ImageIcon, Video, Wand2, X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'script' | 'character' | 'video' | 'download';

interface Scene {
  visual: string;
  voiceover: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS: { id: Step; label: string; icon: string }[] = [
  { id: 'script', label: 'Script', icon: '📝' },
  { id: 'character', label: 'Character', icon: '🎭' },
  { id: 'video', label: 'Video', icon: '🎬' },
  { id: 'download', label: 'Download', icon: '⬇️' },
];

const LIGHTNING_URL = process.env.NEXT_PUBLIC_LIGHTNING_VIDEO_URL || '';

// ── Component ─────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [projectName, setProjectName] = useState('Project');
  const [activeStep, setActiveStep] = useState<Step>('script');

  // Script state
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('Hinglish');
  const [reelLength, setReelLength] = useState('30s');
  const [sceneCount, setSceneCount] = useState('5');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [scriptError, setScriptError] = useState('');

  // Character state
  const [characterImage, setCharacterImage] = useState<string | null>(null); // base64
  const [characterImageUrl, setCharacterImageUrl] = useState<string | null>(null);
  const [characterDesc, setCharacterDesc] = useState('');
  const [generatingCharacter, setGeneratingCharacter] = useState(false);
  const characterInputRef = useRef<HTMLInputElement>(null);

  // Video state
  const [generatedVideos, setGeneratedVideos] = useState<Record<number, string>>({});
  const [generatingVideo, setGeneratingVideo] = useState<Record<number, boolean>>({});
  const [generatedVoiceovers, setGeneratedVoiceovers] = useState<Record<number, string>>({});
  const [generatingVoiceover, setGeneratingVoiceover] = useState<Record<number, boolean>>({});
  const [videoErrors, setVideoErrors] = useState<Record<number, string>>({});

  // Download state
  const [stitching, setStitching] = useState(false);
  const [finalReel, setFinalReel] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    supabase.from('projects').select('name').eq('id', projectId).single()
      .then(({ data }) => { if (data?.name) setProjectName(data.name); });
  }, [projectId]);

  // Keep Lightning warm
  useEffect(() => {
    fetch('/api/keepalive');
    const interval = setInterval(() => fetch('/api/keepalive'), 120000);
    return () => clearInterval(interval);
  }, []);

  // ── Step helpers ─────────────────────────────────────────────────────────

  function isStepDone(step: Step): boolean {
    if (step === 'script') return scenes.length > 0;
    if (step === 'character') return !!characterImage;
    if (step === 'video') return Object.keys(generatedVideos).length === scenes.length && scenes.length > 0;
    if (step === 'download') return !!finalReel;
    return false;
  }

  function isStepLocked(step: Step): boolean {
    if (step === 'script') return false;
    if (step === 'character') return !isStepDone('script');
    if (step === 'video') return !isStepDone('character');
    if (step === 'download') return Object.keys(generatedVideos).length === 0;
    return false;
  }

  function getStepStatus(step: Step) {
    if (isStepDone(step)) return 'done';
    if (activeStep === step) return 'active';
    if (isStepLocked(step)) return 'locked';
    return 'idle';
  }

  // ── Script generation ─────────────────────────────────────────────────────

  async function generateScript() {
    if (!topic.trim() || generatingScript) return;
    setGeneratingScript(true);
    setScriptError('');
    try {
      const res = await fetch('/api/generate-reel-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectMatter: topic,
          reelLength,
          language,
          sceneCount,
        }),
      });
      if (!res.ok) throw new Error('Failed to generate script');
      const data = await res.json();
      if (data.scenes?.length > 0) {
        setScenes(data.scenes);
        setActiveStep('character');
      }
    } catch (err: any) {
      setScriptError(err.message || 'Failed');
    } finally {
      setGeneratingScript(false);
    }
  }

  // ── Character image ───────────────────────────────────────────────────────

  function handleCharacterUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = (ev.target?.result as string).split(',')[1];
      setCharacterImage(b64);
      setCharacterImageUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function generateCharacterImage() {
    if (!characterDesc.trim() || generatingCharacter) return;
    setGeneratingCharacter(true);
    try {
      const res = await fetch('/api/generate-character-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: characterDesc }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setCharacterImage(data.image_base64);
      setCharacterImageUrl(`data:image/png;base64,${data.image_base64}`);
    } catch (err: any) {
      console.error(err);
    } finally {
      setGeneratingCharacter(false);
    }
  }

  // ── Video generation ──────────────────────────────────────────────────────

  async function generateSceneVideo(index: number) {
    const scene = scenes[index];
    if (!scene?.visual || generatingVideo[index]) return;
    setGeneratingVideo(prev => ({ ...prev, [index]: true }));
    setVideoErrors(prev => ({ ...prev, [index]: '' }));
    try {
      const body: any = {
        prompt: scene.visual,
        duration: 3,
      };
      if (characterImage) {
        body.character_image_base64 = characterImage;
      }

      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed'); }
      const blob = await res.blob();
      setGeneratedVideos(prev => ({ ...prev, [index]: URL.createObjectURL(blob) }));
    } catch (err: any) {
      setVideoErrors(prev => ({ ...prev, [index]: err.message }));
    } finally {
      setGeneratingVideo(prev => ({ ...prev, [index]: false }));
    }
  }

  async function generateAllVideos() {
    for (let i = 0; i < scenes.length; i++) {
      if (!generatedVideos[i]) await generateSceneVideo(i);
    }
    setActiveStep('download');
  }

  async function generateVoiceover(index: number) {
    const scene = scenes[index];
    if (!scene?.voiceover || generatingVoiceover[index]) return;
    setGeneratingVoiceover(prev => ({ ...prev, [index]: true }));
    try {
      const res = await fetch('/api/generate-voiceover', {
        method: 'POST',
        body: JSON.stringify({ text: scene.voiceover }),
      });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      setGeneratedVoiceovers(prev => ({ ...prev, [index]: URL.createObjectURL(blob) }));
    } catch (e) { console.error(e); }
    finally { setGeneratingVoiceover(prev => ({ ...prev, [index]: false })); }
  }

  // ── Stitch final reel ─────────────────────────────────────────────────────

  async function stitchFinalReel() {
    if (stitching) return;
    setStitching(true);
    try {
      const formData = new FormData();

      // Fetch and append each scene video
      for (let i = 0; i < scenes.length; i++) {
        if (generatedVideos[i]) {
          const res = await fetch(generatedVideos[i]);
          const blob = await res.blob();
          formData.append('videos', blob, `scene_${i}.mp4`);
        }
      }

      // Fetch and append each voiceover
      for (let i = 0; i < scenes.length; i++) {
        if (generatedVoiceovers[i]) {
          const res = await fetch(generatedVoiceovers[i]);
          const blob = await res.blob();
          formData.append('audios', blob, `audio_${i}.mp3`);
        }
      }

      const res = await fetch('/api/stitch-reel', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Stitch failed');
      const blob = await res.blob();
      setFinalReel(URL.createObjectURL(blob));
    } catch (err: any) {
      console.error(err);
    } finally {
      setStitching(false);
    }
  }

  const videosReady = Object.keys(generatedVideos).length;
  const allVideosReady = videosReady === scenes.length && scenes.length > 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');
        .pipeline-root { font-family: 'DM Sans', sans-serif; min-height: 100vh; background: #080c10; color: #e0f4f0; }
        .pipeline-wrap { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
        .breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #2d4a44; margin-bottom: 24px; }
        .breadcrumb button { background: none; border: none; color: #2d4a44; cursor: pointer; font-family: inherit; font-size: 12px; padding: 0; transition: color 0.15s; }
        .breadcrumb button:hover { color: #2dd4bf; }
        .breadcrumb .active { color: #2dd4bf; font-weight: 500; }
        .page-title { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 700; color: #f0f4ff; letter-spacing: -0.02em; margin-bottom: 4px; }
        .page-sub { font-size: 13px; color: #4a6860; margin-bottom: 28px; }

        /* Step progress */
        .steps-row { display: flex; align-items: center; margin-bottom: 28px; }
        .step-item { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; position: relative; cursor: pointer; }
        .step-item:not(:last-child)::after { content: ''; position: absolute; top: 16px; left: calc(50% + 16px); right: calc(-50% + 16px); height: 1px; background: #1e2a3a; }
        .step-item.done:not(:last-child)::after { background: #2dd4bf44; }
        .step-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; border: 1px solid #1e2a3a; background: #080c10; transition: all 0.2s; }
        .step-circle.done { background: #071c1a; border-color: #2dd4bf; color: #2dd4bf; }
        .step-circle.active { background: #0e3d38; border-color: #2dd4bf; box-shadow: 0 0 10px #2dd4bf33; }
        .step-circle.locked { opacity: 0.3; }
        .step-label { font-size: 10px; font-weight: 600; color: #4a6860; text-transform: uppercase; letter-spacing: 0.08em; }
        .step-label.active { color: #2dd4bf; }
        .step-label.done { color: #2dd4bf; }

        /* Cards */
        .step-card { background: #0d1117; border: 1px solid #1e2a3a; border-radius: 16px; padding: 20px; margin-bottom: 16px; }
        .step-card.active-card { border-color: #2dd4bf33; }
        .step-card-title { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 700; color: #f0f4ff; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
        .step-card-sub { font-size: 12px; color: #4a6860; margin-bottom: 16px; }
        .done-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #071c1a; color: #2dd4bf; border: 1px solid #2dd4bf33; }
        .locked-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #1e2a3a; color: #374151; }

        /* Form elements */
        .cf-label { font-size: 11px; font-weight: 600; color: #4a6860; letter-spacing: 0.06em; margin-bottom: 5px; display: block; }
        .cf-input { width: 100%; background: #070a0f; border: 1px solid #1e2a3a; border-radius: 8px; color: #c8d6e5; font-family: 'DM Sans', sans-serif; font-size: 13px; padding: 9px 11px; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
        .cf-input:focus { border-color: #2dd4bf44; }
        .cf-input::placeholder { color: #1e2a3a; }
        .cf-textarea { width: 100%; background: #070a0f; border: 1px solid #1e2a3a; border-radius: 8px; color: #c8d6e5; font-family: 'DM Sans', sans-serif; font-size: 13px; padding: 9px 11px; outline: none; transition: border-color 0.15s; box-sizing: border-box; resize: none; line-height: 1.5; }
        .cf-textarea:focus { border-color: #2dd4bf44; }
        .cf-select { width: 100%; background: #070a0f; border: 1px solid #1e2a3a; border-radius: 8px; color: #c8d6e5; font-family: 'DM Sans', sans-serif; font-size: 13px; padding: 9px 11px; outline: none; appearance: none; cursor: pointer; }
        .cf-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 14px; }
        .cf-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .cf-field { display: flex; flex-direction: column; gap: 5px; }
        .cf-field.full { grid-column: 1/-1; }

        /* Buttons */
        .btn-primary { display: flex; align-items: center; justify-content: center; gap: 7px; width: 100%; height: 44px; background: #0e3d38; border: 1px solid #2dd4bf44; border-radius: 10px; color: #2dd4bf; font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
        .btn-primary:hover { background: #0f4a44; border-color: #2dd4bf; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-outline { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border-radius: 8px; border: 1px solid #1e2a3a; background: #080c10; color: #6b7a90; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .btn-outline:hover { border-color: #2dd4bf44; color: #2dd4bf; }
        .btn-outline:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-upload { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 80px; border: 1px dashed #1e2a3a; border-radius: 10px; background: #070a0f; color: #4a6860; font-size: 13px; cursor: pointer; transition: all 0.15s; }
        .btn-upload:hover { border-color: #2dd4bf44; color: #2dd4bf; }

        /* Character image preview */
        .char-img-wrap { position: relative; width: 100%; }
        .char-img { width: 100%; max-height: 200px; object-fit: cover; border-radius: 10px; border: 1px solid #2dd4bf33; display: block; }
        .char-img-remove { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; border-radius: 50%; background: #080c10; border: 1px solid #1e2a3a; color: #6b7a90; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .char-img-remove:hover { border-color: #ef4444; color: #ef4444; }
        .or-divider { display: flex; align-items: center; gap: 10px; margin: 12px 0; font-size: 11px; color: #2d4a44; }
        .or-divider::before, .or-divider::after { content: ''; flex: 1; height: 1px; background: #1e2a3a; }

        /* Scene grid */
        .scenes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .scene-card { background: #070a0f; border: 1px solid #1e2a3a; border-radius: 10px; overflow: hidden; transition: border-color 0.2s; }
        .scene-card.has-video { border-color: #2dd4bf33; }
        .scene-card-header { padding: 10px 12px; border-bottom: 1px solid #1e2a3a; display: flex; align-items: center; justify-content: space-between; }
        .scene-num { font-family: 'Sora', sans-serif; font-size: 10px; font-weight: 700; color: #2dd4bf; letter-spacing: 0.1em; text-transform: uppercase; }
        .scene-status { display: flex; gap: 4px; }
        .sdot { width: 6px; height: 6px; border-radius: 50%; }
        .scene-card-body { padding: 10px 12px; }
        .scene-visual { font-size: 11px; color: #4a6860; line-height: 1.4; margin-bottom: 8px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .scene-video { width: 100%; display: block; max-height: 120px; object-fit: cover; }
        .scene-actions { display: flex; gap: 5px; margin-top: 8px; }
        .scene-btn { display: inline-flex; align-items: center; gap: 4px; height: 24px; padding: 0 8px; border-radius: 5px; border: 1px solid #1e2a3a; background: #080c10; color: #4a6860; font-size: 10px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
        .scene-btn:hover { border-color: #2dd4bf44; color: #2dd4bf; }
        .scene-btn.primary { background: #071c1a; border-color: #2dd4bf44; color: #2dd4bf; }
        .scene-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .gen-progress { font-size: 11px; color: #4a6860; text-align: center; padding: 12px; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        /* Final reel */
        .final-video { width: 100%; border-radius: 10px; border: 1px solid #2dd4bf33; display: block; margin-bottom: 14px; }
        .download-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 48px; background: linear-gradient(135deg, #0e3d38, #0a2e2a); border: 1px solid #2dd4bf; border-radius: 12px; color: #2dd4bf; font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; transition: all 0.15s; }
        .download-btn:hover { background: linear-gradient(135deg, #0f4a44, #0d3830); }
        .error-text { font-size: 11px; color: #f87171; margin-top: 5px; }
      `}</style>

      <div className="pipeline-root">
        <div className="pipeline-wrap">

          {/* Breadcrumb */}
          <div className="breadcrumb">
            <button onClick={() => router.push('/projects')}>Home</button>
            <ChevronRight size={12} />
            <button onClick={() => router.push(`/studio/${projectId}`)}>{projectName}</button>
            <ChevronRight size={12} />
            <span className="active">Create Reel</span>
          </div>

          <div className="page-title">Create Your Reel</div>
          <div className="page-sub">Script → Character → Video → Download</div>

          {/* Steps progress bar */}
          <div className="steps-row">
            {STEPS.map((step) => {
              const status = getStepStatus(step.id);
              return (
                <div
                  key={step.id}
                  className={`step-item ${status}`}
                  onClick={() => !isStepLocked(step.id) && setActiveStep(step.id)}
                >
                  <div className={`step-circle ${status}`}>
                    {status === 'done' ? <Check size={14} /> : step.icon}
                  </div>
                  <span className={`step-label ${status}`}>{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* ── STEP 1: SCRIPT ── */}
          <div className={`step-card ${activeStep === 'script' ? 'active-card' : ''}`}>
            <div className="step-card-title">
              📝 Script Generation
              {isStepDone('script') && <span className="done-badge">✓ Done — {scenes.length} scenes</span>}
            </div>
            <div className="step-card-sub">What's your reel about?</div>

            {activeStep === 'script' && (
              <div>
                <div className="cf-field" style={{ marginBottom: 12 }}>
                  <label className="cf-label">Topic</label>
                  <textarea
                    className="cf-textarea"
                    rows={2}
                    placeholder="e.g. a chai cup explaining morning habits in Hinglish..."
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                  />
                </div>
                <div className="cf-grid">
                  <div className="cf-field">
                    <label className="cf-label">Language</label>
                    <select className="cf-select" value={language} onChange={e => setLanguage(e.target.value)}>
                      <option value="Hinglish">Hinglish</option>
                      <option value="Hindi">Hindi</option>
                      <option value="English">English</option>
                    </select>
                  </div>
                  <div className="cf-field">
                    <label className="cf-label">Length</label>
                    <select className="cf-select" value={reelLength} onChange={e => setReelLength(e.target.value)}>
                      <option value="15s">15 sec</option>
                      <option value="30s">30 sec</option>
                      <option value="60s">60 sec</option>
                    </select>
                  </div>
                  <div className="cf-field">
                    <label className="cf-label">Scenes</label>
                    <select className="cf-select" value={sceneCount} onChange={e => setSceneCount(e.target.value)}>
                      <option value="3">3</option>
                      <option value="5">5</option>
                      <option value="7">7</option>
                      <option value="10">10</option>
                    </select>
                  </div>
                </div>
                {scriptError && <p className="error-text">{scriptError}</p>}
                <button className="btn-primary" onClick={generateScript} disabled={generatingScript || !topic.trim()}>
                  {generatingScript ? <><Loader2 size={15} className="animate-spin" />Generating script...</> : <><Sparkles size={15} />Generate Script</>}
                </button>
              </div>
            )}

            {/* Script preview when done */}
            {isStepDone('script') && activeStep !== 'script' && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {scenes.slice(0, 3).map((s, i) => (
                  <span key={i} style={{ fontSize: 11, color: '#4a6860', background: '#070a0f', border: '1px solid #1e2a3a', borderRadius: 6, padding: '3px 8px' }}>
                    Scene {i + 1}
                  </span>
                ))}
                {scenes.length > 3 && <span style={{ fontSize: 11, color: '#4a6860' }}>+{scenes.length - 3} more</span>}
                <button className="btn-outline" style={{ height: 24, fontSize: 10 }} onClick={() => setActiveStep('script')}>Edit</button>
              </div>
            )}
          </div>

          {/* ── STEP 2: CHARACTER ── */}
          <div className={`step-card ${activeStep === 'character' ? 'active-card' : ''} ${isStepLocked('character') ? '' : ''}`}>
            <div className="step-card-title">
              🎭 Character
              {isStepDone('character') && <span className="done-badge">✓ Ready</span>}
              {isStepLocked('character') && <span className="locked-badge">🔒 Complete script first</span>}
            </div>
            <div className="step-card-sub">Upload your character image or generate one with AI</div>

            {activeStep === 'character' && !isStepLocked('character') && (
              <div>
                {characterImageUrl ? (
                  <div className="char-img-wrap" style={{ marginBottom: 12 }}>
                    <img src={characterImageUrl} alt="Character" className="char-img" />
                    <button className="char-img-remove" onClick={() => { setCharacterImage(null); setCharacterImageUrl(null); }}>
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Upload */}
                    <input
                      ref={characterInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleCharacterUpload}
                    />
                    <div className="btn-upload" onClick={() => characterInputRef.current?.click()}>
                      <Upload size={16} />
                      Upload your character image (JPG, PNG)
                    </div>

                    <div className="or-divider">or generate with AI</div>

                    {/* Generate */}
                    <div className="cf-field" style={{ marginBottom: 10 }}>
                      <label className="cf-label">Describe your character</label>
                      <input
                        className="cf-input"
                        placeholder="e.g. a friendly chai cup with big eyes, Pixar style..."
                        value={characterDesc}
                        onChange={e => setCharacterDesc(e.target.value)}
                      />
                    </div>
                    <button className="btn-primary" onClick={generateCharacterImage} disabled={generatingCharacter || !characterDesc.trim()}>
                      {generatingCharacter ? <><Loader2 size={15} className="animate-spin" />Generating...</> : <><Wand2 size={15} />Generate Character Image</>}
                    </button>
                  </>
                )}

                {characterImageUrl && (
                  <button
                    className="btn-primary"
                    style={{ marginTop: 10 }}
                    onClick={() => setActiveStep('video')}
                  >
                    <Check size={15} /> Use this character →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── STEP 3: VIDEO ── */}
          <div className={`step-card ${activeStep === 'video' ? 'active-card' : ''}`}>
            <div className="step-card-title">
              🎬 Video Generation
              {allVideosReady && <span className="done-badge">✓ {videosReady}/{scenes.length} ready</span>}
              {isStepLocked('video') && <span className="locked-badge">🔒 Complete character first</span>}
            </div>
            <div className="step-card-sub">Generate video clips for each scene with your character</div>

            {activeStep === 'video' && !isStepLocked('video') && scenes.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#4a6860' }}>{videosReady} of {scenes.length} videos ready</span>
                  <button className="btn-outline" onClick={generateAllVideos} disabled={Object.values(generatingVideo).some(Boolean)}>
                    <Play size={11} /> Generate all videos
                  </button>
                </div>

                <div className="scenes-grid">
                  {scenes.map((scene, index) => (
                    <div key={index} className={`scene-card ${generatedVideos[index] ? 'has-video' : ''}`}>
                      <div className="scene-card-header">
                        <span className="scene-num">Scene {String(index + 1).padStart(2, '0')}</span>
                        <div className="scene-status">
                          {generatedVoiceovers[index] && <div className="sdot" style={{ background: '#a78bfa' }} />}
                          {generatedVideos[index] && <div className="sdot" style={{ background: '#2dd4bf' }} />}
                        </div>
                      </div>
                      <div className="scene-card-body">
                        {generatedVideos[index] ? (
                          <video src={generatedVideos[index]} controls loop className="scene-video" style={{ borderRadius: 6 }} />
                        ) : (
                          <p className="scene-visual">{scene.visual}</p>
                        )}
                        {videoErrors[index] && <p className="error-text">{videoErrors[index]}</p>}
                        <div className="scene-actions">
                          <button className="scene-btn" onClick={() => generateVoiceover(index)} disabled={generatingVoiceover[index] || !scene.voiceover}>
                            {generatingVoiceover[index] ? <Loader2 size={9} className="animate-spin" /> : <Mic size={9} />}
                            Voice
                          </button>
                          {generatedVoiceovers[index] && (
                            <audio controls src={generatedVoiceovers[index]} style={{ height: 20, flex: 1 }} />
                          )}
                          {!generatedVideos[index] && (
                            <button className="scene-btn primary" onClick={() => generateSceneVideo(index)} disabled={generatingVideo[index]}>
                              {generatingVideo[index] ? <Loader2 size={9} className="animate-spin pulse" /> : <Play size={9} />}
                              {generatingVideo[index] ? 'Generating...' : 'Generate'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {allVideosReady && (
                  <button className="btn-primary" style={{ marginTop: 14 }} onClick={() => setActiveStep('download')}>
                    <Download size={15} /> Proceed to Download →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── STEP 4: DOWNLOAD ── */}
          <div className={`step-card ${activeStep === 'download' ? 'active-card' : ''}`}>
            <div className="step-card-title">
              ⬇️ Download Reel
              {isStepLocked('download') && <span className="locked-badge">🔒 Generate videos first</span>}
            </div>
            <div className="step-card-sub">Stitch all scenes into one final reel with voiceover</div>

            {activeStep === 'download' && !isStepLocked('download') && (
              <div>
                {finalReel ? (
                  <>
                    <video src={finalReel} controls className="final-video" />
                    <a href={finalReel} download="clipflow-reel.mp4" className="download-btn">
                      <Download size={18} /> Download Final Reel (MP4)
                    </a>
                  </>
                ) : (
                  <>
                    <div style={{ background: '#070a0f', border: '1px solid #1e2a3a', borderRadius: 10, padding: 16, marginBottom: 14 }}>
                      <div style={{ fontSize: 12, color: '#4a6860', marginBottom: 8 }}>Reel summary</div>
                      <div style={{ fontSize: 13, color: '#c8d6e5' }}>{scenes.length} scenes · {videosReady} videos ready · {Object.keys(generatedVoiceovers).length} voiceovers</div>
                    </div>
                    <button className="btn-primary" onClick={stitchFinalReel} disabled={stitching || videosReady === 0}>
                      {stitching
                        ? <><Loader2 size={15} className="animate-spin" />Stitching reel...</>
                        : <><Video size={15} />Create Final Reel</>
                      }
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}