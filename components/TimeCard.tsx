
import React from 'react';
import { motion } from 'motion/react';
import { TransitionStatus, AppTranslations } from '../types';
import { Clock, CheckCircle2, Timer, Info, CalendarPlus } from 'lucide-react';
import { downloadCalendarEvent } from '../services/calendarService';

interface TimeCardProps {
  status: TransitionStatus;
  onClick: (country: string) => void;
  isSelected: boolean;
  isNext?: boolean;
  variant?: 'grid' | 'list';
  t: AppTranslations;
  theme: 'dark' | 'light';
}

const formatRemainingCompact = (ms: number, dayLabel: string) => {
  if (ms <= 0) return "IN 2027!";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Compact format: "3d 04:20:10" or "04:20:10"
  if (days > 0) return `${days}${dayLabel} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const TimeCard: React.FC<TimeCardProps> = ({ status, onClick, isSelected, isNext, variant = 'grid', t, theme }) => {
  // Extract time and date from the localized string
  // Assumes format roughly contains HH:mm:ss due to app configuration
  const timeMatch = status.localTime.match(/\d{2}:\d{2}:\d{2}/);
  const timePart = timeMatch ? timeMatch[0] : status.localTime.split(',').pop()?.trim() || "";
  
  let datePart = status.localTime.replace(timePart, '').trim();
  // Clean up separators
  if (datePart.endsWith(',')) datePart = datePart.slice(0, -1).trim();
  if (datePart.startsWith(',')) datePart = datePart.slice(1).trim();

  const isList = variant === 'list';
  const remainingText = formatRemainingCompact(status.timeTo2027, t.dayShort);
  const isDark = theme === 'dark';

  const handleCalendarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadCalendarEvent(status);
  };

  const buttonClass = `p-1 rounded-full transition-colors ${
    isDark 
      ? 'text-slate-500 hover:bg-white/10 hover:text-blue-400' 
      : 'text-slate-400 hover:bg-slate-100 hover:text-blue-500'
  }`;

  if (isList) {
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => onClick(status.country)}
        className={`relative overflow-hidden cursor-pointer transition-all duration-300 p-3 rounded-lg border flex items-center justify-between gap-4 backdrop-blur-xl hover:shadow-lg ${
          status.isIn2027 
            ? (isDark ? 'bg-emerald-950/30 border-emerald-500/30 hover:bg-emerald-900/40' : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100')
            : (isNext 
                ? (isDark ? 'bg-blue-900/30 border-blue-400/60 ring-1 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.25)]' : 'bg-white border-blue-300 ring-1 ring-blue-200 shadow-sm')
                : (isDark ? 'bg-slate-900/30 border-white/5 hover:border-white/20 hover:bg-slate-800/40' : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm')
              )
        } ${isSelected ? 'ring-2 ring-blue-500' : ''} group`}
      >
        {/* Left: Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex-shrink-0 w-8 h-6 rounded flex items-center justify-center border overflow-hidden shadow-sm ${isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'}`}>
            <img 
              src={`https://flagcdn.com/w80/${status.code.toLowerCase()}.png`}
              alt={`${status.country} flag`}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
            />
          </div>
          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-bold tracking-tight leading-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {status.country}
                {isNext && <span className="ml-2 inline-flex items-center rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-500 ring-1 ring-inset ring-blue-500/20">NEXT</span>}
              </h3>
              {status.isIn2027 ? (
                <CheckCircle2 className="text-emerald-500 w-4 h-4 animate-pulse md:hidden" />
              ) : (
                <Timer className={`w-4 h-4 md:hidden ${isNext ? 'text-blue-400' : 'text-blue-500'}`} />
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className={`text-[10px] font-mono truncate opacity-70 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{status.zone}</p>
              {/* Mobile Actions */}
              <div className="flex md:hidden items-center gap-1">
                <button
                    onClick={(e) => {
                    e.stopPropagation();
                    onClick(status.country);
                    }}
                    className={`p-0.5 rounded-full transition-colors ${isDark ? 'text-slate-500 hover:text-blue-400' : 'text-slate-400 hover:text-blue-500'}`}
                    aria-label={t.learnTraditions}
                >
                    <Info size={12} />
                </button>
                <button
                    onClick={handleCalendarClick}
                    className={`p-0.5 rounded-full transition-colors ${isDark ? 'text-slate-500 hover:text-blue-400' : 'text-slate-400 hover:text-blue-500'}`}
                    aria-label="Add to Calendar"
                >
                    <CalendarPlus size={12} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-1">
            <button
                onClick={handleCalendarClick}
                className={buttonClass}
                title="Add to Calendar"
            >
                <CalendarPlus size={16} />
            </button>
            <button
                onClick={(e) => {
                e.stopPropagation();
                onClick(status.country);
                }}
                className={buttonClass}
                title={t.learnTraditions}
            >
                <Info size={16} />
            </button>
          </div>
        </div>

        {/* Right: Data */}
        <div className="flex items-center gap-6 flex-shrink-0">
          {/* Local Time + Date (Hidden on very small screens to save space) */}
          <div className={`hidden sm:flex flex-col items-end justify-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <div className="flex items-center gap-2">
                <Clock size={14} />
                <span key={timePart} className="text-xs font-mono font-medium animate-tick tabular-nums">{timePart}</span>
            </div>
            <span className="text-[10px] opacity-70">{datePart}</span>
          </div>

          {/* Countdown/Status */}
          <div className="text-right min-w-[80px]">
             <div className="flex items-center justify-end gap-2 mb-0.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${status.isIn2027 ? 'text-emerald-500' : (isDark ? 'text-slate-500' : 'text-slate-500')}`}>
                  {status.isIn2027 ? t.cardLive : t.cardToGo}
                </span>
                {status.isIn2027 ? (
                  <CheckCircle2 className="text-emerald-500 w-3 h-3 hidden md:block" />
                ) : (
                  <Timer className={`w-3 h-3 hidden md:block ${isNext ? 'text-blue-400' : 'text-blue-500'}`} />
                )}
             </div>
             <p key={remainingText} className={`text-sm font-mono font-bold tracking-tight tabular-nums animate-slide-up ${status.isIn2027 ? 'text-emerald-500' : (isNext ? 'text-blue-400' : 'text-blue-500')}`}>
                {remainingText}
             </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid Variant (Default)
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => onClick(status.country)}
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 p-4 rounded-xl border backdrop-blur-xl hover:shadow-xl ${
        status.isIn2027 
          ? (isDark ? 'bg-emerald-950/30 border-emerald-500/40 hover:bg-emerald-900/40 shadow-[0_4px_20px_rgba(16,185,129,0.1)]' : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 shadow-sm') 
          : (isNext
              ? (isDark ? 'bg-blue-900/30 border-blue-400 ring-1 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:bg-blue-900/40' : 'bg-white border-blue-300 ring-1 ring-blue-200 shadow-sm hover:bg-slate-50')
              : (isDark ? 'bg-slate-900/30 border-white/5 hover:border-white/20 hover:bg-slate-800/40 shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm hover:bg-slate-50')
            )
      } ${isSelected ? 'ring-2 ring-blue-500' : ''} group`}
    >
      {/* Internal Glass Highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none rounded-xl"></div>

      {/* Header: Flag, Country, Zone, Status Icon */}
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex-shrink-0 w-8 h-6 rounded flex items-center justify-center border overflow-hidden shadow-sm ${isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'}`}>
            <img 
              src={`https://flagcdn.com/w80/${status.code.toLowerCase()}.png`}
              alt={`${status.country} flag`}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              loading="lazy"
            />
          </div>
          
          <div className="min-w-0">
            <h3 className={`text-sm font-bold tracking-tight leading-tight truncate pr-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {status.country}
            </h3>
            <p className={`text-[10px] font-mono truncate opacity-70 group-hover:opacity-100 transition-opacity ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{status.zone}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
           <button
             onClick={handleCalendarClick}
             className={buttonClass}
             title="Add to Calendar"
           >
             <CalendarPlus size={16} />
           </button>
           <button
             onClick={(e) => {
               e.stopPropagation();
               onClick(status.country);
             }}
             className={buttonClass}
             title={t.learnTraditions}
           >
             <Info size={16} />
           </button>

           {status.isIn2027 ? (
             <CheckCircle2 className="text-emerald-500 w-5 h-5 flex-shrink-0 animate-pulse ml-1" />
           ) : (
             <Timer className={`w-5 h-5 flex-shrink-0 ml-1 ${isNext ? 'text-blue-400 animate-pulse' : 'text-blue-500'}`} />
           )}
        </div>
      </div>

      {isNext && (
          <div className={`absolute top-0 right-0 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-bl-lg shadow-sm z-20 ${isDark ? 'bg-blue-500 text-white shadow-blue-500/20' : 'bg-blue-500 text-white shadow-blue-500/20'}`}>
             Next Arrival
          </div>
      )}

      {/* Body: Two-column grid for Time and Countdown */}
      <div className={`grid grid-cols-2 gap-2 pt-3 border-t relative z-10 ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
        <div className="flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">{t.cardLocalTime}</p>
          <div className={`flex flex-col ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <div className="flex items-center gap-1.5">
               <Clock size={12} className="text-slate-500" />
               <span key={timePart} className="text-xs font-mono font-medium tracking-tight animate-tick tabular-nums">{timePart}</span>
            </div>
            <span className={`text-[10px] font-medium pl-4.5 mt-0.5 opacity-75 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {datePart}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col justify-center text-right">
          <p className={`text-[10px] uppercase tracking-wider font-bold mb-0.5 ${status.isIn2027 ? 'text-emerald-500' : 'text-slate-500'}`}>
            {status.isIn2027 ? t.cardStatus : t.cardCountdown}
          </p>
          <p key={remainingText} className={`text-sm font-mono font-bold tracking-tight tabular-nums animate-slide-up ${status.isIn2027 ? 'text-emerald-500' : (isNext ? 'text-blue-400' : 'text-blue-500')}`}>
            {remainingText}
          </p>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className={`absolute -bottom-6 -right-6 w-20 h-20 rounded-full opacity-5 blur-xl transition-opacity duration-500 group-hover:opacity-10 ${status.isIn2027 ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
    </motion.div>
  );
};

export default TimeCard;
