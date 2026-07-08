import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SelectCharactersModal from './SelectCharactersModal';
import type { Role } from '../../types';

describe('SelectCharactersModal', () => {
  const roles: Role[] = [
    { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk' },
    { id: 'chef', name: 'Chef', team: 'townsfolk' },
    { id: 'poisoner', name: 'Poisoner', team: 'minion' },
    { id: 'butler', name: 'Butler', team: 'outsider' },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    roles,
    playerCount: 5,
    isLightModeActive: false,
    onAssign: vi.fn(),
    selectedIds: new Set<string>(),
    setSelectedIds: vi.fn(),
  };

  it('renders correctly and displays list of roles grouped by team', () => {
    render(<SelectCharactersModal {...defaultProps} />);
    expect(screen.getByText('Chef')).toBeInTheDocument();
    expect(screen.getByText('Washerwoman')).toBeInTheDocument();
    expect(screen.getByText('Poisoner')).toBeInTheDocument();
    expect(screen.getByText('Butler')).toBeInTheDocument();
  });

  it('displays roles in the original script JSON order by default and sorts alphabetically when toggled', () => {
    const { container } = render(<SelectCharactersModal {...defaultProps} />);
    
    // By default, roles should follow their array order: Washerwoman then Chef
    const getTownsfolkNames = () => {
      const spans = container.querySelectorAll('label span.font-semibold');
      // We only care about the townsfolk group. Townsfolk is the first team section.
      return Array.from(spans).map(s => s.textContent).filter(name => name === 'Washerwoman' || name === 'Chef');
    };

    let names = getTownsfolkNames();
    expect(names[0]).toBe('Washerwoman');
    expect(names[1]).toBe('Chef');

    // Click the sort toggle to turn it on
    const toggle = container.querySelector('#select-sort-alphabetically-checkbox');
    expect(toggle).not.toBeNull();
    fireEvent.click(toggle!);

    // Now, they should be sorted alphabetically: Chef then Washerwoman
    names = getTownsfolkNames();
    expect(names[0]).toBe('Chef');
    expect(names[1]).toBe('Washerwoman');

    // Click the toggle again to turn it off
    fireEvent.click(toggle!);

    // Reverts to original JSON order: Washerwoman then Chef
    names = getTownsfolkNames();
    expect(names[0]).toBe('Washerwoman');
    expect(names[1]).toBe('Chef');
  });
});
