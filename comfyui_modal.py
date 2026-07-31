import modal
import os

comfyui_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git", "ffmpeg", "libgl1", "libglib2.0-0", "wget", "curl")
    .pip_install(
        "torch>=2.5.0", "torchvision>=0.20.0", "torchaudio>=2.5.0",
        index_url="https://download.pytorch.org/whl/cu124",
    )
    .run_commands(
        "git clone --depth 1 --branch v0.26.0 https://github.com/comfyanonymous/ComfyUI.git /comfyui",
        "cd /comfyui && pip install -r requirements.txt",
        "cd /comfyui/custom_nodes && git clone https://github.com/Lightricks/ComfyUI-LTXVideo.git",
        "cd /comfyui/custom_nodes/ComfyUI-LTXVideo && pip install -r requirements.txt 2>/dev/null || true",
        "cd /comfyui/custom_nodes && git clone https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git",
        "cd /comfyui/custom_nodes/ComfyUI-VideoHelperSuite && pip install -r requirements.txt 2>/dev/null || true",
        # EdgeTTS — free Microsoft TTS, no API key needed
        "cd /comfyui/custom_nodes && git clone https://github.com/1038lab/ComfyUI-EdgeTTS.git",
        "cd /comfyui/custom_nodes/ComfyUI-EdgeTTS && pip install -r requirements.txt 2>/dev/null || true",
    )
    .pip_install("boto3", "requests", "fastapi[standard]", "huggingface-hub>=0.30.0",
                 "hf_transfer", "Pillow", "imageio[ffmpeg]", "mako", "regex")
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1", "HF_HOME": "/models_cache/hf",
          "FORCE_REBUILD": "2026-07-26-krea2-basic-scheduler-fix"})
)

WORKFLOWS_DIR = "/workflows"

# Embedded workflow templates — used when add_local_dir mount is stale
_EMBEDDED_WORKFLOWS = {
    "flux2_t2i.json": {
        "4": {"inputs": {"unet_name": "flux2_dev_fp8mixed.safetensors", "weight_dtype": "default"}, "class_type": "UNETLoader"},
        "11": {"inputs": {"clip_name": "mistral_3_small_flux2_bf16.safetensors", "type": "ltxv"}, "class_type": "CLIPLoader"},
        "3": {"inputs": {"vae_name": "flux2-vae.safetensors"}, "class_type": "VAELoader"},
        "98:6": {"inputs": {"text": "", "clip": ["11", 0]}, "class_type": "CLIPTextEncode"},
        "8": {"inputs": {"text": "bad quality, blurry", "clip": ["11", 0]}, "class_type": "CLIPTextEncode"},
        "98:47": {"inputs": {"width": 768, "height": 1024, "batch_size": 1}, "class_type": "EmptyLatentImage"},
        "5": {"inputs": {"model": ["4", 0], "positive": ["98:6", 0], "negative": ["8", 0], "latent_image": ["98:47", 0], "seed": 42, "steps": 20, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0}, "class_type": "KSampler"},
        "10": {"inputs": {"samples": ["5", 0], "vae": ["3", 0]}, "class_type": "VAEDecode"},
        "9": {"inputs": {"filename_prefix": "flux2", "images": ["10", 0]}, "class_type": "SaveImage"},
    },
    "ideogram4_t2i.json": {
        "14": {"inputs": {"clip_name": "qwen3vl_8b_fp8_scaled.safetensors", "type": "ideogram4"}, "class_type": "CLIPLoader"},
        "9": {"inputs": {"vae_name": "flux2-vae.safetensors"}, "class_type": "VAELoader"},
        "23": {"inputs": {"unet_name": "ideogram4_fp8_scaled.safetensors", "weight_dtype": "default"}, "class_type": "UNETLoader"},
        "154": {"inputs": {"unet_name": "ideogram4_unconditional_fp8_scaled.safetensors", "weight_dtype": "default"}, "class_type": "UNETLoader"},
        "24": {"inputs": {"text": "", "clip": ["14", 0]}, "class_type": "CLIPTextEncode"},
        "10": {"inputs": {"conditioning": ["24", 0]}, "class_type": "ConditioningZeroOut"},
        "11": {"inputs": {"width": 1024, "height": 1024, "batch_size": 1}, "class_type": "EmptyFlux2LatentImage"},
        "18": {"inputs": {"noise_seed": 42}, "class_type": "RandomNoise"},
        "16": {"inputs": {"sampler_name": "euler"}, "class_type": "KSamplerSelect"},
        "17": {"inputs": {"steps": 20, "width": 1024, "height": 1024, "mu": 0.0, "std": 1.75}, "class_type": "Ideogram4Scheduler"},
        "156": {"inputs": {"model": ["23", 0], "conditioning": ["24", 0]}, "class_type": "BasicGuider"},
        "157": {"inputs": {"model": ["154", 0], "conditioning": ["10", 0]}, "class_type": "BasicGuider"},
        "12": {"inputs": {"noise": ["18", 0], "guider": ["156", 0], "sampler": ["16", 0], "sigmas": ["17", 0], "latent_image": ["11", 0]}, "class_type": "SamplerCustomAdvanced"},
        "13": {"inputs": {"samples": ["12", 0], "vae": ["9", 0]}, "class_type": "VAEDecode"},
        "158": {"inputs": {"filename_prefix": "ideogram4", "images": ["13", 0]}, "class_type": "SaveImage"},
    },
        "krea2_t2i.json": {
        "4": {"inputs": {"unet_name": "krea2_turbo_fp8_scaled.safetensors", "weight_dtype": "default"}, "class_type": "UNETLoader"},
        "200": {"inputs": {"clip_name": "qwen3vl_4b_fp8_scaled.safetensors", "type": "krea2"}, "class_type": "CLIPLoader"},
        "3": {"inputs": {"vae_name": "qwen_image_vae.safetensors"}, "class_type": "VAELoader"},
        "98:1": {"inputs": {"text": "", "clip": ["200", 0]}, "class_type": "CLIPTextEncode"},
        "98:2": {"inputs": {"width": 1024, "height": 1024, "batch_size": 1}, "class_type": "EmptyLatentImage"},
        "18": {"inputs": {"noise_seed": 42}, "class_type": "RandomNoise"},
        "16": {"inputs": {"sampler_name": "er_sde"}, "class_type": "KSamplerSelect"},
        "17": {"inputs": {"model": ["4", 0], "scheduler": "simple", "steps": 8, "denoise": 1.0}, "class_type": "BasicScheduler"},
        "156": {"inputs": {"model": ["4", 0], "conditioning": ["98:1", 0]}, "class_type": "BasicGuider"},
        "12": {"inputs": {"noise": ["18", 0], "guider": ["156", 0], "sampler": ["16", 0], "sigmas": ["17", 0], "latent_image": ["98:2", 0]}, "class_type": "SamplerCustomAdvanced"},
        "13": {"inputs": {"samples": ["12", 0], "vae": ["3", 0]}, "class_type": "VAEDecode"},
        "9": {"inputs": {"filename_prefix": "krea2", "images": ["13", 0]}, "class_type": "SaveImage"},
    },
}


def _build_workflow(model: str, req: dict):
    """Turn simple params {model, prompt, width, height, num_frames, ...} into a
    patched ComfyUI workflow graph. Returns (workflow_dict, output_ext).

    Templates (bundled at /workflows):
      - flux2_t2i.json   : FLUX.2 text-to-image
      - ltx_t2v.json     : LTX-2.3 text-to-video (with audio branch)
      - ltx_id_lora.json : LTX-2.3 ID-LoRA audio-driven lip-sync (close-up)
    """
    import json, os, random

    model = (model or "").lower().strip()
    IMAGE_MODELS = {"flux", "flux1", "flux2", "flux-2", "image"}
    KREA_MODELS = {"krea2", "krea-2", "krea", "krea2-turbo", "krea2turbo"}
    IDEOGRAM_MODELS = {"ideogram4", "ideogram", "ideogram-4", "ig4"}
    LIPSYNC_MODELS = {"ltx-id-lora", "id-lora", "idlora", "lipsync", "lip-sync",
                      "talking", "avatar-closeup"}
    I2V_MODELS = {"ltx-i2v", "i2v", "image-to-video", "ltx-2.3-i2v", "ltx-image"}
    # everything else (ltx, ltx-2.3, wan, hunyuan, t2v, video) -> text-to-video

    prompt = req.get("prompt", "")
    seed = int(req.get("seed") or 0) or random.randint(1, 2_000_000_000)
    fps = int(req.get("fps") or 25)

    def _load(name):
        import json as _json, os as _os
        # Try file first, fall back to embedded templates
        fpath = os.path.join(WORKFLOWS_DIR, name)
        if _os.path.exists(fpath):
            with open(fpath, encoding="utf-8") as f:
                return _json.load(f)
        # Embedded fallback (used when add_local_dir is not mounted)
        return _EMBEDDED_WORKFLOWS[name]

    # ── Ideogram 4 text-to-image ──
    if model in IDEOGRAM_MODELS:
        width = int(req.get("width") or 1024)
        height = int(req.get("height") or 1024)
        steps = int(req.get("steps") or 20)
        wf = _load("ideogram4_t2i.json")
        wf["24"]["inputs"]["text"] = prompt
        wf["11"]["inputs"]["width"] = width
        wf["11"]["inputs"]["height"] = height
        wf["17"]["inputs"]["width"] = width
        wf["17"]["inputs"]["height"] = height
        wf["17"]["inputs"]["steps"] = steps
        wf["18"]["inputs"]["noise_seed"] = seed
        # Preset-based mu/std: Quality=0.0/1.5 (48 steps), Default=0.0/1.75 (20 steps), Turbo=0.5/1.75 (12 steps)
        if steps >= 48:
            wf["17"]["inputs"]["mu"] = 0.0
            wf["17"]["inputs"]["std"] = 1.5
        elif steps <= 12:
            wf["17"]["inputs"]["mu"] = 0.5
            wf["17"]["inputs"]["std"] = 1.75
        else:
            wf["17"]["inputs"]["mu"] = 0.0
            wf["17"]["inputs"]["std"] = 1.75
        wf["158"]["inputs"]["filename_prefix"] = req.get("filename_prefix", "ideogram4")
        return wf, "png"

    # ── FLUX.2 text-to-image ──
    if model in IMAGE_MODELS:
        width = int(req.get("width") or 768)
        height = int(req.get("height") or 1024)
        wf = _load("flux2_t2i.json")
        wf["98:6"]["inputs"]["text"] = prompt
        wf["98:47"]["inputs"]["width"] = width
        wf["98:47"]["inputs"]["height"] = height
        if req.get("steps"):
            wf["5"]["inputs"]["steps"] = int(req["steps"])
        wf["5"]["inputs"]["seed"] = seed
        wf["9"]["inputs"]["filename_prefix"] = req.get("filename_prefix", "flux2")
        return wf, "png"

    # ── Krea 2 text-to-image ──
    if model in KREA_MODELS:
        width = int(req.get("width") or 1024)
        height = int(req.get("height") or 1024)
        steps = int(req.get("steps") or 8)
        wf = _load("krea2_t2i.json")
        wf["98:1"]["inputs"]["text"] = prompt
        wf["98:2"]["inputs"]["width"] = width
        wf["98:2"]["inputs"]["height"] = height
        wf["17"]["inputs"]["steps"] = steps
        wf["18"]["inputs"]["noise_seed"] = seed
        wf["9"]["inputs"]["filename_prefix"] = req.get("filename_prefix", "krea2")
        return wf, "png"

    # ── LTX-2.3 ID-LoRA lip-sync (close-up, audio-driven) ──
    if model in LIPSYNC_MODELS:
        width = int(req.get("width") or 720)
        height = int(req.get("height") or 1280)
        wf = _load("ltx_id_lora.json")
        wf["269"]["inputs"]["image"] = req.get("image_filename", "input_image.png")
        wf["276"]["inputs"]["audio"] = req.get("audio_filename", "input_audio.mp3")
        wf["340:319"]["inputs"]["value"] = prompt
        if req.get("duration"):
            dur = float(req["duration"])
        elif req.get("num_frames"):
            dur = round(int(req["num_frames"]) / fps, 3)
        else:
            dur = 5.0
        wf["340:331"]["inputs"]["value"] = dur
        wf["340:330"]["inputs"]["value"] = width
        wf["340:324"]["inputs"]["value"] = height
        wf["340:323"]["inputs"]["value"] = fps
        if req.get("identity_guidance_scale") is not None:
            wf["340:349"]["inputs"]["identity_guidance_scale"] = float(req["identity_guidance_scale"])
        wf["341"]["inputs"]["filename_prefix"] = req.get("filename_prefix", "video/idlora")
        return wf, "mp4"

    # ── LTX-2.3 image-to-video ──
    # Used when an explicit i2v model is chosen, OR a video model is given an input image.
    if model in I2V_MODELS or (req.get("image_filename") and model not in LIPSYNC_MODELS):
        width = int(req.get("width") or 720)
        height = int(req.get("height") or 1280)
        wf = _load("ltx_i2v.json")
        wf["269"]["inputs"]["image"] = req.get("image_filename", "input_image.png")
        wf["320:319"]["inputs"]["value"] = prompt
        wf["320:312"]["inputs"]["value"] = width    # width primitive (a/2 feeds latent)
        wf["320:299"]["inputs"]["value"] = height   # height primitive
        wf["320:300"]["inputs"]["value"] = fps
        if req.get("duration"):
            wf["320:301"]["inputs"]["value"] = int(req["duration"])
        elif req.get("num_frames"):
            wf["320:301"]["inputs"]["value"] = max(1, round(int(req["num_frames"]) / fps))
        wf["320:276"]["inputs"]["noise_seed"] = seed
        wf["320:277"]["inputs"]["noise_seed"] = seed + 1
        wf["75"]["inputs"]["filename_prefix"] = req.get("filename_prefix", "video/ltx_i2v")
        return wf, "mp4"

    # ── LTX-2.3 text-to-video (default) ──
    width = int(req.get("width") or 720)
    height = int(req.get("height") or 1280)
    wf = _load("ltx_t2v.json")
    wf["267:266"]["inputs"]["value"] = prompt
    wf["267:257"]["inputs"]["value"] = width
    wf["267:258"]["inputs"]["value"] = height
    wf["267:260"]["inputs"]["value"] = fps
    if req.get("duration"):
        wf["267:225"]["inputs"]["value"] = int(req["duration"])
    elif req.get("num_frames"):
        wf["267:225"]["inputs"]["value"] = max(1, round(int(req["num_frames"]) / fps))
    wf["267:216"]["inputs"]["noise_seed"] = seed
    wf["267:237"]["inputs"]["noise_seed"] = seed + 1
    wf["75"]["inputs"]["filename_prefix"] = req.get("filename_prefix", "video/ltx_t2v")
    return wf, "mp4"

comfyui_models_vol = modal.Volume.from_name("comfyui-models", create_if_missing=True)
output_vol = modal.Volume.from_name("ltx23-outputs", create_if_missing=True)
userdata_vol = modal.Volume.from_name("comfyui-userdata", create_if_missing=True)
MODELS_PATH = "/models_cache"
USERDATA_PATH = "/comfyui-userdata"
app = modal.App("clipflow-comfyui")


def _setup_symlinks():
    import os, shutil
    comfy_models = "/comfyui/models"
    os.makedirs(comfy_models, exist_ok=True)
    for subdir in ["checkpoints", "vae", "clip", "unet", "loras", "controlnet",
                   "upscale_models", "diffusion_models", "text_encoders", "latent_upscale_models"]:
        src = f"{MODELS_PATH}/{subdir}"
        dst = f"{comfy_models}/{subdir}"
        os.makedirs(src, exist_ok=True)
        if os.path.islink(dst):
            os.unlink(dst)
        elif os.path.isdir(dst):
            shutil.rmtree(dst)
        os.symlink(src, dst)

    # Symlink inputs volume -> ComfyUI input folder
    inputs_src = MODELS_PATH + "/inputs"
    inputs_dst = "/comfyui/input"
    os.makedirs(inputs_src, exist_ok=True)
    if os.path.islink(inputs_dst):
        os.unlink(inputs_dst)
    elif os.path.isdir(inputs_dst):
        import glob
        for f in glob.glob(inputs_dst + "/*"):
            shutil.copy2(f, inputs_src)
        shutil.rmtree(inputs_dst)
    os.symlink(inputs_src, inputs_dst)

    # Symlink userdata volume -> ComfyUI user folder (saves workflows, settings)
    user_dst = "/comfyui/user"
    os.makedirs(USERDATA_PATH, exist_ok=True)
    if os.path.islink(user_dst):
        os.unlink(user_dst)
    elif os.path.isdir(user_dst):
        # Migrate existing user data to volume on first run
        import glob
        for item in os.listdir(user_dst):
            src_item = user_dst + "/" + item
            dst_item = USERDATA_PATH + "/" + item
            if not os.path.exists(dst_item):
                shutil.copytree(src_item, dst_item) if os.path.isdir(src_item) else shutil.copy2(src_item, dst_item)
        shutil.rmtree(user_dst)
    os.symlink(USERDATA_PATH, user_dst)

    print("[ComfyUI] Symlinks ready")


def _upload_r2(file_path, key):
    import boto3, os
    s3 = boto3.client("s3",
        endpoint_url=os.environ.get("R2_ENDPOINT", "https://" + os.environ.get("R2_ACCOUNT_ID","") + ".r2.cloudflarestorage.com"),
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        region_name="auto",
    )
    bucket = os.environ.get("R2_BUCKET", os.environ.get("R2_BUCKET_NAME", "ai-creator-media"))
    public_url = os.environ.get("R2_PUBLIC_URL", "")
    s3.upload_file(file_path, bucket, key)
    url = public_url + "/" + key
    print("[R2] " + url)
    return url


def _start_comfyui(extra_args=None):
    import subprocess, time, urllib.request
    args = ["python", "main.py", "--listen", "0.0.0.0", "--port", "8188",
            "--disable-auto-launch", "--output-directory", "/comfyui/output",
            "--preview-method", "none", "--enable-cors-header"]
    if extra_args:
        args += extra_args
    proc = subprocess.Popen(args, cwd="/comfyui", stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    for i in range(150):
        if proc.poll() is not None:
            out, err = proc.communicate()
            raise RuntimeError("[ComfyUI] Died: " + err.decode("utf-8", errors="replace")[-2000:])
        try:
            urllib.request.urlopen("http://127.0.0.1:8188/system_stats", timeout=3)
            print("[ComfyUI] Ready after " + str(i*2) + "s")
            return proc
        except Exception:
            time.sleep(2)
    raise RuntimeError("[ComfyUI] Timeout 300s")


# CPU Server: serves UI on demand, scales to zero when idle (no idle cost)
@app.cls(
    image=comfyui_image,
    cpu=2,
    memory=4096,
    timeout=60 * 60,
    min_containers=0,
    scaledown_window=300,
    volumes={MODELS_PATH: comfyui_models_vol, USERDATA_PATH: userdata_vol},
)
class ComfyUIServer:

    @modal.enter()
    def start(self):
        _setup_symlinks()
        self.process = _start_comfyui(["--cpu"])
        print("[Server] UI ready on CPU")

    @modal.web_server(8188, startup_timeout=300)
    def ui(self):
        pass

    @modal.fastapi_endpoint(method="POST")
    def api(self, request: dict):
        import requests as http_requests, base64, os

        if request.get("action") == "health":
            try:
                r = http_requests.get("http://127.0.0.1:8188/system_stats", timeout=5)
                return {"status": "ok", "mode": "cpu", "stats": r.json()}
            except Exception as e:
                return {"status": "error", "error": str(e)}

        # Upload image to ComfyUI input folder on the SHARED VOLUME
        # so GPU worker can also access it
        if request.get("action") == "upload_image":
            try:
                img_b64 = request.get("image_b64", "")
                filename = request.get("filename", "input.jpg").lower()
                img_bytes = base64.b64decode(img_b64)

                # Save to volume so GPU worker can access it
                input_dir = MODELS_PATH + "/inputs"
                os.makedirs(input_dir, exist_ok=True)
                dest = input_dir + "/" + filename
                with open(dest, "wb") as f:
                    f.write(img_bytes)
                comfyui_models_vol.commit()

                # Also upload to local ComfyUI input for UI preview
                resp = http_requests.post(
                    "http://127.0.0.1:8188/upload/image",
                    files={"image": (filename, img_bytes, "image/jpeg")},
                    data={"overwrite": "true"},
                    timeout=30,
                )
                return {"name": filename, "subfolder": "", "type": "input"}
            except Exception as e:
                return {"error": str(e)}

        workflow = request.get("workflow")
        if not workflow:
            return {"error": "workflow required"}

        # Cannot instantiate ComfyUIWorker from ComfyUIServer — call GPU worker directly
        # The generate endpoint on ComfyUIWorker handles this
        return {"error": "Use the GPU worker endpoint directly for workflow generation"}


# GPU Worker: spins up only when generating
@app.cls(
    image=comfyui_image,
    gpu="A100-80GB:1",
    timeout=60 * 60,
    min_containers=0,
    max_containers=1,
    scaledown_window=300,
    volumes={MODELS_PATH: comfyui_models_vol, "/outputs": output_vol, USERDATA_PATH: userdata_vol},
    secrets=[modal.Secret.from_name("huggingface-secret"), modal.Secret.from_name("r2-credentials")],
)
class ComfyUIWorker:

    @modal.enter()
    def start(self):
        _setup_symlinks()
        self.process = _start_comfyui()
        print("[Worker] GPU ready")

    def _run(self, workflow, output_name="comfy_output.mp4", upload_to_r2=True, timeout_seconds=600):
        import requests, time, os, glob, shutil

        # Reload volume so newly uploaded images are visible
        comfyui_models_vol.reload()

        resp = requests.post("http://127.0.0.1:8188/prompt", json={"prompt": workflow}, timeout=30)
        if not resp.ok:
            return {"error": "Queue failed: " + resp.text}

        prompt_id = resp.json()["prompt_id"]
        print("[Worker] Queued " + prompt_id)

        for i in range(timeout_seconds):
            time.sleep(1)
            try:
                history = requests.get("http://127.0.0.1:8188/history/" + prompt_id, timeout=10).json()
            except Exception:
                continue
            if prompt_id in history:
                job = history[prompt_id]
                if job.get("status", {}).get("status_str") == "error":
                    return {"error": str(job["status"].get("messages", []))}
                if job.get("outputs"):
                    print("[Worker] Done after " + str(i) + "s")
                    break
        else:
            return {"error": "Timeout " + str(timeout_seconds) + "s"}

        out_files = [f for f in glob.glob("/comfyui/output/**/*", recursive=True) if os.path.isfile(f)]
        if not out_files:
            return {"error": "No output files"}

        out_path = sorted(out_files, key=os.path.getmtime)[-1]
        final_path = "/outputs/" + output_name
        shutil.copy2(out_path, final_path)

        r2_url = None
        if upload_to_r2:
            ext = output_name.rsplit(".", 1)[-1].lower()
            folder = "videos" if ext in ("mp4", "webm", "gif") else "images"
            r2_url = _upload_r2(final_path, folder + "/" + output_name)

        return {"path": final_path, "r2_url": r2_url, "prompt_id": prompt_id}

    @modal.fastapi_endpoint(method="POST")
    def generate(self, request: dict):
        import requests as http_requests, os

        action = request.get("action")
        if action == "health":
            try:
                r = http_requests.get("http://127.0.0.1:8188/system_stats", timeout=5)
                return {"status": "ok", "mode": "gpu", "stats": r.json()}
            except Exception as e:
                return {"status": "error", "error": str(e)}

        if action == "chained_movie":
            # Spawn the long serial chained-movie job in the background; return immediately.
            ChainHandle = self.chained_movie.spawn(request)
            return {"status": "started", "call_id": getattr(ChainHandle, "object_id", None)}

        if action == "last_frame":
            # Extract the final frame of a video URL -> upload to R2 -> return image URL.
            import subprocess, uuid, requests as _rq
            video_url = request.get("video_url")
            if not video_url:
                return {"error": "video_url required"}
            try:
                tmpv = "/tmp/" + uuid.uuid4().hex[:8] + ".mp4"
                with open(tmpv, "wb") as f:
                    f.write(_rq.get(video_url, timeout=180).content)
                outimg = tmpv.rsplit(".", 1)[0] + "_last.png"
                # -sseof -1 seeks to ~1s before end; grab a single frame
                subprocess.run(
                    ["ffmpeg", "-y", "-sseof", "-1", "-i", tmpv, "-vframes", "1", "-q:v", "2", outimg],
                    check=True, capture_output=True,
                )
                import os as _os
                if not _os.path.exists(outimg) or _os.path.getsize(outimg) == 0:
                    # fallback: grab the very last decodable frame
                    subprocess.run(
                        ["ffmpeg", "-y", "-i", tmpv, "-vf", "select=eq(n\\,0)", "-vsync", "0", outimg],
                        check=True, capture_output=True,
                    )
                key = "images/lastframe_" + uuid.uuid4().hex[:8] + ".png"
                url = _upload_r2(outimg, key)
                return {"r2_url": url}
            except Exception as e:
                return {"error": "last_frame failed: " + str(e)}

        if action == "debug_models":
            result = {}
            for d in ["checkpoints", "vae", "loras", "text_encoders", "latent_upscale_models",
                       "diffusion_models", "clip", "unet"]:
                path = "/comfyui/models/" + d
                result[d] = sorted(os.listdir(path)) if os.path.exists(path) else []
            return result

        if action == "debug_nodes":
            import requests as _rq
            try:
                obj = _rq.get("http://127.0.0.1:8188/object_info", timeout=10).json()
                keys = sorted(obj.keys())
                ideogram_keys = [k for k in keys if "ideogram" in k.lower() or "Ideogram" in k]

                filter_name = request.get("filter")
                if filter_name == "list":
                    return {"total": len(keys), "nodes": keys}
                if filter_name and filter_name in obj:
                    return {filter_name: obj[filter_name]}

                # Return useful node subset
                useful = ["UNETLoader", "KSampler", "KSamplerAdvanced", "CLIPTextEncode",
                          "EmptyLatentImage", "VAEDecode", "SaveImage", "CheckpointLoaderSimple",
                          "unCLIPCheckpointLoader", "DiffusionLoader"]
                result = {}
                for n in useful:
                    if n in obj:
                        result[n] = {"required": obj[n].get("input", {}).get("required", {}),
                                     "optional": obj[n].get("input", {}).get("optional", {})}
                return result
            except Exception as e:
                return {"error": str(e)}

        # Two ways to call generate:
        #  (a) high-level: send {model, prompt, width, height, num_frames, ...}
        #      and the worker builds the ComfyUI graph from a bundled template.
        #  (b) low-level: send a full {workflow} graph (used by test scripts).
        workflow = request.get("workflow")
        default_ext = "mp4"
        if not workflow:
            model = request.get("model")
            if not model:
                return {"error": "workflow or model required"}
            try:
                workflow, default_ext = _build_workflow(model, request)
            except Exception as e:
                import traceback
                return {"error": "workflow build failed: " + str(e),
                        "traceback": traceback.format_exc()[-1500:]}

        output_name = request.get("output_name") or ("comfy_output." + default_ext)
        upload_to_r2 = request.get("upload_to_r2", True)
        timeout = request.get("timeout", 600)

        # Optionally fetch input files (image/audio) directly into the
        # ComfyUI input dir so callers avoid pushing large base64 bodies.
        # input_files: { "filename.png": "https://...", ... }
        input_files = request.get("input_files") or {}
        if input_files:
            import os as _os, requests as _rq
            indir = "/comfyui/input"
            _os.makedirs(indir, exist_ok=True)
            for fname, url in input_files.items():
                try:
                    data = _rq.get(url, timeout=180).content
                    with open(_os.path.join(indir, fname), "wb") as _f:
                        _f.write(data)
                    print("[Worker] fetched input " + fname + " (" + str(len(data)) + " bytes)")
                except Exception as e:
                    return {"error": "Failed to fetch input " + fname + ": " + str(e)}

        # input_files_b64: { "filename.png": "data:image/png;base64,..." or raw b64 }
        input_files_b64 = request.get("input_files_b64") or {}
        if input_files_b64:
            import os as _os, base64 as _b64
            indir = "/comfyui/input"
            _os.makedirs(indir, exist_ok=True)
            for fname, b64 in input_files_b64.items():
                try:
                    if "," in b64 and b64.strip().lower().startswith("data:"):
                        b64 = b64.split(",", 1)[1]
                    data = _b64.b64decode(b64)
                    with open(_os.path.join(indir, fname), "wb") as _f:
                        _f.write(data)
                    print("[Worker] decoded input " + fname + " (" + str(len(data)) + " bytes)")
                except Exception as e:
                    return {"error": "Failed to decode input " + fname + ": " + str(e)}

        # Run workflow inline — no self._run() to avoid Modal proxy issues
        import requests as req_lib, time, os, glob, shutil
        try:
            try:
                comfyui_models_vol.reload()
            except Exception as _re:
                print("[Worker] volume reload skipped: " + str(_re)[:120])
            resp = req_lib.post("http://127.0.0.1:8188/prompt", json={"prompt": workflow}, timeout=30)
            if not resp.ok:
                return {"error": "Queue failed: " + resp.text}

            prompt_id = resp.json()["prompt_id"]
            print("[Worker] Queued " + prompt_id)

            result = {"error": "Timeout " + str(timeout) + "s"}
            for i in range(timeout):
                time.sleep(1)
                try:
                    history = req_lib.get("http://127.0.0.1:8188/history/" + prompt_id, timeout=10).json()
                except Exception:
                    continue
                if prompt_id in history:
                    job = history[prompt_id]
                    if job.get("status", {}).get("status_str") == "error":
                        result = {"error": str(job["status"].get("messages", []))}
                        break
                    if job.get("outputs"):
                        print("[Worker] Done after " + str(i) + "s")
                        out_files = [f for f in glob.glob("/comfyui/output/**/*", recursive=True) if os.path.isfile(f)]
                        if not out_files:
                            result = {"error": "No output files"}
                            break
                        out_path = sorted(out_files, key=os.path.getmtime)[-1]
                        final_path = "/outputs/" + output_name
                        shutil.copy2(out_path, final_path)
                        r2_url = None
                        if upload_to_r2:
                            ext = output_name.rsplit(".", 1)[-1].lower()
                            folder = "videos" if ext in ("mp4", "webm", "gif") else "images"
                            r2_url = _upload_r2(final_path, folder + "/" + output_name)
                        result = {"path": final_path, "r2_url": r2_url, "prompt_id": prompt_id}
                        break
        except Exception as e:
            import traceback
            return {"error": str(e), "traceback": traceback.format_exc()[-2000:]}

        callback_url = request.get("callback_url")
        job_id = request.get("job_id")
        if callback_url and job_id:
            try:
                http_requests.post(callback_url, json={
                    "job_id": job_id,
                    "status": "completed" if result.get("r2_url") else "failed",
                    "r2_url": result.get("r2_url"),
                    "error": result.get("error"),
                }, timeout=10)
            except Exception as e:
                print("[Callback] " + str(e))

        return {"status": "success" if result.get("r2_url") else "error", **result}

    def _run_workflow_sync(self, workflow, output_name, timeout=900):
        """Queue a workflow on the local ComfyUI, wait, copy output, upload to R2."""
        import requests as req_lib, time, os, glob, shutil
        try:
            comfyui_models_vol.reload()
        except Exception:
            pass
        resp = req_lib.post("http://127.0.0.1:8188/prompt", json={"prompt": workflow}, timeout=30)
        if not resp.ok:
            return {"error": "Queue failed: " + resp.text}
        prompt_id = resp.json()["prompt_id"]
        for _ in range(timeout):
            time.sleep(1)
            try:
                history = req_lib.get("http://127.0.0.1:8188/history/" + prompt_id, timeout=10).json()
            except Exception:
                continue
            if prompt_id in history:
                job = history[prompt_id]
                if job.get("status", {}).get("status_str") == "error":
                    return {"error": str(job["status"].get("messages", []))}
                if job.get("outputs"):
                    out_files = [f for f in glob.glob("/comfyui/output/**/*", recursive=True) if os.path.isfile(f)]
                    if not out_files:
                        return {"error": "No output files"}
                    out_path = sorted(out_files, key=os.path.getmtime)[-1]
                    final_path = "/outputs/" + output_name
                    shutil.copy2(out_path, final_path)
                    ext = output_name.rsplit(".", 1)[-1].lower()
                    folder = "videos" if ext in ("mp4", "webm", "gif") else "images"
                    r2_url = _upload_r2(final_path, folder + "/" + output_name)
                    return {"r2_url": r2_url, "path": final_path}
        return {"error": "Timeout"}

    def _extract_last_frame(self, video_path):
        """Extract the final frame of a local video -> upload to R2 -> return (local_png, r2_url)."""
        import subprocess, uuid, os
        outimg = "/tmp/" + uuid.uuid4().hex[:8] + "_last.png"
        subprocess.run(["ffmpeg", "-y", "-sseof", "-1", "-i", video_path, "-vframes", "1", "-q:v", "2", outimg],
                       capture_output=True)
        if not os.path.exists(outimg) or os.path.getsize(outimg) == 0:
            subprocess.run(["ffmpeg", "-y", "-i", video_path, "-update", "1", "-q:v", "2", outimg], capture_output=True)
        return outimg

    @modal.method()
    def chained_movie(self, request: dict):
        """Generate a multi-scene video where each scene continues from the last
        frame of the previous one (frame chaining for visual consistency).

        Body: {
          scenes: [{ prompt, duration?, width?, height? }, ...],
          start_image_url?: str,   # optional seed for scene 1
          fps?: int,
          callback_url?, job_ids?: [str]   # one job per scene, finalized as each completes
        }
        Runs serially on the GPU (no time cap) and calls back per scene.
        """
        import requests as http_requests, os, shutil, uuid

        scenes = request.get("scenes") or []
        if not scenes:
            return {"error": "scenes required"}
        fps = int(request.get("fps") or 25)
        callback_url = request.get("callback_url")
        job_ids = request.get("job_ids") or []
        results = []

        indir = "/comfyui/input"
        os.makedirs(indir, exist_ok=True)

        # Seed image for the first scene (optional)
        prev_frame_path = None
        start_url = request.get("start_image_url")
        if start_url:
            try:
                p = os.path.join(indir, "chain_seed.png")
                open(p, "wb").write(http_requests.get(start_url, timeout=120).content)
                prev_frame_path = p
            except Exception:
                prev_frame_path = None

        for i, scene in enumerate(scenes):
            prompt = (scene.get("prompt") or "").strip()
            req = {
                "prompt": prompt,
                "width": int(scene.get("width") or 720),
                "height": int(scene.get("height") or 1280),
                "duration": int(scene.get("duration") or 5),
                "fps": fps,
                "filename_prefix": "video/chain_" + str(i),
            }
            # If we have a previous frame, this becomes image-to-video.
            if prev_frame_path:
                fname = "chain_in_" + str(i) + ".png"
                shutil.copy2(prev_frame_path, os.path.join(indir, fname))
                req["image_filename"] = fname
                model = "ltx-i2v"
            else:
                model = "ltx-2.3"

            try:
                wf, _ext = _build_workflow(model, req)
            except Exception as e:
                results.append({"scene": i, "error": "build failed: " + str(e)})
                continue

            out_name = "chain_" + uuid.uuid4().hex[:8] + ".mp4"
            res = self._run_workflow_sync(wf, out_name, timeout=1500)
            r2_url = res.get("r2_url")
            results.append({"scene": i, "r2_url": r2_url, "error": res.get("error")})

            # finalize this scene's job
            if callback_url and i < len(job_ids):
                try:
                    http_requests.post(callback_url, json={
                        "job_id": job_ids[i],
                        "status": "completed" if r2_url else "failed",
                        "r2_url": r2_url,
                        "error": res.get("error"),
                    }, timeout=10)
                except Exception as e:
                    print("[Chain callback] " + str(e))

            # extract last frame to seed the next scene
            if r2_url and res.get("path"):
                try:
                    prev_frame_path = self._extract_last_frame(res["path"])
                except Exception as e:
                    print("[Chain] last frame failed: " + str(e))

        return {"status": "done", "scenes": results}


@app.function(
    image=comfyui_image, cpu=2, timeout=60 * 60 * 2,
    volumes={MODELS_PATH: comfyui_models_vol},
    secrets=[modal.Secret.from_name("huggingface-secret")],
)
def download_models():
    from huggingface_hub import hf_hub_download
    import os, shutil

    for d in ["checkpoints", "latent_upscale_models", "loras", "text_encoders", "vae"]:
        os.makedirs(MODELS_PATH + "/" + d, exist_ok=True)

    def dl(repo, filename, dest_dir):
        dest = dest_dir + "/" + os.path.basename(filename)
        if os.path.exists(dest):
            print("[Skip] " + os.path.basename(filename))
            return
        print("[Download] " + os.path.basename(filename) + "...")
        tmp = hf_hub_download(repo_id=repo, filename=filename)
        shutil.copy2(tmp, dest)

    dl("Lightricks/LTX-2.3-fp8", "ltx-2.3-22b-dev-fp8.safetensors", MODELS_PATH + "/checkpoints")

    # Distilled fp8 — needed for flf2v (first/last frame) workflow
    print("[Download] ltx-2.3-22b-distilled-fp8 (Lightricks/LTX-2.3-fp8)...")
    dl("Lightricks/LTX-2.3-fp8", "ltx-2.3-22b-distilled-fp8.safetensors", MODELS_PATH + "/checkpoints")
    dl("Lightricks/LTX-2.3", "ltx-2.3-spatial-upscaler-x2-1.1.safetensors", MODELS_PATH + "/latent_upscale_models")
    dl("Lightricks/LTX-2.3", "ltx-2.3-22b-distilled-lora-384.safetensors", MODELS_PATH + "/loras")
    dl("Comfy-Org/ltx-2.3", "split_files/loras/ltx_2.3_22b_distilled_1.1_lora_dynamic_fro09_avg_rank_111_bf16.safetensors", MODELS_PATH + "/loras")
    dl("Comfy-Org/ltx-2", "split_files/loras/gemma-3-12b-it-abliterated_lora_rank64_bf16.safetensors", MODELS_PATH + "/loras")
    # TalkVid ID-LoRA: correct source is AviadDahan repo (file is lora_weights.safetensors).
    # Download then rename to the filename the workflow expects.
    _tv_dest = MODELS_PATH + "/loras/ltx-2.3-id-lora-talkvid-3k.safetensors"
    if not os.path.exists(_tv_dest):
        print("[Download] ltx-2.3-id-lora-talkvid-3k (AviadDahan)...")
        _tv_tmp = hf_hub_download(repo_id="AviadDahan/LTX-2.3-ID-LoRA-TalkVid-3K", filename="lora_weights.safetensors")
        shutil.copy2(_tv_tmp, _tv_dest)
    else:
        print("[Skip] ltx-2.3-id-lora-talkvid-3k")
    dl("Comfy-Org/ltx-2", "split_files/text_encoders/gemma_3_12B_it_fp4_mixed.safetensors", MODELS_PATH + "/text_encoders")
    dl("Kijai/LTX2.3_comfy", "vae/LTX23_video_vae_bf16.safetensors", MODELS_PATH + "/vae")
    dl("Kijai/LTX2.3_comfy", "vae/LTX23_audio_vae_bf16.safetensors", MODELS_PATH + "/vae")

    comfyui_models_vol.commit()
    print("[Download] All done!")
    return "Done"


@app.function(
    image=comfyui_image, cpu=2, timeout=60 * 60 * 2,
    volumes={MODELS_PATH: comfyui_models_vol},
    secrets=[modal.Secret.from_name("huggingface-secret")],
)
def download_flux2():
    """FLUX.2 text-to-image workflow models. Run: modal run comfyui_modal.py::download_flux2"""
    from huggingface_hub import hf_hub_download
    import os, shutil

    for d in ["diffusion_models", "text_encoders", "vae", "loras"]:
        os.makedirs(MODELS_PATH + "/" + d, exist_ok=True)

    def dl(repo, filename, dest_dir, rename=None):
        base = rename or os.path.basename(filename)
        dest = dest_dir + "/" + base
        if os.path.exists(dest):
            print("[Skip] " + base)
            return
        print("[Download] " + base + "...")
        tmp = hf_hub_download(repo_id=repo, filename=filename)
        shutil.copy2(tmp, dest)

    dl("Comfy-Org/flux2-dev", "split_files/diffusion_models/flux2_dev_fp8mixed.safetensors", MODELS_PATH + "/diffusion_models")
    dl("Comfy-Org/flux2-dev", "split_files/text_encoders/mistral_3_small_flux2_bf16.safetensors", MODELS_PATH + "/text_encoders")
    dl("black-forest-labs/FLUX.2-small-decoder", "full_encoder_small_decoder.safetensors", MODELS_PATH + "/vae")
    try:
        dl("ByteZSzn/Flux.2-Turbo-ComfyUI", "Flux_2-Turbo-LoRA_comfyui.safetensors", MODELS_PATH + "/loras")
    except Exception as e:
        print("[Warn] turbo lora:", e)

    comfyui_models_vol.commit()
    print("[Download] FLUX.2 done!")
    return "Done"


@app.function(
    image=comfyui_image, cpu=2, timeout=60 * 60 * 2,
    volumes={MODELS_PATH: comfyui_models_vol},
    secrets=[modal.Secret.from_name("huggingface-secret")],
)
def download_ideogram4():
    """Ideogram 4 open-weight models. Run: modal run comfyui_modal.py::download_ideogram4"""
    from huggingface_hub import hf_hub_download
    import os, shutil

    for d in ["diffusion_models", "text_encoders", "vae"]:
        os.makedirs(MODELS_PATH + "/" + d, exist_ok=True)

    def dl(repo, filename, dest_dir):
        dest = dest_dir + "/" + os.path.basename(filename)
        if os.path.exists(dest):
            print("[Skip] " + os.path.basename(filename))
            return
        print("[Download] " + os.path.basename(filename) + "...")
        tmp = hf_hub_download(repo_id=repo, filename=filename)
        shutil.copy2(tmp, dest)

    dl("Comfy-Org/Ideogram-4", "diffusion_models/ideogram4_fp8_scaled.safetensors", MODELS_PATH + "/diffusion_models")
    dl("Comfy-Org/Ideogram-4", "diffusion_models/ideogram4_unconditional_fp8_scaled.safetensors", MODELS_PATH + "/diffusion_models")
    dl("Comfy-Org/Qwen3-VL", "text_encoders/qwen3vl_8b_fp8_scaled.safetensors", MODELS_PATH + "/text_encoders")
    dl("Comfy-Org/gemma-4", "text_encoders/gemma4_e4b_it_fp8_scaled.safetensors", MODELS_PATH + "/text_encoders")
    dl("Comfy-Org/flux2-dev", "split_files/vae/flux2-vae.safetensors", MODELS_PATH + "/vae")

    comfyui_models_vol.commit()
    print("[Download] Ideogram 4 done!")
    return "Done"


@app.function(
    image=comfyui_image, cpu=2, timeout=60 * 60 * 2,
    volumes={MODELS_PATH: comfyui_models_vol},
    secrets=[modal.Secret.from_name("huggingface-secret")],
)
def download_krea2():
    """Krea 2 Turbo image models. Run: modal run comfyui_modal.py::download_krea2"""
    from huggingface_hub import hf_hub_download
    import os, shutil

    for d in ["diffusion_models", "text_encoders", "vae", "loras"]:
        os.makedirs(MODELS_PATH + "/" + d, exist_ok=True)

    def dl(repo, filename, dest_dir):
        dest = dest_dir + "/" + os.path.basename(filename)
        if os.path.exists(dest):
            print("[Skip] " + os.path.basename(filename))
            return
        print("[Download] " + os.path.basename(filename) + "...")
        tmp = hf_hub_download(repo_id=repo, filename=filename)
        shutil.copy2(tmp, dest)

    dl("Comfy-Org/Krea-2", "diffusion_models/krea2_turbo_fp8_scaled.safetensors", MODELS_PATH + "/diffusion_models")
    dl("Comfy-Org/Krea-2", "text_encoders/qwen3vl_4b_fp8_scaled.safetensors", MODELS_PATH + "/text_encoders")
    dl("Comfy-Org/Krea-2", "vae/qwen_image_vae.safetensors", MODELS_PATH + "/vae")
    dl("Comfy-Org/Krea-2", "loras/krea2_turbo_lora_rank_64_bf16.safetensors", MODELS_PATH + "/loras")

    comfyui_models_vol.commit()
    print("[Download] Krea 2 done!")
    return "Done"


@app.function(image=comfyui_image, cpu=2, timeout=60, volumes={MODELS_PATH: comfyui_models_vol})
def debug_volume():
    import os, json
    result = {}
    for d in ["checkpoints", "vae", "loras", "text_encoders", "latent_upscale_models",
              "diffusion_models", "clip", "unet"]:
        path = MODELS_PATH + "/" + d
        result[d] = sorted(f for f in os.listdir(path) if not f.startswith(".")) if os.path.exists(path) else []
    print(json.dumps(result, indent=2))
    return result


@app.local_entrypoint()
def main():
    print("modal deploy comfyui_modal.py")
    print("modal run comfyui_modal.py::download_models")
    print("modal run comfyui_modal.py::debug_volume")
