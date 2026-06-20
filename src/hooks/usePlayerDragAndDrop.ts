import React, { useState } from 'react';

export function usePlayerDragAndDrop<T>(items: T[], setItems: (items: T[]) => void) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData("text/plain");
    const sourceIndex = sourceIndexStr ? parseInt(sourceIndexStr, 10) : draggedIndex;
    if (sourceIndex !== null && sourceIndex !== undefined && !isNaN(sourceIndex)) {
      if (sourceIndex !== targetIndex) {
        const updated = [...items];
        const [removed] = updated.splice(sourceIndex, 1);
        updated.splice(targetIndex, 0, removed);
        setItems(updated);
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    setDraggedIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
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

    if (foundIndex !== null && foundIndex !== dragOverIndex) {
      setDragOverIndex(foundIndex);
    }
  };

  const handleTouchEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null) {
      if (draggedIndex !== dragOverIndex) {
        const updated = [...items];
        const [removed] = updated.splice(draggedIndex, 1);
        updated.splice(dragOverIndex, 0, removed);
        setItems(updated);
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
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
