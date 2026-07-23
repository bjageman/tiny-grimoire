import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayerDragAndDrop } from './usePlayerDragAndDrop';
import React from 'react';

describe('usePlayerDragAndDrop', () => {
  it('should initialize with null dragged and dragOver indices', () => {
    const items = ['Alice', 'Bob', 'Charlie'];
    const setItems = vi.fn();
    
    const { result } = renderHook(() => usePlayerDragAndDrop(items, setItems));
    
    expect(result.current.draggedIndex).toBeNull();
    expect(result.current.dragOverIndex).toBeNull();
  });

  it('should move player up and down with movePlayer', () => {
    const items = ['Alice', 'Bob', 'Charlie'];
    const setItems = vi.fn();
    
    const { result } = renderHook(() => usePlayerDragAndDrop(items, setItems));
    
    // Move Bob (index 1) up (index 0)
    act(() => {
      result.current.movePlayer(1, 'up');
    });
    expect(setItems).toHaveBeenLastCalledWith(['Bob', 'Alice', 'Charlie']);

    // Move Bob (index 1) down (index 2)
    act(() => {
      result.current.movePlayer(1, 'down');
    });
    expect(setItems).toHaveBeenLastCalledWith(['Alice', 'Charlie', 'Bob']);
    
    // Boundary conditions: moving index 0 up, or last index down should do nothing
    setItems.mockClear();
    act(() => {
      result.current.movePlayer(0, 'up');
    });
    expect(setItems).not.toHaveBeenCalled();

    act(() => {
      result.current.movePlayer(2, 'down');
    });
    expect(setItems).not.toHaveBeenCalled();
  });

  it('should handle desktop drag and drop cycle', () => {
    const items = ['Alice', 'Bob', 'Charlie'];
    const setItems = vi.fn();
    
    const { result } = renderHook(() => usePlayerDragAndDrop(items, setItems));
    
    const setDataMock = vi.fn();
    const mockDragStartEvent = {
      dataTransfer: {
        effectAllowed: '',
        setData: setDataMock,
      }
    } as unknown as React.DragEvent;

    // Start dragging Bob (index 1)
    act(() => {
      const mockMouseDownEvent = {
        target: {
          closest: (selector: string) => selector === '.drag-handle' ? {} : null
        }
      } as unknown as React.MouseEvent;
      result.current.handleMouseDown(mockMouseDownEvent);
      result.current.handleDragStart(mockDragStartEvent, 1);
    });
    expect(result.current.draggedIndex).toBe(1);
    expect(setDataMock).toHaveBeenCalledWith('text/plain', '1');

    // Drag over Charlie (index 2)
    const mockDragOverEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.DragEvent;
    
    act(() => {
      result.current.handleDragOver(mockDragOverEvent, 2);
    });
    expect(result.current.dragOverIndex).toBe(2);
    expect(mockDragOverEvent.preventDefault).toHaveBeenCalled();

    // Drop
    const getDataMock = vi.fn().mockReturnValue('1');
    const mockDropEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {
        getData: getDataMock,
      }
    } as unknown as React.DragEvent;

    act(() => {
      result.current.handleDrop(mockDropEvent, 2);
    });
    
    expect(mockDropEvent.preventDefault).toHaveBeenCalled();
    expect(getDataMock).toHaveBeenCalledWith('text/plain');
    expect(setItems).toHaveBeenCalledWith(['Alice', 'Charlie', 'Bob']);
    expect(result.current.draggedIndex).toBeNull();
    expect(result.current.dragOverIndex).toBeNull();
  });

  it('should handle desktop drag leave and drag end resets', () => {
    const items = ['Alice', 'Bob', 'Charlie'];
    const setItems = vi.fn();
    
    const { result } = renderHook(() => usePlayerDragAndDrop(items, setItems));

    const mockDragStartEvent = {
      dataTransfer: {
        effectAllowed: '',
        setData: vi.fn(),
      }
    } as unknown as React.DragEvent;

    const mockDragOverEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.DragEvent;

    act(() => {
      const mockMouseDownEvent = {
        target: {
          closest: (selector: string) => selector === '.drag-handle' ? {} : null
        }
      } as unknown as React.MouseEvent;
      result.current.handleMouseDown(mockMouseDownEvent);
      result.current.handleDragStart(mockDragStartEvent, 0);
      result.current.handleDragOver(mockDragOverEvent, 1);
    });
    expect(result.current.draggedIndex).toBe(0);
    expect(result.current.dragOverIndex).toBe(1);

    act(() => {
      result.current.handleDragLeave();
    });
    expect(result.current.dragOverIndex).toBeNull();

    act(() => {
      result.current.handleDragOver(mockDragOverEvent, 2);
    });
    expect(result.current.dragOverIndex).toBe(2);

    act(() => {
      result.current.handleDragEnd();
    });
    expect(result.current.draggedIndex).toBeNull();
    expect(result.current.dragOverIndex).toBeNull();
  });

  it('should handle mobile touch events', () => {
    const items = ['Alice', 'Bob', 'Charlie'];
    const setItems = vi.fn();
    
    const { result } = renderHook(() => usePlayerDragAndDrop(items, setItems));

    // Touch start on Alice (index 0)
    act(() => {
      result.current.handleTouchStart({} as React.TouchEvent, 0);
    });
    expect(result.current.draggedIndex).toBe(0);

    // Mock document.elementFromPoint to return an element with data-drag-index attribute
    const mockElement = {
      getAttribute: vi.fn().mockImplementation((attr) => {
        if (attr === 'data-drag-index') return '2';
        return null;
      }),
      parentElement: null,
    } as unknown as HTMLElement;

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn().mockReturnValue(mockElement);

    const mockTouchMoveEvent = {
      cancelable: true,
      preventDefault: vi.fn(),
      touches: [{ clientX: 10, clientY: 20 }]
    } as unknown as React.TouchEvent;

    act(() => {
      result.current.handleTouchMove(mockTouchMoveEvent);
    });
    expect(mockTouchMoveEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.dragOverIndex).toBe(2);

    // Touch end should perform reorder
    act(() => {
      result.current.handleTouchEnd();
    });
    expect(setItems).toHaveBeenCalledWith(['Bob', 'Charlie', 'Alice']);
    expect(result.current.draggedIndex).toBeNull();
    expect(result.current.dragOverIndex).toBeNull();

    // Restore original DOM method
    document.elementFromPoint = originalElementFromPoint;
  });

  it('should prevent drag if it did not start from drag-handle', () => {
    const items = ['Alice', 'Bob'];
    const setItems = vi.fn();
    const { result } = renderHook(() => usePlayerDragAndDrop(items, setItems));

    const mockPreventDefault = vi.fn();
    const mockDragStartEvent = {
      preventDefault: mockPreventDefault,
      dataTransfer: {
        effectAllowed: '',
        setData: vi.fn(),
      }
    } as unknown as React.DragEvent;

    act(() => {
      // Simulate clicking on the text/background (not drag handle)
      const mockMouseDownEvent = {
        target: {
          closest: () => null
        }
      } as unknown as React.MouseEvent;
      result.current.handleMouseDown(mockMouseDownEvent);
      result.current.handleDragStart(mockDragStartEvent, 0);
    });

    expect(mockPreventDefault).toHaveBeenCalled();
    expect(result.current.draggedIndex).toBeNull();
  });
});

