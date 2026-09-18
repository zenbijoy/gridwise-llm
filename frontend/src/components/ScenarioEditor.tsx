import React from 'react';
import { Plus, Trash2, RotateCcw, AlertTriangle, Sparkles } from 'lucide-react';

interface ScenarioEditorProps {
  scenarioId: string;
  onChangeScenarioId: (val: string) => void;
  notes: string[];
  onChangeNotes: (notes: string[]) => void;
}

export const ScenarioEditor: React.FC<ScenarioEditorProps> = ({
  scenarioId,
  onChangeScenarioId,
  notes,
  onChangeNotes,
}) => {
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

  const samplePrompts = [
    'Facilities will wash rooftop solar panels from noon until 2 PM. Usable solar should be treated as roughly 25% of forecast.',
    'Keep at least 100 kWh in reserve from 6 PM until 9 PM for the evening auditorium event.',
    'Do not charge the campus battery between 2 PM and 4 PM due to substation maintenance.',
    'Sports office moved next month registration deadline (unrelated note).',
  ];

  const handleAddSample = (text: string) => {
    if (notes.length < 3) {
      onChangeNotes([...notes, text]);
    } else {
      // Replace the last note if 3 are already filled
      const updated = [...notes];
      updated[updated.length - 1] = text;
      onChangeNotes(updated);
    }
  };

  const hasEmptyNotes = notes.some((n) => n.trim().length === 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Scenario & Operator Directives</span>
            <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Natural Language Input
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Provide 1 to 3 operational notes. The LLM interpreter extracts mathematical constraints with deterministic guardrails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="scenario-id-input" className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Scenario ID:
          </label>
          <input
            id="scenario-id-input"
            type="text"
            value={scenarioId}
            onChange={(e) => onChangeScenarioId(e.target.value)}
            className="text-xs font-mono font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. SCENARIO-01"
          />
        </div>
      </div>

      {/* Operator Notes List */}
      <div className="space-y-3">
        {notes.map((note, index) => (
          <div key={index} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={`operator-note-${index}`} className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] flex items-center justify-center font-mono font-bold">
                  {index + 1}
                </span>
                Operator Note #{index + 1}
              </label>

              {notes.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveNote(index)}
                  className="text-slate-400 hover:text-rose-500 text-xs flex items-center gap-1 transition-colors"
                  title="Remove this note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            <textarea
              id={`operator-note-${index}`}
              rows={2}
              value={note}
              onChange={(e) => handleNoteChange(index, e.target.value)}
              placeholder="e.g. 'Facilities will wash solar panels from noon to 2 PM. Usable solar is roughly 25% of forecast.'"
              className="w-full text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed placeholder:text-slate-400"
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              notes.length >= 3
                ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Note ({notes.length}/3)</span>
          </button>

          <button
            type="button"
            onClick={handleClearNotes}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        {hasEmptyNotes && (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Operator notes cannot be blank before optimizing.</span>
          </div>
        )}
      </div>

      {/* Quick Example Snippets */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-500" />
          <span>Quick Note Templates (Click to insert):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddSample(prompt)}
              className="text-[11px] text-left px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors truncate max-w-xs"
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
