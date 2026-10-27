import { useState } from 'react';
import { cn } from '../../utils/cn';
import WhaleBucketPreferencePicker, { PreferenceSelectButton } from '../shared/ui/WhaleBucketPreferenceSelect';
import { useScrollLock } from '../../hooks/useScrollLock';
import { PLAYABLE_ROLES } from '../../utils/roleData';
import { hasCompleteWhaleBucketPreferences, WHALE_BUCKET_PREFERENCE_TEAMS } from '../../utils/whaleBucketPreferences';

type PrefTeam = 'townsfolk' | 'outsider' | 'minion' | 'demon';
type Prefs = Record<PrefTeam, string[]>;

interface PreferencesScreenProps {
  isLight: boolean;
  isMobile: boolean;
  prefs: Prefs;
  setPrefs: React.Dispatch<React.SetStateAction<Prefs>>;
  togglePreference: (team: PrefTeam, roleId: string) => void;
  excludedRoleIds: string[];
  onSubmit: () => void;
}

// Whale Bucket join flow: pick one preferred character per team, with a searchable select modal.
export default function PreferencesScreen({ isLight, isMobile, prefs, setPrefs, togglePreference, excludedRoleIds, onSubmit }: PreferencesScreenProps) {
  const [activePrefSelect, setActivePrefSelect] = useState<{ team: PrefTeam } | null>(null);
  useScrollLock(!!activePrefSelect);
  const isComplete = hasCompleteWhaleBucketPreferences(prefs);

  return (
    <>
      <div className={cn(
        "border rounded-lg p-6 space-y-5 shadow-xl w-full max-w-md",
        isLight ? "bg-white border-gray-200" : "bg-gray-900/60 border-gray-800"
      )}>
        <div>
          <h2 className="font-display text-base font-bold text-center tracking-wider uppercase">Submit Your Preferences</h2>
          <p className="text-xs text-gray-500 text-center mt-0.5">Select one character in each category to submit</p>
        </div>

        <div className="space-y-3 sm:space-y-2">
          {WHALE_BUCKET_PREFERENCE_TEAMS.map((team) => {
            const selectedRoleId = prefs[team][0];
            const selectedRole = selectedRoleId ? PLAYABLE_ROLES.find(r => r.id === selectedRoleId) : null;
            return (
              <PreferenceSelectButton
                key={team}
                team={team}
                selectedRole={selectedRole ?? undefined}
                onClick={() => setActivePrefSelect({ team })}
              />
            );
          })}
        </div>

        <button
          type="button"
          disabled={!isComplete}
          onClick={() => { if (isComplete) onSubmit(); }}
          className="w-full bg-clocktower-blood text-white rounded-lg py-3 font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Submit Character Preferences</span>
        </button>
      </div>

      {activePrefSelect && (
        <WhaleBucketPreferencePicker
          team={activePrefSelect.team}
          currentRoleId={prefs[activePrefSelect.team][0]}
          roles={PLAYABLE_ROLES}
          excludedRoleIds={excludedRoleIds}
          isLightModeActive={isLight}
          isMobile={isMobile}
          onBack={() => setActivePrefSelect(null)}
          onClose={() => setActivePrefSelect(null)}
          onSelect={roleId => togglePreference(activePrefSelect.team, roleId)}
          onClear={() => setPrefs(prev => ({ ...prev, [activePrefSelect.team]: [] }))}
          onRandom={roleId => setPrefs(prev => ({ ...prev, [activePrefSelect.team]: [roleId] }))}
        />
      )}
    </>
  );
}
