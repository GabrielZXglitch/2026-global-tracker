
import React from 'react';
import { CelebrationInsight, AppTranslations } from '../types';
import { Sparkles, Languages, PartyPopper, Info, X } from 'lucide-react';

interface InsightPanelProps {
  insight: CelebrationInsight | null;
  loading: boolean;
  onClose: () => void;
  t: AppTranslations;
  theme: 'dark' | 'light';
}

const InsightPanel: React.FC<InsightPanelProps> = ({ insight, loading, onClose, t, theme }) => {
  if (!insight && !loading) return null;
  const isDark = theme === 'dark';

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:top-24 md:right-8 md:w-96 z-50 animate-in fade-in slide-in-from-right duration-500">
      <div className={`backdrop-blur-xl border rounded-3xl p-6 shadow-2xl overflow-hidden relative ${isDark ? 'bg-slate-900/90 border-white/10' : 'bg-white/90 border-slate-200'}`}>
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 p-1 rounded-full text-slate-400 ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
            <Sparkles size={20} />
          </div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.insightTitle}</h2>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className={`h-4 rounded w-3/4 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}></div>
            <div className={`h-20 rounded ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}></div>
            <div className={`h-4 rounded w-1/2 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}></div>
            <div className={`h-20 rounded ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}></div>
          </div>
        ) : insight ? (
          <div className="space-y-6">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">{t.insightCountry}</span>
              <span className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{insight.country}</span>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <Languages className="text-indigo-500" size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">{t.insightGreeting}</p>
                <p className={`leading-relaxed italic ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>"{insight.greeting}"</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <PartyPopper className="text-pink-500" size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">{t.insightTradition}</p>
                <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{insight.tradition}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <Info className="text-amber-500" size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">{t.insightFunFact}</p>
                <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{insight.funFact}</p>
              </div>
            </div>

            <div className={`pt-4 mt-4 border-t text-[10px] text-slate-500 flex items-center gap-1 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
              <Sparkles size={10} />
              <span>{t.insightGenerated}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default InsightPanel;
