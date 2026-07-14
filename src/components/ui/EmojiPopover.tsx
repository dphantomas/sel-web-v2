'use client';

import { useState, useRef, useEffect } from 'react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { SmilePlus } from 'lucide-react';

interface EmojiPopoverProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

export function EmojiPopover({ onEmojiSelect, disabled = false }: EmojiPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Use system or user preference for theme, we'll try to detect dark mode via document class if possible
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`p-1.5 rounded-md flex items-center justify-center transition-colors
          ${isOpen ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title="Insertar Emoji"
      >
        <SmilePlus className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-2 left-0 sm:left-auto sm:-translate-x-1/2">
          <div className="shadow-xl rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
            <EmojiPicker
              onEmojiClick={(emojiData: EmojiClickData) => {
                onEmojiSelect(emojiData.emoji);
                setIsOpen(false);
              }}
              theme={isDark ? Theme.DARK : Theme.LIGHT}
              lazyLoadEmojis={true}
              searchPlaceHolder="Buscar emoji..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
