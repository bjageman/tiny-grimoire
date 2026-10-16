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
