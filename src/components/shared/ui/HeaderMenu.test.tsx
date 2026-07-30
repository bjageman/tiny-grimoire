import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HeaderMenu from './HeaderMenu';

describe('HeaderMenu', () => {
  it('opens dropdown menu on trigger click and calls onResetGame on item click', () => {
    const onResetGame = vi.fn();
    render(<HeaderMenu theme="dark" onResetGame={onResetGame} />);

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
        theme="dark"
        alwaysShowNotes={false}
        onToggleAlwaysShowNotes={onToggleAlwaysShowNotes}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    const notesToggle = screen.getByText('Show Labels');
    expect(notesToggle).toBeInTheDocument();

    const checkbox = document.getElementById('always-show-notes-checkbox') as HTMLInputElement;
    expect(checkbox).not.toBeNull();
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(onToggleAlwaysShowNotes).toHaveBeenCalledWith(true);
  });

  it('renders Full Night Order toggle and calls onToggleFullNightOrder when toggled', () => {
    const onToggleFullNightOrder = vi.fn();
    render(
      <HeaderMenu
        theme="dark"
        fullNightOrder={false}
        onToggleFullNightOrder={onToggleFullNightOrder}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    expect(screen.getByText('Full Night Order')).toBeInTheDocument();

    const checkbox = document.getElementById('full-night-order-checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(onToggleFullNightOrder).toHaveBeenCalledWith(true);
  });

  it('renders All Reminders toggle and calls onToggleAllReminders when toggled', () => {
    const onToggleAllReminders = vi.fn();
    render(
      <HeaderMenu
        theme="dark"
        allReminders={false}
        onToggleAllReminders={onToggleAllReminders}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    expect(screen.getByText('All Reminders')).toBeInTheDocument();

    const checkbox = document.getElementById('all-reminders-checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(onToggleAllReminders).toHaveBeenCalledWith(true);
  });

  it('renders Show Reminders toggle and calls onToggleShowReminders when toggled', () => {
    const onToggleShowReminders = vi.fn();
    render(
      <HeaderMenu
        theme="dark"
        showReminders={false}
        onToggleShowReminders={onToggleShowReminders}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    expect(screen.getByText('Show Reminders')).toBeInTheDocument();

    const checkbox = document.getElementById('show-reminders-checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(onToggleShowReminders).toHaveBeenCalledWith(true);
  });

  it('omits toggles whose handlers are not supplied', () => {
    render(<HeaderMenu theme="dark" onResetGame={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    expect(screen.queryByText('Full Night Order')).not.toBeInTheDocument();
    expect(screen.queryByText('All Reminders')).not.toBeInTheDocument();
    expect(screen.queryByText('Show Reminders')).not.toBeInTheDocument();
    expect(screen.queryByText('Show Labels')).not.toBeInTheDocument();
    expect(screen.queryByText('Theme:')).not.toBeInTheDocument();
  });

  it('closes dropdown when Escape is pressed', () => {
    render(<HeaderMenu theme="dark" onResetGame={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    expect(screen.getByRole('button', { name: /reset game/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('button', { name: /reset game/i })).not.toBeInTheDocument();
  });

  it('disables Reset Game button when isSecondary is true', () => {
    const onResetGame = vi.fn();
    render(<HeaderMenu theme="dark" onResetGame={onResetGame} isSecondary={true} />);

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));

    const resetButton = screen.getByRole('button', { name: /reset game/i });
    expect(resetButton).toBeDisabled();
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <HeaderMenu theme="dark" onResetGame={vi.fn()} />
      </div>
    );

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    expect(screen.getByRole('button', { name: /reset game/i })).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByRole('button', { name: /reset game/i })).not.toBeInTheDocument();
  });
});
