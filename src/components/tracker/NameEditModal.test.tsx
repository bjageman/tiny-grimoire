import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import PlayerTrackerNameEditModal from './NameEditModal';
import type { Player } from '../../types';

describe('PlayerTrackerNameEditModal', () => {
  const alice: Player = { id: 'p1', name: 'Alice', isDead: false };

  const defaultProps = {
    activePlayerId: 'p1',
    players: [alice],
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
});
