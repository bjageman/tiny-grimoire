import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ScriptSelectionPanel from './ScriptSelectionPanel';

afterEach(cleanup);

function makeProps() {
  return {
    scriptName: 'Trouble Brewing',
    scriptAuthor: '',
    hasCustomScript: false,
    isLightModeActive: false,
    fileInputRef: createRef<HTMLInputElement>(),
    onUpload: vi.fn(),
    onClear: vi.fn(),
    onSelectPreset: vi.fn(),
    onViewScript: vi.fn(),
  };
}

describe('ScriptSelectionPanel', () => {
  it('connects upload, preset selection, and browsing to the parent', () => {
    const props = makeProps();
    render(<ScriptSelectionPanel {...props} uploadInputId="script-upload-input" uploadButtonId="script-upload-button" />);
    const input = props.fileInputRef.current!;
    const click = vi.spyOn(input, 'click');
    fireEvent.click(screen.getByTitle('Click to upload script JSON'));
    expect(click).toHaveBeenCalledOnce();
    const file = new File(['[]'], 'script.json', { type: 'application/json' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(props.onUpload).toHaveBeenCalledOnce();
    expect(input.files?.[0]).toBe(file);
    expect(input).toHaveAttribute('id', 'script-upload-input');
    expect(input).toHaveAttribute('accept', '.json');
    expect(screen.getByTitle('Click to upload script JSON')).toHaveAttribute('id', 'script-upload-button');
    fireEvent.click(screen.getByRole('button', { name: 'Select a Preset Script' }));
    fireEvent.click(screen.getByRole('button', { name: 'View All Roles' }));
    expect(props.onSelectPreset).toHaveBeenCalledOnce();
    expect(props.onViewScript).toHaveBeenCalledOnce();
  });

  it('shows the custom script author and offers clear and view actions', () => {
    const props = makeProps();
    render(<ScriptSelectionPanel {...props} hasCustomScript scriptAuthor="Alice" isLightModeActive />);
    expect(screen.getByText('by Alice — Click to change')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Select a Preset Script' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Clear Script' }));
    fireEvent.click(screen.getByRole('button', { name: 'View Script' }));
    expect(props.onClear).toHaveBeenCalledOnce();
    expect(props.onViewScript).toHaveBeenCalledOnce();
  });

  it.each([false, true])('keeps synced scripts read-only while allowing viewing (custom: %s)', hasCustomScript => {
    const props = makeProps();
    render(<ScriptSelectionPanel {...props} hasCustomScript={hasCustomScript} isSynced emptyScriptIcon="🌐" />);
    expect(screen.getByText(/Synced from Storyteller/)).toBeInTheDocument();
    expect(screen.queryByTitle('Click to upload script JSON')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Select a Preset Script' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Clear Script' })).toBeNull();
    expect(screen.queryByTitle('What is this?')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: hasCustomScript ? 'View Script' : 'View All Roles' }));
    expect(props.onViewScript).toHaveBeenCalledOnce();
    expect(props.onUpload).not.toHaveBeenCalled();
    expect(props.onClear).not.toHaveBeenCalled();
    expect(props.onSelectPreset).not.toHaveBeenCalled();
  });
});
