import { GoogleGenAI, Modality } from "@google/genai";
import { AnalysisResult } from "../types";

let aiInstance: GoogleGenAI | null = null;

const readGeminiKey = () =>
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_GEMINI_API_KEY ||
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.API_KEY;

const getAiClient = () => {
  const key = readGeminiKey();
  if (!key) {
    throw new Error("Gemini API key is missing. Set GEMINI_API_KEY in .env.local.");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};

// Simple in-memory cache to prevent redundant API calls for the same image
const analysisCache = new Map<string, AnalysisResult>();

// Robust hash function for cache keys
const generateHash = (str: string): string => {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

// Generate a unique key based on image content
const generateCacheKey = (base64Data: string): string => {
    // Hash the entire string for accuracy, or a significant portion if performance is a concern.
    // For typical base64 images, hashing the first 1000, middle 1000 and last 1000 chars + length is usually sufficient and fast.
    const len = base64Data.length;
    const chunk1 = base64Data.substring(0, 1000);
    const chunk2 = base64Data.substring(Math.floor(len / 2), Math.floor(len / 2) + 1000);
    const chunk3 = base64Data.substring(len - 1000);
    return `img-${len}-${generateHash(chunk1 + chunk2 + chunk3)}`;
};

// Helper to identify quota/rate limit errors
const isQuotaError = (error: any) => {
    const errStr = JSON.stringify(error);
    return errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || error.status === 429;
};

// Helper to parse the JSON response safely
const parseResponse = (response: any): AnalysisResult => {
     const text = response.text || "";
     // Aggressively clean markdown code blocks which Gemini often adds
     const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
     try {
         return JSON.parse(cleanText) as AnalysisResult;
     } catch (e) {
         console.error("JSON Parse Error", text);
         return {
             breedName: "Analysis Failed",
             confidence: 0,
             species: "Unknown",
             physicalTraits: ["Parsing Error"],
             identificationReasoning: "The AI response could not be processed correctly. Please try again.",
             origin: "Unknown",
             utility: "Unknown"
         };
     }
};

/**
 * Analyzes an image or video to identify cattle breeds.
 * Implements a fallback strategy: Gemini 3 Pro -> Gemini 3 Flash.
 * Uses caching to avoid re-analyzing the same image.
 */
export const analyzeMedia = async (base64Data: string, mimeType: string = 'image/jpeg', filename?: string): Promise<AnalysisResult> => {
  const isVideo = mimeType.startsWith('video/');
  const ai = getAiClient();
  
  // 1. Check Cache
  const cacheKey = generateCacheKey(base64Data);
  if (analysisCache.has(cacheKey)) {
      console.log("Serving analysis from cache");
      return analysisCache.get(cacheKey)!;
  }
  
  // Refined prompt for clinical precision and strict confidence scoring
  const prompt = `
    Act as a senior Veterinary Geneticist and Show Judge specializing in Indian bovine breeds (Bos indicus and Bubalus bubalis). 
    Analyze the input ${isVideo ? 'video frame' : 'image'} to identify the specific breed with high precision.

    **Context Clues:**
    - **Filename:** "${filename || 'N/A'}" 
    - *Instruction:* Use the filename only as a weak hint. **Visual phenotype overrides filename.** If the image shows a black buffalo but filename says "cow.jpg", identify it as a Buffalo.

    **Diagnostic Markers (Indian Context):**
    - **Gir**: Distinctly convex (domed) forehead, long pendulous ears curled like a leaf (tubular), red or speckled red coat.
    - **Sahiwal**: Reddish-dun color, loose skin (Lola), massive hump, voluminous dewlap, short horns.
    - **Kankrej**: Silver-grey/Iron-grey, large lyre-shaped horns, heavy forequarters, "Sawai Chal" gait.
    - **Murrah (Buffalo)**: Jet black, short tightly curled horns (jalebi-like), wedge-shaped body.
    - **HF Cross (Crossbreed)**: Black and white patches, no hump or small hump, straight back. Common in India.
    - **Jersey Cross (Crossbreed)**: Brown/Fawn color, smaller size, dished face, no hump or small hump.

    **Decision Logic:**
    1. **Species Classification**: Is it Cattle (Cow), Buffalo, or Other/Unknown?
    2. **Purebred vs Crossbreed**: 
       - If it has a prominent hump and specific indigenous traits -> Indigenous.
       - If it lacks a hump (Bos taurus traits) or has mixed markers (e.g. Hump + HF colors) -> "Crossbreed".
    3. **Uncertainty Principle**: 
       - If image is blurry, too dark, or animal is obscured -> Confidence < 60%, Species "Unknown".
       - Do NOT guess.

    **Output Rules:**
    - Return **ONLY raw JSON**. 
    - No Markdown (\`\`\`json). No preamble.
    - Confidence must be an integer (0-100).

    **JSON Schema:**
    {
      "breedName": "Breed Name OR 'Crossbreed' OR 'Non-descript'",
      "confidence": Number,
      "species": "Cattle" | "Buffalo" | "Unknown",
      "physicalTraits": ["Trait 1", "Trait 2", "Trait 3"],
      "identificationReasoning": "Concise veterinary reasoning. Mention if filename matched or contradicted visual evidence.",
      "origin": "Region (e.g. Gujarat) or 'Mixed'",
      "utility": "Milch | Draft | Dual | Unknown",
      "milkYield": "e.g. 1500-2500 kg (or N/A)",
      "weight": "e.g. 400-500 kg (or N/A)",
      "lifespan": "e.g. 12-15 years",
      "temperament": "Docile | Aggressive | Moderate"
    }
  `;

  try {
    let result: AnalysisResult;

    // Attempt 1: Gemini 2.5 Flash (stable multimodal for image analysis)
    try {
        const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            {
            parts: [
                { inlineData: { mimeType: mimeType, data: base64Data } },
                { text: prompt }
            ]
            }
        ],
        config: {
            temperature: 0.1,
            responseMimeType: "application/json"
        }
        });
        result = parseResponse(response);
    } catch (error: any) {
        console.warn("Gemini 2.5 Flash failed, retrying with 3 Flash:", error);
        
        // Attempt 2: Gemini 3 Flash fallback
        const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
            {
                parts: [
                { inlineData: { mimeType: mimeType, data: base64Data } },
                { text: prompt }
                ]
            }
            ],
            config: {
                temperature: 0.1,
                responseMimeType: "application/json"
            }
        });
        result = parseResponse(fallbackResponse);
    }

    // 2. Cache the successful result (if confidence is decent)
    if (result.confidence > 0 && result.species !== 'Unknown') {
        analysisCache.set(cacheKey, result);
        // Limit cache size to prevent memory leaks (keep last 20)
        if (analysisCache.size > 20) {
            const firstKey = analysisCache.keys().next().value;
            if (firstKey) analysisCache.delete(firstKey);
        }
    }

    return result;

  } catch (error: any) {
    console.error("Error analyzing media:", error);
    const errStr = JSON.stringify(error);
    if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED")) {
         throw new Error("⚠️ High Traffic: Daily AI limit reached. Please use 'Fast Mode' (Offline) for now.");
    }
    throw new Error("Analysis failed. Please try again or switch to Fast Mode.");
  }
};

export const createChatSession = () => {
  const ai = getAiClient();
  return ai.chats.create({
    model: 'gemini-3-flash-preview', // Changed to Flash for Chat to save Pro quota for image analysis
    config: {
      temperature: 0.4, // Slightly higher for chat to be conversational but still factual
      systemInstruction: "You are PashuParichay's expert AI veterinary assistant. You help farmers and users identify cattle breeds, understand cattle health, nutrition, and breeding management in the context of Indian agriculture. Be helpful, concise, and encourage consulting a real vet for medical emergencies.",
    }
  });
};

export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: { parts: [{ text }] },
        config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        }
        }
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");

    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error: any) {
    console.error("TTS Error:", error);
    throw error; 
  }
};

/**
 * Uses Search Grounding to find recent news or market info about a breed.
 */
export const searchBreedInfo = async (breedName: string) => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the latest market price trends and recent news related to ${breedName} cattle/buffalo in India. Provide a brief summary.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Search error:", error);
    return null;
  }
};

/**
 * Generic search using Gemini Flash with Google Search Grounding.
 */
export const searchGeneral = async (query: string) => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Answer this query about Indian cattle/agriculture using Google Search for up-to-date info: ${query}`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Search error:", error);
    throw new Error("Failed to perform search.");
  }
};

/**
 * Uses Maps Grounding to find nearby veterinary services.
 */
export const findNearbyVets = async (lat: number, lng: number) => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Find the top 3 veterinary clinics or animal hospitals near me. List their names and ratings.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });

    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Maps error:", error);
    return null;
  }
};

const breedDetailsCache = new Map<string, Partial<AnalysisResult>>();

export const getBreedDetailsAI = async (breedName: string, species: string): Promise<Partial<AnalysisResult>> => {
    const key = `${species.toLowerCase()}::${breedName.toLowerCase()}`;
    const cached = breedDetailsCache.get(key);
    if (cached) return cached;

    try {
        const ai = getAiClient();
        const prompt = `Provide concise, realistic details for the Indian ${species} breed known as "${breedName}". Return ONLY a JSON object exactly matching this schema, no markdown or text outside it:
        {
            "origin": "Short region name",
            "utility": "Milch | Draft | Dual",
            "physicalTraits": ["Trait 1", "Trait 2", "Trait 3"],
            "identificationReasoning": "Brief overview of its key identifiers and importance.",
            "milkYield": "e.g., 1000-2000 kg",
            "weight": "e.g., 400-500 kg",
            "lifespan": "e.g., 12-15 years",
            "temperament": "Docile | Moderate | Aggressive"
        }`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                temperature: 0.1,
                responseMimeType: "application/json"
            }
        });

        const cleanText = (response.text || "").replace(/```json/g, '').replace(/```/g, '').trim();
        const raw = JSON.parse(cleanText) as Partial<AnalysisResult>;
        // Normalize common null/shape issues so UI never renders "null".
        const parsed: Partial<AnalysisResult> = {
            origin: raw.origin ?? undefined,
            utility: raw.utility ?? undefined,
            identificationReasoning: raw.identificationReasoning ?? undefined,
            milkYield: raw.milkYield ?? undefined,
            weight: raw.weight ?? undefined,
            lifespan: raw.lifespan ?? undefined,
            temperament: raw.temperament ?? undefined,
            physicalTraits: Array.isArray(raw.physicalTraits) ? raw.physicalTraits.filter(Boolean) : undefined,
        };
        breedDetailsCache.set(key, parsed);
        if (breedDetailsCache.size > 100) {
            const first = breedDetailsCache.keys().next().value;
            if (first) breedDetailsCache.delete(first);
        }
        return parsed;
    } catch(e) {
        console.error("AI Details failed", e);
        return {};
    }
};

export const getVisionBoundingBoxes = async (base64Data: string, mimeType: string = 'image/jpeg') => {
  try {
    const ai = getAiClient();
    const prompt = `Detect cattle, cows, buffaloes, or animals in this image. Return ONLY a valid JSON object matching this schema exactly, and nothing else (no markdown tags):
    {
      "detections": [
        {
          "box": [x1, y1, x2, y2], 
          "class_name": "String (e.g. 'Cow', 'Buffalo')",
          "confidence": 0.95
        }
      ]
    }
    The 'box' coordinates MUST be absolute pixel values based on the original image dimensions, or normalized [0-1] coordinates if you prefer but state it clearly (assume [ymin, xmin, ymax, xmax] normalized to 1000, so divide by 1000 to get relative). Just give me [ymin_normalized, xmin_normalized, ymax_normalized, xmax_normalized] mapped between 0.0 and 1.0.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt }
          ]
        }
      ],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    const cleanText = (response.text || "").replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch(e) {
    console.error("Bounding Box Detection failed", e);
    return null;
  }
};

export const aiClient = {
  get live() {
    return getAiClient().live;
  },
};