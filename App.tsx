import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { TIMEZONES, TARGET_DATE_UTC, TARGET_YEAR, LANGUAGES, TRANSLATIONS, Language } from './constants';
import { TransitionStatus, CelebrationInsight, AppTranslations } from './types';
import TimeCard from './components/TimeCard';
import InsightPanel from './components/InsightPanel';
import Fireworks from './components/Fireworks';
import Background from './components/Background';
import Timeline from './components/Timeline';
import { getCelebrationInsight } from './services/geminiService';
import { 
  initAudio, 
  playCelebrationSound, 
  playCountdownBeep, 
  playTick, 
  playRandomEffect 
} from './services/audioService';
import { Globe, Timer, Search, LayoutGrid, List, MapPin, Sparkles, CheckCircle2, Clock, ChevronRight, Languages as LangIcon, Sun, Moon } from 'lucide-react';

const formatFullCountdownParts = (ms: number) => {
  if (ms <= 0) return { days: "00", hours: "00", minutes: "00", seconds: "00" };
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const pad = (n: number) => n.toString().padStart(2, '0');
  return { 
    days: pad(days), 
    hours: pad(hours), 
    minutes: pad(minutes), 
    seconds: pad(seconds) 
  };
};

const App: React.FC = () => {
  const [now, setNow] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [insight, setInsight] = useState<CelebrationInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [localStatus, setLocalStatus] = useState<TransitionStatus | null>(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const lastAudioSecondRef = useRef<number>(-1);

  const hasCelebratedRef = useRef<boolean>(false);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const isDark = theme === 'dark';

  // Language State: Initialize based on device language
  const [language, setLanguage] = useState<Language>(() => {
    try {
      if (typeof navigator === 'undefined') return 'en';
      const browserLang = navigator.language.split('-')[0];
      const isSupported = LANGUAGES.some(l => l.code === browserLang);
      return isSupported ? (browserLang as Language) : 'en';
    } catch {
      return 'en';
    }
  });
  
  const t: AppTranslations = TRANSLATIONS[language];

  // Initialize audio context on first user interaction to unlock audio
  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
    };
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Update real-time clock
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Calculate statuses for all tracked zones based on now
  const statuses = useMemo(() => {
    return TIMEZONES.map(tz => {
      const formatter = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : language, {
        timeZone: tz.zone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      const localTimeStr = formatter.format(now);
      const zoneStartUTC = TARGET_DATE_UTC - (tz.offset * 60 * 1000);
      const timeTo2027 = zoneStartUTC - now.getTime();
      const isIn2027 = timeTo2027 <= 0;

      return {
        ...tz,
        isIn2027,
        localTime: localTimeStr,
        timeTo2027,
        offset: tz.offset
      } as TransitionStatus;
    }).sort((a, b) => b.offset - a.offset);
  }, [now, language]);

  // Handle local timezone detection, precise countdown, and audio cues
  useEffect(() => {
    try {
      const userZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const formatter = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : language, {
        timeZone: userZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const localTimeStr = formatter.format(now);
      const isIn2027 = now.getFullYear() >= TARGET_YEAR;
      
      const startOf2027Local = new Date(TARGET_YEAR, 0, 1, 0, 0, 0);
      const timeTo2027 = startOf2027Local.getTime() - now.getTime();
      const userOffset = -new Date().getTimezoneOffset();

      // --- AUDIO CUES ---
      if (timeTo2027 > 0 && timeTo2027 <= 60000) {
        // Use ceil so 9.5s remaining counts as "10"
        const currentSecond = Math.ceil(timeTo2027 / 1000);
        
        if (currentSecond !== lastAudioSecondRef.current) {
             if (currentSecond <= 10) {
                 // Final 10 seconds: Countdown Beep
                 playCountdownBeep();
             } else {
                 // Final Minute (60s to 11s): Subtle Tick
                 playTick();
             }
             lastAudioSecondRef.current = currentSecond;
        }
      }

      setLocalStatus({
        zone: userZone,
        country: 'Local Horizon',
        code: 'UN', 
        isIn2027,
        localTime: localTimeStr,
        timeTo2027,
        offset: userOffset
      });
    } catch (e) {
      console.warn("Could not determine local timezone");
    }
  }, [now, language]);

  // Trigger fireworks and celebration sound
  useEffect(() => {
    if (localStatus?.isIn2027) {
      if (!hasCelebratedRef.current) {
        hasCelebratedRef.current = true;
        setShowFireworks(true);
        playCelebrationSound();
        const timer = window.setTimeout(() => {
          setShowFireworks(false);
        }, 20000);
        return () => window.clearTimeout(timer);
      }
    } else {
      hasCelebratedRef.current = false;
      setShowFireworks(false);
    }
  }, [localStatus?.isIn2027]);

  // Random Atmospheric Sounds during Fireworks
  useEffect(() => {
    if (showFireworks) {
        const interval = window.setInterval(() => {
            // Increased frequency for better effect (50% chance every 600ms)
            if (Math.random() > 0.5) {
                playRandomEffect();
            }
        }, 600);
        return () => window.clearInterval(interval);
    }
  }, [showFireworks]);

  const handleCountryClick = useCallback(async (country: string) => {
    setSelectedCountry(country);
    setLoadingInsight(true);
    const selectedLangLabel = LANGUAGES.find(l => l.code === language)?.label || 'English';
    const result = await getCelebrationInsight(country, selectedLangLabel);
    setInsight(result);
    setLoadingInsight(false);
  }, [language]);

  const filteredStatuses = useMemo(() => {
    return statuses.filter(s => 
      s.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.zone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [statuses, searchTerm]);

  const arrivedCountries = useMemo(() => filteredStatuses.filter(s => s.isIn2027), [filteredStatuses]);
  const upcomingCountries = useMemo(() => filteredStatuses.filter(s => !s.isIn2027), [filteredStatuses]);

  const stats = useMemo(() => {
    const in2027 = statuses.filter(s => s.isIn2027).length;
    return {
      in2027,
      remaining: statuses.length - in2027,
      next: statuses.find(s => !s.isIn2027)
    };
  }, [statuses]);

  // Breakdown for Hero Animation
  const countdownParts = localStatus 
    ? formatFullCountdownParts(localStatus.timeTo2027) 
    : { days: "00", hours: "00", minutes: "00", seconds: "00" };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`min-h-screen selection:bg-blue-500/30 relative ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      <Background theme={theme} />
      {showFireworks && <Fireworks />}
      
      {/* GLASS HEADER */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-all duration-500 ${isDark ? 'bg-black/10 border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]' : 'bg-white/90 border-slate-200 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ring-1 transition-all bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-900/20 ring-white/10 backdrop-blur-md`}>
              <Globe className="text-white" size={24} />
            </div>
            <div>
              <h1 className={`text-xl font-black tracking-tight bg-clip-text text-transparent ${isDark ? 'bg-gradient-to-r from-white to-slate-400' : 'bg-gradient-to-r from-slate-900 to-slate-600'}`}>
                {t.appTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className={`hidden md:flex items-center gap-6 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-lg transition-colors ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="w-2 h-2 rounded-full animate-pulse bg-emerald-500"></div>
                  <span>{t.liveUpdates}</span>
                </div>
                <div className="flex items-center gap-2">
                 <span className={isDark ? 'text-white' : 'text-slate-900'}>{stats.in2027}</span> {t.countriesIn2027}
                </div>
            </div>

            {/* Theme Toggle */}
            <button 
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors backdrop-blur-md ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200 shadow-sm'}`}
                aria-label="Toggle theme"
            >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Language Selector */}
            <div className="relative group">
                <div className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors backdrop-blur-md border border-transparent ${isDark ? 'hover:bg-white/10' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'}`}>
                    <LangIcon size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                    <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as Language)}
                        className={`bg-transparent text-sm font-medium outline-none cursor-pointer appearance-none pr-4 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code} className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-900'}>
                                {lang.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* LIQUID GLASS HERO CARD */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`lg:col-span-2 relative overflow-hidden backdrop-blur-xl rounded-3xl p-8 border shadow-2xl group transition-all duration-500 ${isDark ? 'bg-slate-900/30 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]' : 'bg-white border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.05)]'}`}>
            {/* Glossy sheen */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 text-blue-500 rounded-full border border-blue-500/20 text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md">
                <Sparkles size={14} />
                {t.globalTransition}
              </div>
              <h2 className={`text-4xl md:text-5xl lg:text-6xl font-black mb-2 tracking-tight drop-shadow-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.heroTitle}</h2>
              <p className={`max-w-lg mb-8 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>{t.heroSubtitle}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {localStatus && (
                  <div className={`backdrop-blur-2xl p-6 rounded-2xl border transition-all duration-500 shadow-lg ${
                    localStatus.isIn2027 
                      ? (isDark ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-emerald-50/20 border-emerald-100 shadow-emerald-500/10') 
                      : (isDark ? 'bg-black/20 border-white/10 hover:border-white/20' : 'bg-white border-slate-200 shadow-sm')
                  }`}>
                    <p className={`text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2 ${
                      localStatus.isIn2027 ? 'text-emerald-500' : (isDark ? 'text-slate-400' : 'text-slate-500')
                    }`}>
                      <MapPin size={14} className={localStatus.isIn2027 ? "text-emerald-500" : "text-blue-500"} /> {t.localTime}
                    </p>
                    
                    {/* ANIMATED COUNTDOWN DISPLAY */}
                    <div className="flex flex-col">
                        {localStatus.isIn2027 ? (
                           <span className="text-4xl md:text-6xl font-mono font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600 animate-pop py-4">
                             {t.happyNewYear}
                           </span>
                        ) : (
                           // New Countdown Layout
                           <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 py-2">
                               {/* Days */}
                               <div className={`flex flex-col items-center p-3 sm:p-4 rounded-xl border backdrop-blur-xl min-w-[80px] sm:min-w-[100px] shadow-lg ${isDark ? 'bg-slate-900/40 border-white/10' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                                   <span key={countdownParts.days} className={`text-5xl sm:text-6xl md:text-7xl font-mono font-black tracking-tighter animate-slide-up block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                       {countdownParts.days}
                                   </span>
                                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{t.days}</span>
                               </div>

                               {/* Hours */}
                               <div className={`flex flex-col items-center p-3 sm:p-4 rounded-xl border backdrop-blur-xl min-w-[80px] sm:min-w-[100px] shadow-lg ${isDark ? 'bg-slate-900/40 border-white/10' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                                   <span key={countdownParts.hours} className={`text-5xl sm:text-6xl md:text-7xl font-mono font-black tracking-tighter animate-slide-up block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                       {countdownParts.hours}
                                   </span>
                                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{t.hrs}</span>
                               </div>

                               {/* Minutes */}
                               <div className={`flex flex-col items-center p-3 sm:p-4 rounded-xl border backdrop-blur-xl min-w-[80px] sm:min-w-[100px] shadow-lg ${isDark ? 'bg-slate-900/40 border-white/10' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                                   <span key={countdownParts.minutes} className={`text-5xl sm:text-6xl md:text-7xl font-mono font-black tracking-tighter animate-slide-up block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                       {countdownParts.minutes}
                                   </span>
                                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{t.min}</span>
                               </div>

                               {/* Seconds */}
                               <div className={`flex flex-col items-center p-3 sm:p-4 rounded-xl border backdrop-blur-xl min-w-[80px] sm:min-w-[100px] shadow-lg relative overflow-hidden ${isDark ? 'bg-gradient-to-b from-slate-900/40 to-amber-900/20 border-amber-500/20 shadow-amber-900/10' : 'bg-white border-amber-200 shadow-amber-100/50'}`}>
                                   <div className="absolute inset-0 bg-amber-500/5"></div>
                                   <span key={countdownParts.seconds} className="text-5xl sm:text-6xl md:text-7xl font-mono font-black text-gradient-gold tracking-tighter animate-slide-up block relative z-10">
                                       {countdownParts.seconds}
                                   </span>
                                   <span className="text-[10px] text-amber-500/80 font-bold uppercase tracking-widest mt-1 relative z-10">{t.sec}</span>
                               </div>
                           </div>
                        )}
                    </div>

                    {!localStatus.isIn2027 && (
                      <div className={`mt-4 pt-4 border-t flex items-center gap-2 ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                        <Clock size={14} className="text-slate-500" />
                        <span key={localStatus.localTime} className={`text-xs font-mono animate-slide-up ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{localStatus.localTime}</span>
                      </div>
                    )}
                  </div>
                )}

                {stats.next && (
                  <div className={`backdrop-blur-2xl p-6 rounded-2xl border shadow-xl transition-all relative overflow-hidden group/next cursor-pointer ${isDark ? 'bg-blue-600/10 border-blue-500/10 hover:bg-blue-600/20' : 'bg-white border-blue-100 hover:border-blue-300 shadow-sm'}`} onClick={() => handleCountryClick(stats.next!.country)}>
                    {/* Decorative glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none group-hover/next:bg-blue-500/20 transition-colors"></div>

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <p className="text-xs text-blue-500 uppercase tracking-widest font-bold flex items-center gap-2">
                          <Timer size={14} /> {t.nextArrival}
                        </p>
                        <div className={`p-1 rounded-full transition-colors backdrop-blur-md ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'}`}>
                           <ChevronRight size={14} className="text-blue-400" />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-5">
                        <div className={`w-14 h-10 rounded-md overflow-hidden shadow-lg border flex-shrink-0 relative ${isDark ? 'border-white/10' : 'border-slate-200 bg-white'}`}>
                           <img 
                              src={`https://flagcdn.com/w160/${stats.next.code.toLowerCase()}.png`}
                              alt={stats.next.country}
                              className="w-full h-full object-cover"
                           />
                           <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-md"></div>
                        </div>
                        <div className="min-w-0">
                           <p className={`text-2xl font-black truncate leading-none mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.next.country}</p>
                           <p className={`text-xs truncate font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{stats.next.zone}</p>
                        </div>
                      </div>

                      <div className={`flex items-end gap-2 font-mono mb-4 ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>
                         {(() => {
                           const parts = formatFullCountdownParts(stats.next.timeTo2027);
                           const displayTime = parts.days !== "00" 
                              ? `${parts.days}${t.dayShort} ${parts.hours}h ${parts.minutes}m` 
                              : `${parts.hours}:${parts.minutes}:${parts.seconds}`;
                           
                           return (
                             <span className={`text-3xl font-bold tabular-nums tracking-tight animate-tick ${isDark ? 'text-white' : 'text-slate-900'}`}>
                               {displayTime}
                             </span>
                           );
                         })()}
                         <span className="mb-1.5 text-xs font-bold uppercase tracking-wider opacity-60">{t.remaining}</span>
                      </div>

                      <div className="mt-auto">
                        <div className={`h-1.5 w-full rounded-full overflow-hidden border ${isDark ? 'bg-slate-900/50 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                           <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 animate-pulse-slow" style={{ width: '65%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Subtle glow effects behind hero */}
            <div className={`absolute top-0 right-0 w-[500px] h-[500px] blur-[120px] rounded-full pointer-events-none ${isDark ? 'bg-blue-600/10' : 'bg-blue-200/20'}`}></div>
            <div className={`absolute bottom-0 left-0 w-[400px] h-[400px] blur-[100px] rounded-full pointer-events-none ${isDark ? 'bg-indigo-600/10' : 'bg-indigo-200/20'}`}></div>
          </motion.div>

          {/* LIQUID GLASS STATUS PANEL */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`backdrop-blur-xl rounded-3xl p-6 border flex flex-col justify-between shadow-xl ${isDark ? 'bg-slate-900/30 border-white/10' : 'bg-white border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.05)]'}`}>
            <div>
              <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.globalStatus}</h3>
              <div className="space-y-4">
                <div className={`flex justify-between items-center p-3 rounded-xl border backdrop-blur-md ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.countriesIn2027}</span>
                  <span className="text-xl font-bold text-emerald-500 animate-pop" key={stats.in2027}>{stats.in2027}</span>
                </div>
                <div className={`flex justify-between items-center p-3 rounded-xl border backdrop-blur-md ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.remainingCount}</span>
                  <span className="text-xl font-bold text-blue-500 animate-pop" key={stats.remaining}>{stats.remaining}</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                {t.disclaimer}
              </p>
              <button 
                onClick={() => handleCountryClick(stats.next?.country || 'Kiribati')}
                className={`w-full py-3 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg backdrop-blur-sm ${isDark ? 'bg-white text-black hover:bg-slate-200 shadow-white/5' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'}`}
              >
                {t.learnTraditions}
              </button>
            </div>
          </motion.div>
        </div>

        {/* TIMELINE COMPONENT */}
        <Timeline 
          timezones={TIMEZONES}
          currentTime={now.getTime()}
          statuses={statuses}
          t={t}
          theme={theme}
        />

        {/* Search & View Controls */}
        <div className={`flex flex-col md:flex-row gap-4 mb-8 items-center justify-between sticky top-20 z-30 p-2 -mx-2 rounded-2xl backdrop-blur-xl border transition-colors shadow-lg ${isDark ? 'bg-black/20 border-white/10 shadow-black/10' : 'bg-white/90 border-slate-200 shadow-sm'}`}>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder={t.searchPlaceholder}
              className={`w-full border rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600 ${isDark ? 'bg-slate-900/60 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900 focus:bg-white'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={`flex items-center gap-2 p-1 rounded-xl border ${isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white border-slate-200'}`}>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? (isDark ? 'bg-white text-black shadow-lg' : 'bg-slate-100 text-slate-900 shadow-inner') : 'text-slate-400 hover:text-slate-500'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? (isDark ? 'bg-white text-black shadow-lg' : 'bg-slate-100 text-slate-900 shadow-inner') : 'text-slate-400 hover:text-slate-500'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-12">
          {/* Section: Arrived in 2027 */}
          {arrivedCountries.length > 0 && (
            <motion.section 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500 border border-emerald-500/20 backdrop-blur-sm">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.welcome}</h2>
                  <p className="text-sm text-slate-500 mt-1">{arrivedCountries.length} {t.celebrating}</p>
                </div>
              </div>
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
                : "space-y-3"
              }>
                {arrivedCountries.map((s) => (
                  <TimeCard 
                    key={s.zone} 
                    status={s} 
                    onClick={handleCountryClick}
                    isSelected={selectedCountry === s.country}
                    isNext={s.country === stats.next?.country}
                    variant={viewMode}
                    t={t}
                    theme={theme}
                  />
                ))}
              </div>
            </motion.section>
          )}

          {/* Section: Counting Down */}
          {upcomingCountries.length > 0 && (
            <motion.section 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100"
            >
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500 border border-blue-500/20 backdrop-blur-sm">
                  <Clock size={24} />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.countdownTitle}</h2>
                  <p className="text-sm text-slate-500 mt-1">{upcomingCountries.length} {t.awaiting}</p>
                </div>
              </div>
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
                : "space-y-3"
              }>
                {upcomingCountries.map((s) => (
                  <TimeCard 
                    key={s.zone} 
                    status={s} 
                    onClick={handleCountryClick}
                    isSelected={selectedCountry === s.country}
                    isNext={s.country === stats.next?.country}
                    variant={viewMode}
                    t={t}
                    theme={theme}
                  />
                ))}
              </div>
            </motion.section>
          )}

          {filteredStatuses.length === 0 && (
            <div className={`text-center py-20 rounded-3xl border border-dashed ${isDark ? 'bg-slate-900/20 border-white/5' : 'bg-white border-slate-300'}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <Search className="text-slate-500" />
              </div>
              <p className="text-slate-400 font-medium">{t.noResults}</p>
            </div>
          )}
        </div>
      </main>

      <InsightPanel 
        insight={insight} 
        loading={loadingInsight} 
        onClose={() => {
          setInsight(null);
          setSelectedCountry(null);
        }}
        t={t}
        theme={theme}
      />

      <footer className={`mt-20 border-t py-12 px-4 backdrop-blur-xl relative z-10 ${isDark ? 'border-white/5 bg-slate-950/60' : 'border-slate-200 bg-white/70'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-white shadow-sm border border-slate-200'}`}>
              <Globe className="text-slate-400" size={24} />
            </div>
            <div>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.appTitle}</p>
              <p className="text-sm text-slate-500 font-medium">{t.footerText}</p>
            </div>
          </div>
          <div className="text-sm text-slate-600 text-center md:text-right">
            <p>© {new Date().getFullYear()} Global Horizons. {t.poweredBy}</p>
            <p className="mt-1">{t.disclaimer}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;