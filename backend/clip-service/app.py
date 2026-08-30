"""Small HTTP service used by the recognizePet cloud function.

The cloud function supplies a signed input image URL and the current gallery
candidate URLs. This service owns the CLIP model and returns cosine matches.
"""

from functools import lru_cache
import io
import os
from typing import List
from urllib.request import Request, urlopen

import numpy as np
import onnxruntime as ort
from fastapi import FastAPI, Header, HTTPException
from PIL import Image
from pydantic import BaseModel, Field


MODEL_ID = os.getenv("CLIP_MODEL_ID", "openai/clip-vit-base-patch32-onnx-quantized")
MODEL_PATH = os.getenv(
    "CLIP_ONNX_MODEL_PATH",
    "/models/vision_model_quantized.onnx",
)
SERVICE_TOKEN = os.getenv("CLIP_SERVICE_TOKEN", "")
FETCH_TIMEOUT = float(os.getenv("CLIP_FETCH_TIMEOUT", "15"))
MAX_CANDIDATES = int(os.getenv("CLIP_MAX_CANDIDATES", "100"))
IMAGE_SIZE = 224
IMAGE_MEAN = np.array([0.48145466, 0.4578275, 0.40821073], dtype=np.float32)
IMAGE_STD = np.array([0.26862954, 0.26130258, 0.27577711], dtype=np.float32)

app = FastAPI(title="Petmon CLIP service", version="1.0.0")


class Candidate(BaseModel):
    petId: str = Field(min_length=1, max_length=128)
    imageUrl: str = Field(min_length=1, max_length=4096)
    imageRef: str | None = Field(default=None, max_length=4096)


class MatchRequest(BaseModel):
    imageUrl: str = Field(min_length=1, max_length=4096)
    candidates: List[Candidate] = Field(min_length=1, max_length=MAX_CANDIDATES)
    topK: int = Field(default=3, ge=1, le=10)


@lru_cache(maxsize=1)
def model_session():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"CLIP ONNX model not found: {MODEL_PATH}")
    return ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])


def fetch_image(url: str) -> Image.Image:
    request = Request(url, headers={"User-Agent": "petmon-clip-service/1.0"})
    with urlopen(request, timeout=FETCH_TIMEOUT) as response:
        content_type = response.headers.get("content-type", "")
        if content_type and not content_type.lower().startswith("image/"):
            raise ValueError("remote resource is not an image")
        return Image.open(io.BytesIO(response.read())).convert("RGB")


def preprocess(image: Image.Image) -> np.ndarray:
    image = image.convert("RGB")
    scale = IMAGE_SIZE / min(image.width, image.height)
    resized = image.resize(
        (round(image.width * scale), round(image.height * scale)),
        Image.Resampling.BICUBIC,
    )
    left = (resized.width - IMAGE_SIZE) // 2
    top = (resized.height - IMAGE_SIZE) // 2
    cropped = resized.crop((left, top, left + IMAGE_SIZE, top + IMAGE_SIZE))
    pixels = np.asarray(cropped, dtype=np.float32) / 255.0
    pixels = (pixels - IMAGE_MEAN) / IMAGE_STD
    return np.transpose(pixels, (2, 0, 1))[None, ...].astype(np.float32)


def image_embedding(image: Image.Image) -> np.ndarray:
    session = model_session()
    output = session.run(["image_embeds"], {"pixel_values": preprocess(image)})[0][0]
    vector = np.asarray(output, dtype=np.float32)
    norm = np.linalg.norm(vector)
    return vector / (norm if norm else 1.0)


@lru_cache(maxsize=MAX_CANDIDATES * 4)
def cached_candidate_embedding(pet_id: str, image_ref: str, image_url: str) -> np.ndarray:
    # image_ref is stable (normally the cloud fileID), while image_url is a
    # short-lived signed URL. This avoids recomputing gallery vectors per request.
    del pet_id
    return image_embedding(fetch_image(image_url))


@app.get("/healthz")
def healthz():
    return {"ok": True, "model": MODEL_ID}


@app.post("/v1/clip/match")
def match(request: MatchRequest, x_clip_service_token: str | None = Header(default=None)):
    if SERVICE_TOKEN and x_clip_service_token != SERVICE_TOKEN:
        raise HTTPException(status_code=401, detail="invalid service token")

    try:
        query = image_embedding(fetch_image(request.imageUrl))
        scores = []
        for candidate in request.candidates:
            try:
                image_ref = candidate.imageRef or candidate.imageUrl
                gallery = cached_candidate_embedding(candidate.petId, image_ref, candidate.imageUrl)
                score = float(np.dot(query, gallery))
                scores.append({"petId": candidate.petId, "score": score})
            except Exception:
                # One broken gallery image should not make all other candidates fail.
                continue
        scores.sort(key=lambda item: item["score"], reverse=True)
        return {"model": MODEL_ID, "matches": scores[: request.topK]}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"clip inference failed: {exc}") from exc
