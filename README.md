<p align="center">
  <img src="public/logo.svg" alt="ClipFlow" width="120" />
</p>

<h1 align="center">ClipFlow</h1>

<p align="center">
  <strong>AI Content Creation Studio</strong><br />
  Generate videos, images, talking avatars & voiceovers from a single prompt.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-auth%20%7C%20database-green?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License" />
</p>

---

## Overview

ClipFlow is a full-stack AI studio that streamlines content creation for social media, marketing, and creative projects. It combines multiple state-of-the-art AI models behind a unified interface — no editing skills required.

### Key Capabilities

- **Text-to-Video** — Turn a prompt into polished, scroll-stopping clips
- **AI Image Generation** — Product shots, characters, and scenes with crisp text rendering
- **Talking Avatars** — Bring still images to life with natural voice and lip-sync
- **Voiceovers** — Text-to-speech via ElevenLabs and OpenAI
- **UGC Reels** — Compose influencer-style product reels end to end

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| Auth & DB | Supabase |
| Payments | Razorpay |
| AI SDK | AI SDK, OpenRouter, LangChain |
| Image Gen (local) | SDXL-Turbo (Python backend) |

### AI Models

- **Ideogram 4** — Text-to-image with excellent typography
- **FLUX.2** — Photorealistic image generation
- **LTX 2.3** — Text & image-to-video
- **LongCat Avatar** — Lip-sync talking avatars
- **ElevenLabs / OpenAI** — Voiceover generation

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+ (for local image generation)
- NVIDIA GPU with CUDA (optional, for local generation)

### Installation

```bash
git clone https://github.com/omchauhan-dev/ClipFlow.git
cd ClipFlow
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
```

### Development

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002).

### Local AI Backend (Optional)

For running image generation locally:

```bash
cd python_backend
pip install -r requirements.txt
python main.py
```

See [LOCAL_SETUP.md](./LOCAL_SETUP.md) for detailed instructions.

---

## Project Structure

```
src/
  app/          # Next.js App Router pages
  components/   # UI components (shadcn/ui + custom)
  lib/          # Utility functions, Supabase client
  hooks/        # Custom React hooks
  types/        # TypeScript type definitions
data/           # Character & content data
docs/           # Blueprint & documentation
supabase/       # Database migrations & seed
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 9002) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |

---

## GPU Backend (ComfyUI)

Manages ComfyUI workers on Modal for image/video generation.

### Deploy

```bash
modal deploy comfyui_modal.py
```

### How concurrent requests work

Only **1 GPU container** runs at a time. When you send 5 images at once, they queue on the same GPU:
- 1st request loads the model (~60s) then generates (~9s)
- Remaining 4 run immediately after, ~9s each (model already in memory)

Total: ~96s for 5 images, all on one GPU — no extra cost.

### Scale config (in `comfyui_modal.py`)

| Setting | Value | Effect |
|---------|-------|--------|
| `max_containers` | 1 | Only one GPU container at a time |
| `scaledown_window` | 300s | Container idles 5 min before shutting down |
| `min_containers` | 0 | No GPU sitting idle when unused |

---

## License

MIT