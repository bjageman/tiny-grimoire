import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BaseDistributionCard from './BaseDistributionCard';

const baseDistribution = { townsfolk: 3, outsider: 0, minion: 1, demon: 1, traveler: 0 };
const currentDistribution = { townsfolk: 2, outsider: 1, minion: 1, demon: 1, traveler: 0 };

describe('BaseDistributionCard', () => {
  it('switches between base and current character-type counts', () => {
    render(
      <BaseDistributionCard
        playerCount={5}
        dist={baseDistribution}
        currentDist={currentDistribution}
      />
    );
    const card = within(document.getElementById('standard-base-distribution')!);

    expect(card.getByText('Base Distribution')).toBeInTheDocument();
    expect(card.getByText('Townsfolk').parentElement).toHaveTextContent('3');
    expect(card.getByText('Outsiders').parentElement).toHaveTextContent('0');

    fireEvent.click(card.getByLabelText('Current'));

    expect(card.getByText('Current Distribution')).toBeInTheDocument();
    expect(card.getByText('Townsfolk').parentElement).toHaveTextContent('2');
    expect(card.getByText('Outsiders').parentElement).toHaveTextContent('1');
  });

  it('does not offer the current view without current grimoire counts', () => {
    render(<BaseDistributionCard playerCount={5} dist={baseDistribution} />);

    expect(screen.queryByLabelText('Current')).toBeNull();
    expect(screen.getByText('Base Distribution')).toBeInTheDocument();
  });
});
