import { forwardRef, useEffect } from 'react';
import type { Player, Role, PlacedReminder } from '../../types';
import { useGrimoireLayout } from '../../hooks/useGrimoireLayout';
import { displayRoleIds, deriveWinner } from '../../utils/discordRecap';
import { roleIconFallback } from '../../utils/roleIcon';
import CharacterToken from './CharacterToken';
import officialRoles from '../../official_roles.json';

/**
 * Fixed board dimensions so the exported image is identical on every device — the
 * live grimoire sizes itself off the viewport, which would make a phone's export a
 * cramped portrait circle. The 900x680 ratio lands in the layout hook's "desktop"
 * branch, giving the same seat sizing a Storyteller sees on a laptop.
 */
const BOARD_WIDTH = 900;
const BOARD_HEIGHT = 680;
const CARD_PADDING = 40;
const REMINDER_SIZE_PCT = 26;

/** Cinzel is a Google webfont; the exporter runs with fonts un-embedded, so the card asks for a serif that is always present. */
const DISPLAY_FONT = 'Georgia, "Times New Roman", serif';

interface RecapCardProps {
  players: Player[];
  rolesData: Role[];
  reminderTokens: PlacedReminder[];
  gameLog: string[];
  scriptName: string;
  dayNumber: number;
  timeOfDay: 'night' | 'day';
  date?: Date;
  /** Fires once the seat layout has measured itself — capturing before this yields mis-sized tokens. */
  onLayoutReady?: () => void;
}

const RecapCard = forwardRef<HTMLDivElement, RecapCardProps>(function RecapCard(
  { players, rolesData, reminderTokens, gameLog, scriptName, dayNumber, timeOfDay, date = new Date(), onLayoutReady },
  ref
) {
  const { boardRef, isMeasured, positions, btnStyle, nameStyle, getDynamicFontSize } = useGrimoireLayout(players.length);

  useEffect(() => {
    if (isMeasured) onLayoutReady?.();
  }, [isMeasured, onLayoutReady]);

  const winner = deriveWinner(gameLog);
  const outcome = winner === 'good' ? '🌟 Good wins' : winner === 'evil' ? '😈 Evil wins' : null;
  const alive = players.filter(p => !p.isDead).length;
  const phase = `${timeOfDay === 'night' ? 'Night' : 'Day'} ${dayNumber}`;
  const when = date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div
      ref={ref}
      style={{
        width: BOARD_WIDTH + CARD_PADDING * 2,
        padding: CARD_PADDING,
        background: 'linear-gradient(160deg, #16161a 0%, #0b0b0e 55%, #14090b 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 40, fontWeight: 700, color: '#f4e4bc', lineHeight: 1.1 }}>
            {scriptName}
          </div>
          <div style={{ fontSize: 17, color: '#8b8b94', marginTop: 8, letterSpacing: '0.02em' }}>
            {players.length} players · {alive} alive · ended {phase} · {when}
          </div>
        </div>
        {outcome && (
          <div
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: 24,
              fontWeight: 700,
              color: '#fff',
              background: winner === 'evil' ? '#8b0000' : '#2563eb',
              border: `2px solid ${winner === 'evil' ? '#ef4444' : '#60a5fa'}`,
              borderRadius: 10,
              padding: '10px 22px',
              whiteSpace: 'nowrap',
            }}
          >
            {outcome}
          </div>
        )}
      </div>

      <div
        ref={boardRef}
        style={{
          position: 'relative',
          width: BOARD_WIDTH,
          height: BOARD_HEIGHT,
          background: '#141416',
          border: '1px solid #27272a',
          borderRadius: 40,
          containerType: 'size',
        }}
      >
        {players.map((p, index) => {
          const pos = positions[index] ?? { left: 50, top: 50 };
          const playerReminders = reminderTokens.filter(r => r.targetPlayerId === p.id);

          // Reminders sit between the seat and the middle of the board, as on the live grimoire.
          const dx = 50 - pos.left;
          const dy = 50 - pos.top;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const inwardDx = dist > 0 ? dx / dist : 0;
          const inwardDy = dist > 0 ? dy / dist : 0;

          return (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
              }}
            >
              {playerReminders.map((reminder, ri) => {
                const n = playerReminders.length;
                const isLast = ri === n - 1;
                const arcN = n - 1;
                const theta = -Math.PI / 2 + (arcN > 1 ? (ri / (arcN - 1)) * Math.PI : 0);
                const arcRadius = 30;
                const rx = inwardDx * Math.cos(theta) - inwardDy * Math.sin(theta);
                const ry = inwardDx * Math.sin(theta) + inwardDy * Math.cos(theta);
                const left = isLast ? inwardDx * 70 : inwardDx * 70 + rx * arcRadius;
                const top = isLast ? inwardDy * 70 : inwardDy * 70 + ry * arcRadius;

                return (
                  <div
                    key={reminder.id}
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${left.toFixed(1)}%)`,
                      top: `calc(50% + ${top.toFixed(1)}%)`,
                      transform: 'translate(-50%, -50%)',
                      width: `${REMINDER_SIZE_PCT}%`,
                      height: `${REMINDER_SIZE_PCT}%`,
                      zIndex: 55,
                      borderRadius: '9999px',
                      background: '#e5e7eb',
                      border: '2px solid #9ca3af',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={reminder.text}
                  >
                    <img
                      src={`/icons/${reminder.sourceCharId}.svg`}
                      alt={reminder.text}
                      style={{ width: '80%', height: '80%', objectFit: 'contain', opacity: 0.75 }}
                      onError={roleIconFallback(rolesData.find(r => r.id === reminder.sourceCharId))}
                    />
                  </div>
                );
              })}

              <div
                style={{
                  ...btnStyle,
                  position: 'relative',
                  borderRadius: '9999px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.4)',
                }}
              >
                {displayRoleIds(p).map((roleId, idx) => {
                  const role = roleId
                    ? rolesData.find(r => r.id === roleId) ?? (officialRoles as Role[]).find(r => r.id === roleId)
                    : null;
                  const defaultEvil = role ? role.team === 'minion' || role.team === 'demon' : false;
                  const isEvil = p.isEvil !== undefined
                    ? p.isEvil
                    : p.isTheLunatic
                      ? false
                      : p.isTheMarionette
                        ? true
                        : defaultEvil;

                  return (
                    <CharacterToken
                      key={idx}
                      role={role}
                      isEvil={isEvil}
                      isDead={p.isDead}
                      iconSizePct={80}
                      blankRing
                      idPrefix={`recap-${p.id}-${idx}`}
                      className="absolute inset-0"
                    />
                  );
                })}

                <span
                  style={{
                    ...nameStyle,
                    fontSize: getDynamicFontSize(p.name),
                    position: 'relative',
                    zIndex: 20,
                    textAlign: 'center',
                    fontWeight: 700,
                    lineHeight: 1.05,
                    letterSpacing: '-0.02em',
                    color: '#1a1a1a',
                    opacity: p.isDead ? 0.75 : 1,
                    textDecoration: p.isDead ? 'line-through' : 'none',
                    textShadow: p.isDead
                      ? 'none'
                      : '0 1.5px 3px rgba(255,255,255,1), 0 0 5px rgba(255,255,255,1), 0 0 8px rgba(255,255,255,0.9)',
                    wordBreak: 'break-word',
                  }}
                >
                  {p.name}
                </span>

                {p.isDead && p.hasDeadVote && (
                  <div
                    style={{ position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)', fontSize: 22, lineHeight: 1, zIndex: 30 }}
                  >
                    🗳️
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 18,
          fontSize: 14,
          color: '#5b5b66',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ fontFamily: DISPLAY_FONT, color: '#7a6028', fontWeight: 700 }}>Tiny Grimoire</span>
        <span>Blood on the Clocktower</span>
      </div>
    </div>
  );
});

export default RecapCard;
