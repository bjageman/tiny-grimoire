import DialogModal from './DialogModal';

interface Props {
  isOpen: boolean;
  isLightModeActive: boolean;
  onJoin: () => void;
  onKeepWatching: () => void;
}

export default function SpectatorResetModal({ isOpen, isLightModeActive, onJoin, onKeepWatching }: Props) {
  return (
    <DialogModal
      isOpen={isOpen}
      isLightModeActive={isLightModeActive}
      title="Join the New Session?"
      message="You can join the player roster for the next game, or keep watching as a spectator."
      type="confirm"
      confirmLabel="Join as a Player"
      cancelLabel="Keep Watching"
      onConfirm={onJoin}
      onCancel={onKeepWatching}
    />
  );
}
