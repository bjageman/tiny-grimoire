import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MyIdentityFields from './MyIdentityFields';

describe('MyIdentityFields', () => {
  const defaultProps = {
    isLight: false,
    name: 'Alice',
    pronouns: '',
    onChangeName: vi.fn(),
    onSelectPronoun: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('commits a rename on blur, not on every keystroke', () => {
    render(<MyIdentityFields {...defaultProps} />);
    const input = screen.getByDisplayValue('Alice');

    fireEvent.change(input, { target: { value: 'Alicia' } });
    expect(defaultProps.onChangeName).not.toHaveBeenCalled();

    fireEvent.blur(input);
    expect(defaultProps.onChangeName).toHaveBeenCalledWith('Alicia');
  });

  it('commits a rename when Enter blurs the field', () => {
    render(<MyIdentityFields {...defaultProps} />);
    const input = screen.getByDisplayValue('Alice');

    fireEvent.change(input, { target: { value: 'Alicia' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.blur(input);
    expect(defaultProps.onChangeName).toHaveBeenCalledWith('Alicia');
  });

  it('restores the current name when the field is emptied', () => {
    render(<MyIdentityFields {...defaultProps} />);
    const input = screen.getByDisplayValue('Alice') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.blur(input);

    expect(defaultProps.onChangeName).not.toHaveBeenCalled();
    expect(input.value).toBe('Alice');
  });

  it('selects and clears pronouns', () => {
    const { rerender } = render(<MyIdentityFields {...defaultProps} />);

    fireEvent.click(screen.getByText('They/Them'));
    expect(defaultProps.onSelectPronoun).toHaveBeenCalledWith('They/Them');

    rerender(<MyIdentityFields {...defaultProps} pronouns="They/Them" />);
    fireEvent.click(screen.getByText('They/Them'));
    expect(defaultProps.onSelectPronoun).toHaveBeenLastCalledWith('');
  });

  it('picks up a name changed elsewhere', () => {
    const { rerender } = render(<MyIdentityFields {...defaultProps} />);
    rerender(<MyIdentityFields {...defaultProps} name="Bob" />);

    expect(screen.getByDisplayValue('Bob')).toBeInTheDocument();
  });
});
