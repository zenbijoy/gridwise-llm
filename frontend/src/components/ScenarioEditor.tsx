import React from 'react';
import { Plus, Trash2, RotateCcw, AlertTriangle, Sparkles } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface ScenarioEditorProps {
  scenarioId: string;
  onChangeScenarioId: (val: string) => void;
  notes: string[];
  onChangeNotes: (notes: string[]) => void;
  language?: Language;
}

export const ScenarioEditor: React.FC<ScenarioEditorProps> = ({
  scenarioId,
  onChangeScenarioId,
  notes,
  onChangeNotes,
  language = 'en',
}) => {
  const t = translations[language];

  const handleNoteChange = (index: number, value: string) => {
    const updated = [...notes];
    updated[index] = value;
    onChangeNotes(updated);
  };

  const handleAddNote = () => {
    if (notes.length < 3) {
      onChangeNotes([...notes, '']);
    }
  };

  const handleRemoveNote = (index: number) => {
    if (notes.length > 1) {
      const updated = notes.filter((_, i) => i !== index);
      onChangeNotes(updated);
    }
  };

  const handleClearNotes = () => {
    onChangeNotes(['']);
  };

  const samplePromptsEn = [
    'Facilities will wash rooftop solar panels from noon until 2 PM. Usable solar should be treated as roughly 25% of forecast.',
    'Keep at least 100 kWh in reserve from 6 PM until 9 PM for the evening auditorium event.',
    'Do not charge the campus battery between 2 PM and 4 PM due to substation maintenance.',
    'Sports office moved next month registration deadline (unrelated note).',
  ];

  const samplePromptsBn = [
    'Facilities will wash rooftop solar panels from noon until 2 PM. Usable solar should be treated as roughly 25% of forecast.',
    'Keep at least 150 kWh in reserve from 5 PM until 9 PM for the campus event.',
    'Do not charge the campus battery between 2 PM and 4 PM due to maintenance.',
    'Sports office moved next month registration deadline (unrelated note).',
  ];

  const samplePrompts = language === 'bn' ? samplePromptsBn : samplePromptsEn;

  const handleAddSample = (text: string) => {
    if (notes.length < 3) {
      onChangeNotes([...notes, text]);
    } else {
      const updated = [...notes];
      updated[updated.length - 1] = text;
      onChangeNotes(updated);
    }
  };

  const hasEmptyNotes = notes.some((n) => n.trim().length === 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:border-emerald-500/30 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t.scenarioTitle}</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
              {t.scenarioBadge}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            {t.scenarioDesc}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="scenario-id-input" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {t.scenarioIdLabel}:
          </label>
          <input
            id="scenario-id-input"
            type="text"
            value={scenarioId}
            onChange={(e) => onChangeScenarioId(e.target.value)}
            className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. SCENARIO-01"
          />
        </div>
      </div>

      {/* Operator Notes List */}
      <div className="space-y-3">
        {notes.map((note, index) => (
          <div key={index} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={`operator-note-${index}`} className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-mono font-bold">
                  {index + 1}
                </span>
                {t.operatorNote} #{index + 1}
              </label>

              {notes.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveNote(index)}
                  className="text-slate-400 hover:text-rose-500 text-xs flex items-center gap-1 transition-colors"
                  title="Remove this note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.removeNote}</span>
                </button>
              )}
            </div>

            <textarea
              id={`operator-note-${index}`}
              rows={2}
              value={note}
              onChange={(e) => handleNoteChange(index, e.target.value)}
              placeholder="e.g. 'Facilities will wash solar panels from noon to 2 PM. Usable solar is roughly 25% of forecast.'"
              className="w-full text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed placeholder:text-slate-400 font-medium"
            />
          </div>
        ))}
      </div>

      {/* Actions & Warnings */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddNote}
            disabled={notes.length >= 3}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              notes.length >= 3
                ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addNote} ({notes.length}/3)</span>
          </button>

          <button
            type="button"
            onClick={handleClearNotes}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.clearNotes}</span>
          </button>
        </div>

        {hasEmptyNotes && (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{t.emptyNoteWarning}</span>
          </div>
        )}
      </div>

      {/* Quick Example Snippets */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t.quickTemplates}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddSample(prompt)}
              className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors truncate max-w-xs border border-transparent hover:border-emerald-300 dark:hover:border-emerald-600"
              title={prompt}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
