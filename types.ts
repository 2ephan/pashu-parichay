export enum AppView {
  HOME = 'HOME',
  SCANNER = 'SCANNER',
  TECHNICAL_DOCS = 'TECHNICAL_DOCS',
  BREED_INFO = 'BREED_INFO',
  CHAT = 'CHAT',
  LIVE_ASSISTANT = 'LIVE_ASSISTANT',
  YOLO_SEGMENT = 'YOLO_SEGMENT'
}

export interface AnalysisResult {
  breedName: string;
  confidence: number;
  species: 'Cattle' | 'Buffalo' | 'Unknown';
  physicalTraits: string[];
  identificationReasoning: string;
  origin: string;
  utility: string;
  // Extended Details
  milkYield?: string;
  weight?: string;
  lifespan?: string;
  temperament?: string;
}

export interface BreedInfo {
  id: string;
  name: string;
  type: 'Cattle' | 'Buffalo';
  origin: string;
  features: string[];
  imageUrl: string;
}

export const INDIAN_BREEDS: BreedInfo[] = [
  {
    id: 'gir',
    name: 'Gir',
    type: 'Cattle',
    origin: 'Gujarat',
    features: ['Convex forehead', 'Long pendulous ears', 'Red color'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Gir_cow_at_Junagadh.jpg/640px-Gir_cow_at_Junagadh.jpg'
  },
  {
    id: 'sahiwal',
    name: 'Sahiwal',
    type: 'Cattle',
    origin: 'Punjab/Pakistan',
    features: ['Reddish dun color', 'Loose skin (Lola)', 'Well developed udder'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Sahiwal_bull.jpg/640px-Sahiwal_bull.jpg'
  },
  {
    id: 'murrah',
    name: 'Murrah',
    type: 'Buffalo',
    origin: 'Haryana',
    features: ['Jet black color', 'Tightly curved horns', 'Short limbs'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Murrah_buffalo.jpg/640px-Murrah_buffalo.jpg'
  },
  {
    id: 'tharparkar',
    name: 'Tharparkar',
    type: 'Cattle',
    origin: 'Rajasthan',
    features: ['White/Grey color', 'Medium horns', 'Heat tolerant'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Tharparkar_Cow.jpg'
  }
];