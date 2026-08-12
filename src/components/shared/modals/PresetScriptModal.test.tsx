import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PresetScriptModal from './PresetScriptModal';

const props = { onSelect: vi.fn(), onCancel: vi.fn(), isLightModeActive: false };

describe('PresetScriptModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('offers all three base scripts', () => {
    render(<PresetScriptModal {...props} />);
    ['Trouble Brewing', 'Bad Moon Rising', 'Sects & Violets'].forEach(name => {
      expect(screen.getByText(new RegExp(name))).toBeInTheDocument();
    });
  });

  it('hands back the chosen script with its roles', () => {
    render(<PresetScriptModal {...props} />);
    fireEvent.click(document.getElementById('preset-script-tb-button')!);
    expect(props.onSelect).toHaveBeenCalledTimes(1);
    const preset = props.onSelect.mock.calls[0][0];
    expect(preset.name).toBe('Trouble Brewing');
    expect(preset.roles.some((r: { id: string }) => r.id === 'imp')).toBe(true);
  });

  it('singularizes the count for a one-demon script', () => {
    render(<PresetScriptModal {...props} />);
    const tb = document.getElementById('preset-script-tb-button')!;
    expect(tb).toHaveTextContent('1 Demon');
    expect(tb).not.toHaveTextContent('1 Demons');
    expect(document.getElementById('preset-script-bmr-button')!).toHaveTextContent('4 Demons');
  });

  it('cancels without selecting', () => {
    render(<PresetScriptModal {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('closes on Escape without selecting', () => {
    render(<PresetScriptModal {...props} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onSelect).not.toHaveBeenCalled();
  });
});
