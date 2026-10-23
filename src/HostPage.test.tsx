import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HostPage from './HostPage';

describe('HostPage', () => {
  it('links to the Whale Bucket designer and changelog', () => {
    render(<HostPage theme="dark" toggleTheme={vi.fn()} />);

    expect(screen.getByText('Game design by Cute Mage!')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Cute Mage's Whale Bucket Draft" })).toHaveAttribute(
      'href',
      'https://sites.google.com/view/cute-mage-botc/scripts/whalebucket-draft',
    );
    const changelogLink = screen.getByRole('link', { name: 'Changelog' });
    expect(changelogLink).toHaveAttribute('href', '#/changelog');
  });
});
