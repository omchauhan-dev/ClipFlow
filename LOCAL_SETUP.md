# Local AI Setup

This application is configured to run image generation locally on your machine using a GPU, bypassing external APIs.

## Prerequisites

1.  **NVIDIA GPU**: You need a GPU with CUDA support and decent VRAM (8GB+ recommended for SDXL).
2.  **Python**: Python 3.10 or higher installed.
3.  **CUDA Toolkit**: Ensure you have CUDA drivers installed.

## Setup Instructions

1.  **Navigate to the python backend directory**:
    ```bash
    cd python_backend
    ```

2.  **Create a virtual environment (optional but recommended)**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
    *Note: If you have issues with torch/cuda, visit [pytorch.org](https://pytorch.org/) to get the specific install command for your CUDA version, e.g., `pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118`.*

4.  **Start the Server**:
    ```bash
    python main.py
    ```
    The server will start on `http://0.0.0.0:8000`. You should see logs indicating that the `SDXL-Turbo` model is loading on CUDA.

## Application Configuration

The Next.js application expects the local server to be at `http://127.0.0.1:8000`.

If you change the port, update the `LOCAL_PYTHON_BACKEND_URL` environment variable in your `.env` file:

```env
LOCAL_PYTHON_BACKEND_URL=http://127.0.0.1:YOUR_PORT
```

## Troubleshooting

*   **"Failed to connect to local generation service"**: Ensure the python script is running and accessible. Check if `curl http://127.0.0.1:8000/docs` works.
*   **CUDA Out of Memory**: If the model fails to load, try closing other GPU-heavy applications or modify `main.py` to use a smaller model or `enable_model_cpu_offload()`.
