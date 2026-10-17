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
      />
    );

    expect(screen.getByText('Notes')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Updated note' } });
    expect(onNotesChange).toHaveBeenCalledWith('Updated note');
  });
});
