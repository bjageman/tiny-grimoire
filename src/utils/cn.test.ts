import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should filter out falsy values', () => {
    const isFalse = false;
    expect(cn('class1', isFalse && 'class2', null, undefined, 'class3')).toBe('class1 class3');
  });

  it('should merge tailwind classes properly using twMerge', () => {
    expect(cn('px-2 py-1', 'p-4')).toBe('p-4');
  });
});
