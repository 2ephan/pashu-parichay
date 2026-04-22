
// Service for Teachable Machine (Local AI)
// This enables fast, offline-capable breed detection in the browser.

declare global {
  interface Window {
    tmImage: any;
  }
}

// Cache for multiple loaded models to support instant switching and auto-detection
const loadedModels = new Map<string, any>();

// Updated Model URLs provided by the research team
export const CATTLE_MODEL_URL = "https://teachablemachine.withgoogle.com/models/ldU5BjIdS/"; 
export const BUFFALO_MODEL_URL = "https://teachablemachine.withgoogle.com/models/2YGZ3ZZK0/";

export interface TMPrediction {
  className: string;
  probability: number;
}

/**
 * Checks if a specific model is already loaded in memory.
 */
export const isModelLoaded = (url: string) => {
  const baseURL = url.endsWith('/') ? url : url + '/';
  return loadedModels.has(baseURL);
};

/**
 * Loads a specific TM model by URL. Caches the model to avoid reloading.
 */
export const loadTMModel = async (url: string) => {
  if (!window.tmImage) {
    throw new Error("Teachable Machine library is not loaded. Please check your internet connection.");
  }

  if (!url || !url.startsWith("http")) {
      throw new Error("Invalid Model URL provided.");
  }

  // Normalize URL
  const baseURL = url.endsWith('/') ? url : url + '/';
  
  // Return cached model if available
  if (loadedModels.has(baseURL)) {
      return loadedModels.get(baseURL);
  }

  const modelURL = baseURL + "model.json";
  const metadataURL = baseURL + "metadata.json";

  try {
    // Load the new model
    const newModel = await window.tmImage.load(modelURL, metadataURL);
    
    // Cache the model
    loadedModels.set(baseURL, newModel);
    
    return newModel;
  } catch (error) {
    console.warn("Failed to load TM model:", error);
    throw new Error(`Could not load model from ${url}. Check connection.`);
  }
};

/**
 * Creates a square center-cropped canvas from a source element.
 * Resize to target dimensions (default 224x224).
 */
export const cropToSquare = (
  mediaElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement, 
  targetSize: number = 224
): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error("Could not create canvas context");

    let sourceWidth, sourceHeight;

    if (mediaElement instanceof HTMLVideoElement) {
        sourceWidth = mediaElement.videoWidth;
        sourceHeight = mediaElement.videoHeight;
    } else if (mediaElement instanceof HTMLImageElement) {
        sourceWidth = mediaElement.naturalWidth;
        sourceHeight = mediaElement.naturalHeight;
    } else {
        sourceWidth = mediaElement.width;
        sourceHeight = mediaElement.height;
    }

    // Calculate center crop dimensions
    let sx, sy, sSize;
    if (sourceWidth > sourceHeight) {
        // Landscape: crop width to match height
        sSize = sourceHeight;
        sx = (sourceWidth - sourceHeight) / 2;
        sy = 0;
    } else {
        // Portrait: crop height to match width
        sSize = sourceWidth;
        sx = 0;
        sy = (sourceHeight - sourceWidth) / 2;
    }

    // Draw cropped and resized image to canvas
    // Smoothing quality high for better AI inference
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(mediaElement, sx, sy, sSize, sSize, 0, 0, targetSize, targetSize);
    return canvas;
};

/**
 * Predicts using the specified model URL. 
 * Automatically adjusts input to match model's expected dimensions.
 */
export const predictTM = async (
    input: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement, 
    modelUrl: string
): Promise<TMPrediction[]> => {
  
  const model = await loadTMModel(modelUrl);
  
  // Get expected size from metadata or default to 224
  // This ensures we always match what the model expects
  const meta = model.getMetadata ? model.getMetadata() : {};
  const size = meta.imageSize || 224;

  let processedInput: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement = input;
  
  // Always ensure we have a square crop of the correct size
  // even if the input is already a canvas, it might be the wrong resolution
  processedInput = cropToSquare(input, size);

  const prediction = await model.predict(processedInput);
  return prediction.sort((a: any, b: any) => b.probability - a.probability);
};

/**
 * Pre-loads and warms up both models.
 * This ensures shaders are compiled and models are in memory.
 */
export const warmupModels = async () => {
    try {
        console.log("Starting background model warmup...");
        // 1. Load models
        await Promise.all([
            loadTMModel(CATTLE_MODEL_URL),
            loadTMModel(BUFFALO_MODEL_URL)
        ]);

        // 2. Warmup Inference (Compiles WebGL Shaders)
        const dummyCanvas = document.createElement('canvas');
        dummyCanvas.width = 224;
        dummyCanvas.height = 224;
        const ctx = dummyCanvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, 224, 224);
            // Run a dummy prediction on both
            await Promise.all([
                predictTM(dummyCanvas, CATTLE_MODEL_URL),
                predictTM(dummyCanvas, BUFFALO_MODEL_URL)
            ]);
        }
        console.log("Models warmed up and ready.");
        return true;
    } catch (e) {
        console.error("Warmup failed:", e);
        return false;
    }
};
