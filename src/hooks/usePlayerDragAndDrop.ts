import React, { useState, useRef } from 'react';

function isBoundaryRotation(source: number, target: number, side: 'before' | 'after', n: number) {
  if (source === n - 1 && target === 0 && side === 'before') return true;
  if (source === 0 && target === n - 1 && side === 'after') return true;
  return false;
}

export function usePlayerDragAndDrop<T>(items: T[], setItems: (items: T[]) => void) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hoverSide, setHoverSide] = useState<'before' | 'after' | null>(null);
  const dragStartFromHandleRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e?.target as HTMLElement;
    dragStartFromHandleRef.current = !!(target && target.closest && target.closest('.drag-handle'));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!dragStartFromHandleRef.current) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", index.toString());
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number, side: 'before' | 'after' = 'before') => {
    e.preventDefault();
    if (index !== dragOverIndex || side !== hoverSide) {
      setDragOverIndex(index);
      setHoverSide(side);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
    setHoverSide(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer ? e.dataTransfer.getData("text/plain") : null;
    const sourceIndex = sourceIndexStr ? parseInt(sourceIndexStr, 10) : draggedIndex;
    if (sourceIndex !== null && sourceIndex !== undefined && !isNaN(sourceIndex)) {
      if (sourceIndex !== targetIndex) {
        const side = hoverSide || 'before';
        const updated = [...items];
        const [removed] = updated.splice(sourceIndex, 1);
        
        const insertIndex = side === 'before'
          ? (sourceIndex > targetIndex ? targetIndex : targetIndex - 1)
          : (sourceIndex > targetIndex ? targetIndex + 1 : targetIndex);
        
        updated.splice(insertIndex, 0, removed);
        if (items.length <= 3 || !isBoundaryRotation(sourceIndex, targetIndex, side, items.length)) {
          setItems(updated);
        }
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    setHoverSide(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setHoverSide(null);
  };

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    const target = e?.target as HTMLElement;
    if (target && target.closest && !target.closest('.drag-handle')) {
      return;
    }
    setDraggedIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent, getTouchSide?: (clientX: number, clientY: number, targetIndex: number) => 'before' | 'after') => {
    if (draggedIndex === null) return;
    
    // Prevent standard page scrolling when touch-dragging
    if (e.cancelable) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!targetElement) return;

    let current: HTMLElement | null = targetElement as HTMLElement;
    let foundIndex: number | null = null;
    while (current) {
      const idxAttr = current.getAttribute('data-drag-index');
      if (idxAttr !== null) {
        foundIndex = parseInt(idxAttr, 10);
        break;
      }
      current = current.parentElement;
    }

    if (foundIndex !== null) {
      const side = getTouchSide ? getTouchSide(touch.clientX, touch.clientY, foundIndex) : 'before';
      if (foundIndex !== dragOverIndex || side !== hoverSide) {
        setDragOverIndex(foundIndex);
        setHoverSide(side);
      }
    }
  };

  const handleTouchEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null) {
      if (draggedIndex !== dragOverIndex) {
        const side = hoverSide || 'before';
        const updated = [...items];
        const [removed] = updated.splice(draggedIndex, 1);
        
        const insertIndex = side === 'before'
          ? (draggedIndex > dragOverIndex ? dragOverIndex : dragOverIndex - 1)
          : (draggedIndex > dragOverIndex ? dragOverIndex + 1 : dragOverIndex);
        
        updated.splice(insertIndex, 0, removed);
        if (items.length <= 3 || !isBoundaryRotation(draggedIndex, dragOverIndex, side, items.length)) {
          setItems(updated);
        }
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    setHoverSide(null);
  };

  const movePlayer = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const updated = [...items];
    const [removed] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, removed);
    setItems(updated);
  };

  return {
    draggedIndex,
    dragOverIndex,
    hoverSide,
    handleMouseDown,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    movePlayer,
  };
}
