import { cn } from '../../utils/cn';

interface DayNightLabelProps {
  timeOfDay: 'day' | 'night';
  dayNumber: number;
}

/** Emoji + "Day N"/"Night N" badge; both variants are stacked so width always tracks the wider "Night" text. */
export default function DayNightLabel({ timeOfDay, dayNumber }: DayNightLabelProps) {
  return (
    <>
      <span>{timeOfDay === 'day' ? '☀️' : '🌙'}</span>
      <span className="inline-grid">
        <span className={cn("[grid-area:1/1]", timeOfDay !== 'night' && "invisible")}>Night {dayNumber}</span>
        <span className={cn("[grid-area:1/1]", timeOfDay !== 'day' && "invisible")}>Day {dayNumber}</span>
      </span>
    </>
  );
}
