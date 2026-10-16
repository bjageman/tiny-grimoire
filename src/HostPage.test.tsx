import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HostPage from './HostPage';

describe('HostPage', () => {
  it('credits the Whale Bucket designer without the old mode tags', () => {
    render(<HostPage theme="dark" toggleTheme={vi.fn()} />);

    expect(screen.getByText('Game design by Cute Mage!')).toBeInTheDocument();
    expect(screen.queryByText('Manual Setup')).not.toBeInTheDocument();
    expect(screen.queryByText('Full Control')).not.toBeInTheDocument();
    expect(screen.queryByText('Preference Draft')).not.toBeInTheDocument();
    expect(screen.queryByText('Randomized')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Cute Mage's Whale Bucket Draft" })).toHaveAttribute(
      'href',
      'https://sites.google.com/view/cute-mage-botc/scripts/whalebucket-draft',
    );
  });
});
