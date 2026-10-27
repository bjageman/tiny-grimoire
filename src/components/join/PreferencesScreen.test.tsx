import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PreferencesScreen from './PreferencesScreen';

describe('PreferencesScreen', () => {
  it('offers Atheist and Summoner as Demon preferences', () => {
    render(
      <PreferencesScreen
        isLight={false}
        isMobile={false}
        prefs={{ townsfolk: [], outsider: [], minion: [], demon: [] }}
        setPrefs={vi.fn()}
        togglePreference={vi.fn()}
        excludedRoleIds={[]}
        onSubmit={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Select demon preference...'));

    expect(screen.getByText('Atheist')).toBeInTheDocument();
    expect(screen.getByText('Summoner')).toBeInTheDocument();
  });
});

describe('Whalebucket preference submission', () => {
  const complete = { townsfolk: ['chef'], outsider: ['drunk'], minion: ['poisoner'], demon: ['imp'] };
  const props = { isLight: false, isMobile: false, prefs: complete, setPrefs: vi.fn(), togglePreference: vi.fn(), excludedRoleIds: [], onSubmit: vi.fn() };

  it.each(['townsfolk', 'outsider', 'minion', 'demon'] as const)('blocks submission when %s is missing', team => {
    const onSubmit = vi.fn();
    render(<PreferencesScreen {...props} prefs={{ ...complete, [team]: [] }} onSubmit={onSubmit} />);
    const submit = screen.getByRole('button', { name: 'Submit Character Preferences' });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAccessibleDescription(`Choose a character for: ${team[0].toUpperCase() + team.slice(1)}.`);
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('allows all four choices, then blocks submission again when a choice is cleared', () => {
    const onSubmit = vi.fn();
    const { rerender } = render(<PreferencesScreen {...props} onSubmit={onSubmit} />);
    const submit = screen.getByRole('button', { name: 'Submit Character Preferences' });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledOnce();
    rerender(<PreferencesScreen {...props} prefs={{ ...complete, demon: [] }} onSubmit={onSubmit} />);
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
