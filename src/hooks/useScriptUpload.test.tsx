import { createRef } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useScriptUpload } from './useScriptUpload';
import { PRESET_SCRIPTS } from '../utils/presetScripts';

function setup() {
  const args = {
    setCustomScriptRoles: vi.fn(),
    setScriptLoricRoles: vi.fn(),
    setScriptName: vi.fn(),
    setScriptAuthor: vi.fn(),
    showAlert: vi.fn(),
    fileInputRef: createRef<HTMLInputElement>(),
  };
  return { args, ...renderHook(() => useScriptUpload(args)) };
}

describe('useScriptUpload lore', () => {
  it('preserves JSON lore and custom Bootlegger rules separately from playable roles', async () => {
    const { args, result } = setup();
    const file = new File([JSON.stringify([
      { id: '_meta', name: 'Lore Script', bootlegger: ['A custom rule.'] },
      'chef', 'angel', 'bootlegger',
    ])], 'lore.json', { type: 'application/json' });
    act(() => result.current.handleScriptUpload({ target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>));
    await waitFor(() => expect(args.setScriptLoricRoles).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'angel', team: 'fabled' }),
      expect.objectContaining({ id: 'bootlegger', team: 'loric', ability: 'A custom rule.' }),
    ]));
    expect(args.setCustomScriptRoles).toHaveBeenCalledWith([expect.objectContaining({ id: 'chef' })]);
    expect(args.showAlert).not.toHaveBeenCalled();
  });

  it('replaces lore with an empty list when uploading a script without it', async () => {
    const { args, result } = setup();
    const file = new File([JSON.stringify(['chef'])], 'plain.json', { type: 'application/json' });
    act(() => result.current.handleScriptUpload({ target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>));
    await waitFor(() => expect(args.setScriptLoricRoles).toHaveBeenCalledWith([]));
  });

  it('clears script lore when selecting a preset or clearing the script', () => {
    const { args, result } = setup();
    act(() => result.current.selectPresetScript(PRESET_SCRIPTS[0]));
    expect(args.setScriptLoricRoles).toHaveBeenLastCalledWith([]);
    args.setScriptLoricRoles.mockClear();
    act(() => result.current.clearCustomScript());
    expect(args.setCustomScriptRoles).toHaveBeenCalledWith(null);
    expect(args.setScriptLoricRoles).toHaveBeenCalledWith([]);
  });
});
