import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import PlayerTrackerNameEditModal from './NameEditModal';
import type { Player } from '../../types';

describe('PlayerTrackerNameEditModal', () => {
  const alice: Player = { id: 'p1', name: 'Alice', isDead: false };

  const defaultProps = {
    activePlayerId: 'p1',
    players: [alice],
    isLightModeActive: false,
    updatePlayerName: vi.fn(),
    removePlayer: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the current player name', () => {
    render(<PlayerTrackerNameEditModal {...defaultProps} />);
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
  });

  it('does not grab focus on mobile when the modal opens', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');

    render(<PlayerTrackerNameEditModal {...defaultProps} />);
    const input = screen.getByDisplayValue('Alice') as HTMLInputElement;

    expect(document.activeElement).not.toBe(input);
  });

  it('selects the whole name once the field is tapped on mobile', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');

    render(<PlayerTrackerNameEditModal {...defaultProps} />);
    const input = screen.getByDisplayValue('Alice') as HTMLInputElement;

    input.focus();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe('Alice'.length);
  });

  it('selects the name on desktop, where type-to-replace is the point', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (X11; Linux x86_64)');

    render(<PlayerTrackerNameEditModal {...defaultProps} />);
    const input = screen.getByDisplayValue('Alice') as HTMLInputElement;

    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe('Alice'.length);
  });

  it('buffers name edits locally and flushes via updatePlayerName on unmount', () => {
    render(<PlayerTrackerNameEditModal {...defaultProps} />);
    fireEvent.change(screen.getByDisplayValue('Alice'), { target: { value: 'Alicia' } });

    expect(defaultProps.updatePlayerName).not.toHaveBeenCalled();
    cleanup();
    expect(defaultProps.updatePlayerName).toHaveBeenCalledWith('p1', 'Alicia');
  });

  it('pressing Enter in the name field blurs and closes the modal', () => {
    render(<PlayerTrackerNameEditModal {...defaultProps} />);
    fireEvent.keyDown(screen.getByDisplayValue('Alice'), { key: 'Enter' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls removePlayer and onClose when the trash button is clicked', () => {
    render(<PlayerTrackerNameEditModal {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Remove player'));
    expect(defaultProps.removePlayer).toHaveBeenCalledWith('p1');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when Close is clicked', () => {
    render(<PlayerTrackerNameEditModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Close'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders nothing when the active player cannot be found', () => {
    const { container } = render(<PlayerTrackerNameEditModal {...defaultProps} activePlayerId="missing" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('never renders a solid-dark background class while in light mode', () => {
    const { container } = render(<PlayerTrackerNameEditModal {...defaultProps} isLightModeActive={true} />);
    const modal = container.querySelector('#player-tracker-name-edit-modal')!;
    expect(modal.className).not.toContain('bg-gray-900');
    expect(modal.className).toContain('bg-[#fdfaf2]');
  });

  it('uses the dark background class when light mode is off', () => {
    const { container } = render(<PlayerTrackerNameEditModal {...defaultProps} isLightModeActive={false} />);
    const modal = container.querySelector('#player-tracker-name-edit-modal')!;
    expect(modal.className).toContain('bg-gray-900');
  });
});
