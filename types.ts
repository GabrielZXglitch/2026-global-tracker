
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
  isIn2027: boolean;
  localTime: string;
  timeTo2027: number; // in milliseconds (negative if already in 2027)
  offset: number;
}

export interface CelebrationInsight {
  country: string;
  tradition: string;
  greeting: string;
  funFact: string;
}

export interface AppTranslations {
  appTitle: string;
  liveUpdates: string;
  countriesIn2027: string;
  heroTitle: string;
  heroSubtitle: string;
  globalTransition: string;
  localTime: string;
  happyNewYear: string;
  days: string;
  hrs: string;
  min: string;
  sec: string;
  nextArrival: string;
  remaining: string;
  globalStatus: string;
  remainingCount: string;
  learnTraditions: string;
  searchPlaceholder: string;
  welcome: string;
  celebrating: string;
  countdownTitle: string;
  awaiting: string;
  noResults: string;
  footerText: string;
  poweredBy: string;
  disclaimer: string;
  cardLocalTime: string;
  cardStatus: string;
  cardCountdown: string;
  cardLive: string;
  cardToGo: string;
  insightTitle: string;
  insightCountry: string;
  insightGreeting: string;
  insightTradition: string;
  insightFunFact: string;
  insightGenerated: string;
  dayShort: string;
  timelineTitle: string;
}
