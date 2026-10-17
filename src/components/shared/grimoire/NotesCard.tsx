import { ChevronDown, NotebookPen } from 'lucide-react';
import { cn } from '../../../utils/cn';
import AutoResizeTextarea from '../ui/AutoResizeTextarea';

interface NotesCardProps {
  id: string;
  notes: string;
  onNotesChange: (notes: string) => void;
  isLightModeActive: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export default function NotesCard({ id, notes, onNotesChange, isLightModeActive, isExpanded, onToggleExpanded }: NotesCardProps) {
  return (
    <div
      id={id}
      className={cn(
        'space-y-2.5 rounded-lg border p-3.5 text-left transition-colors duration-300',
        isLightModeActive
          ? 'border-gray-300 bg-white/50 text-clocktower-night'
          : 'border-gray-800/80 bg-gray-900/40'
      )}
    >
      <h4>
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-expanded={isExpanded}
          aria-controls={`${id}-body`}
          aria-label="Notes"
          className={cn(
            'flex w-full items-center gap-1.5 text-xs font-bold uppercase tracking-wider',
            isLightModeActive ? 'text-gray-600' : 'text-gray-500'
          )}
        >
          <NotebookPen size={14} />
          <span>Notes</span>
          <ChevronDown
            size={14}
            className={cn('ml-auto transition-transform duration-200', isExpanded && 'rotate-180')}
          />
        </button>
      </h4>
      {isExpanded && (
        <div id={`${id}-body`}>
          <AutoResizeTextarea
            value={notes}
            onChange={onNotesChange}
            placeholder="Write anything here. Deductions, suspicions, reminders..."
            isLightModeActive={isLightModeActive}
          />
        </div>
      )}
    </div>
  );
}
