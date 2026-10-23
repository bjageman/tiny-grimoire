import { it, expect } from 'vitest';
import { cn } from './cn';

it('combines conditional classes and resolves Tailwind conflicts', () => {
  expect(cn('px-2 py-1', false, null, undefined, { 'font-bold': true, hidden: false }, 'p-4'))
    .toBe('font-bold p-4');
});
