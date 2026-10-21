import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ChangelogPage from './ChangelogPage';
import Router from './Router';

describe('ChangelogPage', () => {
  afterEach(() => {
    window.location.hash = '';
    vi.restoreAllMocks();
  });

  it('shows recent updates and their pull requests', () => {
    render(<ChangelogPage theme="dark" toggleTheme={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Changelog' })).toBeInTheDocument();
    expect(screen.getByText('Week of October 12, 2026')).toBeInTheDocument();
    expect(screen.getByText('Week of June 15, 2026')).toBeInTheDocument();
    expect(screen.getByText(/Lil' Monsta Minion preferences/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View pull request 416' })).toHaveAttribute(
      'href',
      'https://github.com/bjageman/tiny-grimoire/pull/416',
    );
  });

  it('is available from the changelog route', () => {
    window.location.hash = '#/changelog';

    render(<Router />);

    expect(screen.getByRole('heading', { name: 'Changelog' })).toBeInTheDocument();
  });

  it('opens when the footer link is clicked', async () => {
    window.location.hash = '#/host';
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    render(<Router />);
    scrollTo.mockClear();

    fireEvent.click(screen.getByRole('link', { name: 'Changelog' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Changelog' })).toBeInTheDocument();
    });
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });
});
