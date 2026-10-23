import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ValidationSummary } from '../../../utils/validationSummary';
import GrimoireBalanceVerification from './GrimoireBalanceVerification';

const validationSummary: ValidationSummary = {
  base: { townsfolk: 5, outsider: 0, minion: 1, demon: 1, traveler: 0 },
  counts: { townsfolk: 4, outsider: 1, minion: 1, demon: 1, traveler: 0 },
  expected: { townsfolk: 4, outsider: 1, minion: 1, demon: 1, traveler: 0 },
  hasGodfather: true,
  modifications: ['Godfather (+1 Outsider)'],
  isDemonValid: true,
  isMinionValid: true,
  isOutsiderValid: true,
  isTownsfolkValid: true,
  jinxWarnings: [],
  warnings: [],
  failures: [],
  isValid: true,
  expectedOutsiderLabel: '1',
  expectedTownsfolkLabel: '4',
  expectedDemonLabel: '1',
};

describe('GrimoireBalanceVerification', () => {
  it('toggles character counts while always showing count modifications', () => {
    render(<GrimoireBalanceVerification validationSummary={validationSummary} />);

    const toggle = screen.getByRole('button', { name: /grimoire balance verification/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Tfolk')).toBeInTheDocument();
    expect(screen.getByText('Godfather (+1 Outsider)')).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Tfolk')).not.toBeInTheDocument();
    expect(screen.getByText('Godfather (+1 Outsider)')).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.getByText('Tfolk')).toBeInTheDocument();
    expect(screen.getByText('Godfather (+1 Outsider)')).toBeInTheDocument();
  });

  it('restores a collapsed state after leaving and returning', () => {
    const persistenceKey = 'test-balance-verification-expanded';
    localStorage.removeItem(persistenceKey);
    const { unmount } = render(
      <GrimoireBalanceVerification validationSummary={validationSummary} persistenceKey={persistenceKey} />,
    );

    expect(screen.getByRole('button', { name: /grimoire balance verification/i })).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: /grimoire balance verification/i }));
    expect(screen.getByRole('button', { name: /grimoire balance verification/i })).toHaveAttribute('aria-expanded', 'false');
    unmount();

    render(<GrimoireBalanceVerification validationSummary={validationSummary} persistenceKey={persistenceKey} />);
    expect(screen.getByRole('button', { name: /grimoire balance verification/i })).toHaveAttribute('aria-expanded', 'false');
    localStorage.removeItem(persistenceKey);
  });
});
