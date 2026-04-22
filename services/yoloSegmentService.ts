/**
 * Calls the local Ultralytics YOLO server (model/server.py).
 * In dev, Vite proxies /api -> http://127.0.0.1:8000.
 */
const segmentUrl =
  (import.meta.env.VITE_YOLO_API_BASE as string | undefined)?.replace(/\/$/, '') ?? '/api';

export type YoloPolygonPoint = [number, number];

export type YoloDetection = {
  box: [number, number, number, number]; // xyxy pixels
  confidence: number;
  class_name: string;
  polygon: YoloPolygonPoint[];
};

export type YoloSegmentResponse = {
  detections: YoloDetection[];
  error?: string;
};

const segmentFetch = (body: FormData, signal?: AbortSignal) =>
  fetch(`${segmentUrl}/segment`, {
    method: 'POST',
    body,
    signal,
  });

export async function pingYoloServer(): Promise<boolean> {
  try {
    const res = await fetch(`${segmentUrl}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function runYoloSegment(image: Blob): Promise<YoloSegmentResponse | null> {
  const body = new FormData();
  body.append('file', image, 'image.jpg');

  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), 120_000);

  try {
    const res = await segmentFetch(body, ctrl.signal);
    if (!res.ok) {
      console.error('YOLO segment HTTP', res.status, await res.text());
      return null;
    }
    return (await res.json()) as YoloSegmentResponse;
  } catch (e) {
    console.error('YOLO segment request failed', e);
    return null;
  } finally {
    window.clearTimeout(t);
  }
}
