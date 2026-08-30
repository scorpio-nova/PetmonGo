FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY backend/clip-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/clip-service/app.py ./
COPY project/models/Xenova/clip-vit-base-patch32/onnx/vision_model_quantized.onnx /models/vision_model_quantized.onnx
EXPOSE 8080
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8080}"]
