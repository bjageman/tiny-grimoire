import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Player, Role } from '../../../types';
import { ALL_ROLES } from '../../../utils/roleData';
import GrimoireLedger from './GrimoireLedger';

const players: Player[] = [
  { id: 'alice', name: 'Alice', roleId: 'washerwoman', isDead: false },
  { id: 'bob', name: 'Bob', roleId: 'chef', isDead: false },
];

const createDnd = (hoverSide: 'before' | 'after' | null = null) => ({
  draggedIndex: 0,
  dragOverIndex: hoverSide ? 1 : null,
  hoverSide,
  onMouseDown: vi.fn(),
  onDragStart: vi.fn(),
  onDragOver: vi.fn(),
  onDragLeave: vi.fn(),
  onDrop: vi.fn(),
  onDragEnd: vi.fn(),
  onTouchStart: vi.fn(),
  onTouchMove: vi.fn(),
  onTouchEnd: vi.fn(),
});

describe('GrimoireLedger', () => {
  it('selects the hovered half and shows the insertion line on that side', () => {
    const dnd = createDnd();
    const props = {
      isLightModeActive: false,
      isSynced: false,
      players,
      roles: ALL_ROLES as Role[],
      collapsed: false,
      onToggleCollapsed: vi.fn(),
      onSelectPlayer: vi.fn(),
    };
    const { container, rerender } = render(<GrimoireLedger {...props} dnd={dnd} />);
    const bob = document.getElementById('ledger-player-bob')!;
    vi.spyOn(bob, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      bottom: 140,
      height: 40,
      left: 0,
      right: 200,
      width: 200,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    });

    fireEvent.dragOver(bob, { clientY: 135 });
    expect(dnd.onDragOver).toHaveBeenCalledWith(expect.anything(), 1, 'after');

    rerender(<GrimoireLedger {...props} dnd={createDnd('after')} />);
    expect(container.querySelector('[data-drop-position="after"]')).toHaveClass('-bottom-1');

    rerender(<GrimoireLedger {...props} dnd={createDnd('before')} />);
    expect(container.querySelector('[data-drop-position="before"]')).toHaveClass('-top-1');
  });
});
