import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NotesCard from './NotesCard';

describe('NotesCard', () => {
  it('shows and updates game notes', () => {
    const onNotesChange = vi.fn();
    render(
      <NotesCard
        id="test-notes"
        notes="Initial note"
        onNotesChange={onNotesChange}
        isLightModeActive={false}
        isExpanded
        onToggleExpanded={vi.fn()}
      />
    );

    expect(screen.getByText('Notes')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Updated note' } });
    expect(onNotesChange).toHaveBeenCalledWith('Updated note');
  });

  it('keeps its header visible and calls the toggle when collapsed', () => {
    const onToggleExpanded = vi.fn();
    render(
      <NotesCard
        id="test-notes"
        notes="Hidden note"
        onNotesChange={vi.fn()}
        isLightModeActive={false}
        isExpanded={false}
        onToggleExpanded={onToggleExpanded}
      />
    );

    const toggle = screen.getByRole('button', { name: 'Notes' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('textbox')).toBeNull();
    fireEvent.click(toggle);
    expect(onToggleExpanded).toHaveBeenCalledTimes(1);
  });
});
