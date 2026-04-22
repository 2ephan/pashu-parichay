# Install: pip install -r requirements.txt
import os
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
import uvicorn

app = FastAPI()

_MODEL_DIR = Path(__file__).resolve().parent
_DEFAULT_WEIGHTS = _MODEL_DIR / "best.pt"

# Enable CORS so the online web app can communicate with your local machine
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load weights shipped next to this server (model/best.pt)
_weights = Path(os.environ.get("YOLO_WEIGHTS", str(_DEFAULT_WEIGHTS)))
if not _weights.is_file():
    raise FileNotFoundError(f"YOLO weights not found: {_weights}")
model = YOLO(str(_weights))

_MAX_UPLOAD_BYTES = int(os.environ.get("YOLO_MAX_UPLOAD_MB", "8")) * 1024 * 1024

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/segment")
async def segment(file: UploadFile = File(...)):
    contents = await file.read()
    if len(contents) > _MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image too large")
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return {"detections": [], "error": "Could not decode image"}

    # Segment / detect on original resolution; boxes & mask polygons match image pixels
    results = model.predict(img, imgsz=640, conf=0.25, verbose=False)
    
    detections = []
    
    for r in results:
        boxes = r.boxes
        masks = r.masks
        
        if boxes is None: continue
            
        for i in range(len(boxes)):
            box = boxes[i].xyxy[0].tolist()       # [x1, y1, x2, y2]
            conf = float(boxes[i].conf[0])        # Confidence 0-1
            cls_id = int(boxes[i].cls[0])
            class_name = model.names[cls_id]      # Specific class name
            
            polygon = []
            if masks is not None and masks.xy is not None and i < len(masks.xy):
                polygon = masks.xy[i].tolist()  # [[x,y], ...] in image pixel space
                
            detections.append({
                "box": box,
                "confidence": conf,
                "class_name": class_name,
                "polygon": polygon
            })
            
    return {"detections": detections}

if __name__ == "__main__":
    # Start the local server
    uvicorn.run(app, host="0.0.0.0", port=8000)