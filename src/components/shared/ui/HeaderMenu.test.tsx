import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HeaderMenu from './HeaderMenu';

describe('HeaderMenu', () => {
  it('opens dropdown menu on trigger click and calls onResetGame on item click', () => {
    const onResetGame = vi.fn();
    render(<HeaderMenu onResetGame={onResetGame} />);

    const menuButton = screen.getByRole('button', { name: /menu/i });
    expect(menuButton).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /reset game/i })).not.toBeInTheDocument();

    fireEvent.click(menuButton);

    const resetButton = screen.getByRole('button', { name: /reset game/i });
    expect(resetButton).toBeInTheDocument();

    fireEvent.click(resetButton);
    expect(onResetGame).toHaveBeenCalledTimes(1);

    expect(screen.queryByRole('button', { name: /reset game/i })).not.toBeInTheDocument();
  });

  it('renders Theme: label and calls onToggleTheme when clicked', () => {
    const onToggleTheme = vi.fn();
    render(<HeaderMenu theme="dark" onToggleTheme={onToggleTheme} />);

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    expect(screen.getByText('Theme:')).toBeInTheDocument();

    const themeToggle = document.getElementById('theme-toggle-button');
    expect(themeToggle).not.toBeNull();

    fireEvent.click(themeToggle!);
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('renders Always Show Notes toggle and calls onToggleAlwaysShowNotes when toggled', () => {
    const onToggleAlwaysShowNotes = vi.fn();
    render(
      <HeaderMenu
        alwaysShowNotes={false}
        onToggleAlwaysShowNotes={onToggleAlwaysShowNotes}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    const notesToggle = screen.getByText('Show Notes');
    expect(notesToggle).toBeInTheDocument();

    const checkbox = document.getElementById('always-show-notes-checkbox') as HTMLInputElement;
    expect(checkbox).not.toBeNull();
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(onToggleAlwaysShowNotes).toHaveBeenCalledWith(true);
  });

  it('disables Reset Game button when isSecondary is true', () => {
    const onResetGame = vi.fn();
    render(<HeaderMenu onResetGame={onResetGame} isSecondary={true} />);

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));

    const resetButton = screen.getByRole('button', { name: /reset game/i });
    expect(resetButton).toBeDisabled();
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <HeaderMenu onResetGame={vi.fn()} />
      </div>
    );

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    expect(screen.getByRole('button', { name: /reset game/i })).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByRole('button', { name: /reset game/i })).not.toBeInTheDocument();
  });
});
