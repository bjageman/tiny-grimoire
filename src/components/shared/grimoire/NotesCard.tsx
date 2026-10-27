import { NotebookPen } from 'lucide-react';
import { cn } from '../../../utils/cn';
import Card from '../ui/Card';
import DisclosureHeader from '../ui/DisclosureHeader';
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
    <Card
      id={id}
      isLightModeActive={isLightModeActive}
      className={cn('text-left', isLightModeActive && 'text-clocktower-night')}
    >
      <h4>
        <DisclosureHeader
          label="Notes"
          isExpanded={isExpanded}
          onToggle={onToggleExpanded}
          controlsId={`${id}-body`}
          isLightModeActive={isLightModeActive}
          icon={<NotebookPen size={14} />}
        />
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
    </Card>
  );
}
