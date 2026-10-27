import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import SearchInput from './SearchInput';

afterEach(cleanup);

describe('SearchInput', () => {
  it('keeps controlled search and clear actions connected to the caller', () => {
    function SearchExample() {
      const [query, setQuery] = useState('Imp');
      return (
        <SearchInput label="Search characters" value={query} onChange={event => setQuery(event.target.value)}>
          <button onClick={() => setQuery('')}>Clear search</button>
        </SearchInput>
      );
    }
    render(<SearchExample />);
    const input = screen.getByRole('textbox', { name: 'Search characters' });
    fireEvent.change(input, { target: { value: 'Chef' } });
    expect(input).toHaveValue('Chef');
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input).toHaveValue('');
  });

  it('forwards refs, IDs, focus, and keyboard handlers to the input', () => {
    const ref = createRef<HTMLInputElement>();
    const onKeyDown = vi.fn();
    render(<SearchInput ref={ref} id="character-search" label="Search characters" autoFocus onKeyDown={onKeyDown} />);
    const input = screen.getByRole('textbox', { name: 'Search characters' });
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute('id', 'character-search');
    expect(input).toHaveFocus();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onKeyDown).toHaveBeenCalledOnce();
  });
});
