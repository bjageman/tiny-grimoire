import HeaderCodeBadge from './HeaderCodeBadge';

interface Props {
  mobile?: boolean;
  isLightModeActive: boolean;
  onSyncStoryteller: () => void;
  onAddSpectator: () => void;
}

export default function StorytellerSessionActions({ mobile, isLightModeActive, onSyncStoryteller, onAddSpectator }: Props) {
  return (
    <div className="flex justify-center gap-2">
      <HeaderCodeBadge mobile={mobile} isLightModeActive={isLightModeActive} onClick={onSyncStoryteller} title="Sync a co-storyteller device">
        Sync Co-Storyteller
      </HeaderCodeBadge>
      <HeaderCodeBadge mobile={mobile} isLightModeActive={isLightModeActive} onClick={onAddSpectator} title="Share join code with a spectator">
        Add Spectator
      </HeaderCodeBadge>
    </div>
  );
}
