import { cn } from '../../utils/cn';

interface DayNightLabelProps {
  timeOfDay: 'day' | 'night';
  dayNumber: number;
}

/**
 * Renders the emoji + "Day N" / "Night N" text for the time-of-day badges.
 * Both label variants are stacked in the same grid cell (only one visible)
 * so the badge's width is always driven by the wider "Night" text, instead
 * of shrinking to fit "Day" and resizing the badge when the state toggles.
 */
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
