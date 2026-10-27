import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Role } from '../../../types';
import WhaleBucketPreferencePicker, { PreferenceSelectButton } from './WhaleBucketPreferenceSelect';

afterEach(cleanup);
const roles: Role[] = [
  { id: 'chef', name: 'Chef', team: 'townsfolk' },
  { id: 'empath', name: 'Empath', team: 'townsfolk' },
  { id: 'imp', name: 'Imp', team: 'demon' },
  { id: 'summoner', name: 'Summoner', team: 'minion' },
];
function makeProps() {
  return { team: 'townsfolk' as const, roles, excludedRoleIds: [], isLightModeActive: false, isMobile: false, onBack: vi.fn(), onClose: vi.fn(), onSelect: vi.fn(), onClear: vi.fn(), onRandom: vi.fn() };
}

describe('Whalebucket shared preference controls', () => {
  it('shows the category and selected character in the shared overview row', () => {
    const onClick = vi.fn();
    const { rerender } = render(<PreferenceSelectButton team="townsfolk" onClick={onClick} />);
    expect(screen.getByText('No preference')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Select townsfolk preference' }));
    expect(onClick).toHaveBeenCalledOnce();
    rerender(<PreferenceSelectButton team="townsfolk" selectedRole={roles[0]} onClick={onClick} />);
    expect(screen.getByText('Chef')).toBeInTheDocument();
    expect(screen.queryByText('No preference')).toBeNull();
  });

  it('filters by category, exclusions, and search while showing the active choice', () => {
    const props = makeProps();
    render(<WhaleBucketPreferencePicker {...props} currentRoleId="chef" excludedRoleIds={['empath']} />);
    expect(screen.getByText('✓ ACTIVE')).toBeInTheDocument();
    expect(screen.getByRole('button', { pressed: true })).toHaveTextContent('Chef');
    expect(screen.queryByText('Empath')).toBeNull();
    expect(screen.queryByText('Imp')).toBeNull();
    fireEvent.change(screen.getByRole('textbox', { name: 'Search characters' }), { target: { value: 'zz' } });
    expect(screen.getByText('No characters found.')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Search characters' }), { target: { value: 'ch' } });
    fireEvent.click(screen.getByRole('button', { pressed: true }));
    expect(props.onSelect).toHaveBeenCalledWith('chef');
    expect(props.onBack).toHaveBeenCalledOnce();
  });

  it('uses the same allowed pool for random choices, including Summoner in the Demon category', () => {
    const props = makeProps();
    render(<WhaleBucketPreferencePicker {...props} team="demon" excludedRoleIds={['imp']} />);
    fireEvent.click(screen.getByRole('button', { name: 'Select Random' }));
    expect(props.onRandom).toHaveBeenCalledWith('summoner');
    expect(props.onSelect).not.toHaveBeenCalled();
    expect(props.onBack).toHaveBeenCalledOnce();
  });

  it('keeps clearing and returning separate from closing the storyteller modal', () => {
    const props = makeProps();
    render(<WhaleBucketPreferencePicker {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear Selection' }));
    expect(props.onClear).toHaveBeenCalledOnce();
    expect(props.onBack).toHaveBeenCalledOnce();
    expect(props.onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('disables random selection when every character in the category is excluded', () => {
    const props = makeProps();
    render(<WhaleBucketPreferencePicker {...props} excludedRoleIds={['chef', 'empath']} />);
    const random = screen.getByRole('button', { name: 'Select Random' });
    expect(random).toBeDisabled();
    fireEvent.click(random);
    expect(props.onRandom).not.toHaveBeenCalled();
  });
});
