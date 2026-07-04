import { useRef, useLayoutEffect } from 'react';
import { cn } from '../../utils/cn';

interface AutoResizeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  isLightModeActive?: boolean;
}

export default function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  minRows = 5,
  isLightModeActive = false,
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={minRows}
      className={cn(
        'w-full rounded-lg border px-3 py-2 text-sm resize-none overflow-hidden focus:outline-none transition-colors leading-relaxed',
        isLightModeActive
          ? 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-gray-400'
          : 'bg-gray-900/60 border-gray-800 text-gray-200 placeholder-gray-600 focus:border-gray-600'
      )}
    />
  );
}
