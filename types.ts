
export interface TimeZoneData {
  zone: string;
  country: string;
  code: string; // ISO 2-digit country code
  continent: string;
  offset: number; // in minutes
  cities: string[];
}

// Added offset property to support sorting and calculations in the UI
export interface TransitionStatus {
  zone: string;
  country: string;
  code: string;
  isIn2026: boolean;
  localTime: string;
  timeTo2026: number; // in milliseconds (negative if already in 2026)
  offset: number;
}

export interface CelebrationInsight {
  country: string;
  tradition: string;
  greeting: string;
  funFact: string;
}
