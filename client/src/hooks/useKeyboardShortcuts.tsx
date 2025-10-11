import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach(({ key, ctrlKey, metaKey, shiftKey, altKey, callback }) => {
        const isCtrlPressed = ctrlKey ? event.ctrlKey : !event.ctrlKey;
        const isMetaPressed = metaKey ? event.metaKey : !event.metaKey;
        const isShiftPressed = shiftKey ? event.shiftKey : !event.shiftKey;
        const isAltPressed = altKey ? event.altKey : !event.altKey;
        
        if (
          event.key && key &&
          event.key.toLowerCase() === key.toLowerCase() &&
          isCtrlPressed &&
          isMetaPressed &&
          isShiftPressed &&
          isAltPressed
        ) {
          event.preventDefault();
          callback();
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
