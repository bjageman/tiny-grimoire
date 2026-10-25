import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GrimoireBoardControls from './GrimoireBoardControls';

vi.mock('react-qr-code', () => ({
  default: ({ value, ...props }: { value: string }) => <svg {...props} data-join-url={value} />,
}));

describe('GrimoireBoardControls', () => {
  const props = { isFullscreen: true, isLightModeActive: false, canRotate: true, onRotate: vi.fn(), joinCode: 'ABCD' };

  it('toggles the room join code and QR while keeping rotation available', () => {
    const onRotate = vi.fn();
    render(<GrimoireBoardControls {...props} onRotate={onRotate} />);
    expect(screen.queryByRole('region', { name: 'Join this game' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show join code' }));
    expect(screen.getByRole('region', { name: 'Join this game' })).toHaveTextContent('ABCD');
    expect(screen.getByRole('region', { name: 'Join this game' })).toHaveTextContent(`${window.location.origin}${window.location.pathname}#/join?code=ABCD`);
    expect(screen.getByRole('img', { name: 'Join game ABCD' })).toHaveAttribute('data-join-url', `${window.location.origin}${window.location.pathname}#/join?code=ABCD`);
    fireEvent.click(screen.getByTitle('Rotate clockwise'));
    fireEvent.click(screen.getByTitle('Rotate counter-clockwise'));
    expect(onRotate.mock.calls).toEqual([[-1], [1]]);
    fireEvent.click(screen.getByRole('button', { name: 'Hide join code' }));
    expect(screen.queryByRole('region', { name: 'Join this game' })).toBeNull();
  });

  it('hides the QR control outside fullscreen and without a room code', () => {
    const { rerender } = render(<GrimoireBoardControls {...props} isFullscreen={false} />);
    expect(screen.queryByRole('button', { name: 'Show join code' })).toBeNull();
    expect(screen.getByTitle('Rotate clockwise')).toBeInTheDocument();
    rerender(<GrimoireBoardControls {...props} joinCode={undefined} />);
    expect(screen.queryByRole('button', { name: 'Show join code' })).toBeNull();
  });

  it('shows the join code even when the board has too few players to rotate', () => {
    render(<GrimoireBoardControls {...props} canRotate={false} />);
    expect(screen.queryByTitle('Rotate clockwise')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show join code' }));
    expect(screen.getByRole('img', { name: 'Join game ABCD' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('region', { name: 'Join this game' })).toBeNull();
  });
});
