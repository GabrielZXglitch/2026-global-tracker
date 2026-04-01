
import React, { useMemo, useCallback } from 'react';
import { TimeZoneData, TransitionStatus, AppTranslations } from '../types';
import { TARGET_DATE_UTC } from '../constants';

interface TimelineProps {
  timezones: TimeZoneData[];
  currentTime: number;
  statuses: TransitionStatus[];
  t: AppTranslations;
  theme: 'dark' | 'light';
}

const Timeline: React.FC<TimelineProps> = ({ 
  timezones, 
  currentTime, 
  t,
  theme
}) => {
  // Determine range of timeline
  // Earliest Arrival: UTC+14 => Midnight happens at Dec 31 10:00 UTC
  // Latest Arrival: UTC-12 => Midnight happens at Jan 1 12:00 UTC
  // Add 1 hour buffer on each side
  const START_UTC = TARGET_DATE_UTC - (15 * 60 * 60 * 1000); // Dec 31 09:00 UTC
  const END_UTC = TARGET_DATE_UTC + (13 * 60 * 60 * 1000);   // Jan 1 13:00 UTC
  const DURATION = END_UTC - START_UTC;
  const isDark = theme === 'dark';

  const getPositionPercent = useCallback((time: number) => {
    return Math.max(0, Math.min(100, ((time - START_UTC) / DURATION) * 100));
  }, [START_UTC, DURATION]);

  // Group countries by arrival time for markers
  const markers = useMemo(() => {
    const map = new Map<number, number>(); // ArrivalTime -> Count
    timezones.forEach(tz => {
      // Arrival Time in UTC = Target - Offset
      const arrivalUTC = TARGET_DATE_UTC - (tz.offset * 60 * 1000);
      map.set(arrivalUTC, (map.get(arrivalUTC) || 0) + 1);
    });
    
    return Array.from(map.entries()).map(([time, count]) => ({
      time,
      count,
      left: getPositionPercent(time)
    }));
  }, [timezones, getPositionPercent]);

  const currentPercent = getPositionPercent(currentTime);

  return (
    <div className={`w-full py-6 px-4 mb-8 relative group select-none backdrop-blur-md border-y transition-colors duration-500 ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white/60 border-slate-200'}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
               {t.timelineTitle}
             </span>
          </div>
          <div className={`text-xs font-medium hidden sm:block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Global Arrival Schedule
          </div>
        </div>

        {/* Timeline Track */}
        <div className="relative h-12 flex items-center">
            {/* Base Line */}
            <div className={`absolute inset-x-0 h-1 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>
            
            {/* Progress Line (Past time) */}
            <div 
              className="absolute left-0 h-1 bg-gradient-to-r from-blue-900 via-blue-600 to-indigo-500 rounded-full transition-all duration-75 ease-linear" 
              style={{ width: `${currentPercent}%` }}
            ></div>

            {/* Event Markers */}
            {markers.map((marker) => (
              <div 
                key={marker.time}
                className={`absolute w-3 h-3 -ml-1.5 rounded-full border-2 transition-all duration-300 transform cursor-help z-10 ${
                  currentTime >= marker.time 
                    ? 'bg-emerald-500 border-emerald-900 scale-100' 
                    : (isDark ? 'bg-slate-800 border-slate-600 scale-75 hover:bg-white' : 'bg-white border-slate-300 scale-75 hover:bg-slate-100')
                }`}
                style={{ left: `${marker.left}%`, top: '50%', marginTop: '-6px' }}
                title={`UTC ${new Date(marker.time).toISOString().substr(11, 5)} - ${marker.count} Zones`}
              >
                {/* Tooltip on Hover */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                   {new Date(marker.time).getUTCHours()}:00 UTC
                </div>
              </div>
            ))}

            {/* Scrubber Thumb (Visual Only) */}
            <div 
              className={`absolute top-1/2 -mt-3 -ml-3 w-6 h-6 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] border-2 border-white z-20 bg-blue-500 transition-colors duration-75`}
              style={{ left: `${currentPercent}%` }}
            >
            </div>
        </div>
        
        <div className={`flex justify-between mt-2 text-[10px] font-mono uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>Dec 31 10:00 UTC</span>
            <span>Jan 01 12:00 UTC</span>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
