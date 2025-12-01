/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable unicorn/no-null */
import React, {
  type ChangeEvent,
  type ComponentProps,
  type KeyboardEvent,
  type RefObject,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { Button, buttonVariants } from '../../ui/button';
import { Skeleton } from '../../ui/skeleton';
import { Textarea } from '../../ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip';
import { cn } from '../../../lib/utils';

/*
Accessibility
*/

export type KanbanBoardDndMonitorEventHandler = {
  onDragStart?: (activeId: string) => void;
  onDragMove?: (activeId: string, overId?: string) => void;
  onDragOver?: (activeId: string, overId?: string) => void;
  onDragEnd?: (activeId: string, overId?: string) => void;
  onDragCancel?: (activeId: string) => void;
};

export type KanbanBoardDndEventType = keyof KanbanBoardDndMonitorEventHandler;

export type KanbanBoardDndMonitorContextValue = {
  activeIdRef: RefObject<string>;
  draggableDescribedById: string;
  registerMonitor: (monitor: KanbanBoardDndMonitorEventHandler) => void;
  unregisterMonitor: (monitor: KanbanBoardDndMonitorEventHandler) => void;
  triggerEvent: (
    eventType: KanbanBoardDndEventType,
    activeId: string,
    overId?: string,
  ) => void;
};

export const KanbanBoardContext = createContext<
  KanbanBoardDndMonitorContextValue | undefined
>(undefined);

function useDndMonitor(monitor: KanbanBoardDndMonitorEventHandler) {
  const context = useContext(KanbanBoardContext);
  if (!context) {
    throw new Error('useDndMonitor must be used within a DndMonitorProvider');
  }

  const { registerMonitor, unregisterMonitor } = context;

  useEffect(() => {
    registerMonitor(monitor);
    return () => {
      unregisterMonitor(monitor);
    };
  }, [monitor, registerMonitor, unregisterMonitor]);
}

export function useDndEvents() {
  const context = useContext(KanbanBoardContext);

  if (!context) {
    throw new Error('useDndEvents must be used within a DndMonitorProvider');
  }

  const { activeIdRef, draggableDescribedById, triggerEvent } = context;

  const onDragStart = useCallback(
    (activeId: string) => {
      activeIdRef.current = activeId;
      triggerEvent('onDragStart', activeId);
    },
    [triggerEvent, activeIdRef],
  );

  const onDragMove = useCallback(
    (activeId: string, overId?: string) => {
      triggerEvent('onDragMove', activeId, overId);
    },
    [triggerEvent],
  );

  const onDragOver = useCallback(
    (activeId: string, overId?: string) => {
      // If the activeId is not provided, use the activeId from the ref.
      const actualActiveId = activeId || activeIdRef.current;
      triggerEvent('onDragOver', actualActiveId, overId);
    },
    [triggerEvent, activeIdRef],
  );

  const onDragEnd = useCallback(
    (activeId: string, overId?: string) => {
      triggerEvent('onDragEnd', activeId, overId);
    },
    [triggerEvent],
  );

  const onDragCancel = useCallback(
    (activeId: string) => {
      triggerEvent('onDragCancel', activeId);
    },
    [triggerEvent],
  );

  return {
    draggableDescribedById,
    onDragStart,
    onDragMove,
    onDragOver,
    onDragEnd,
    onDragCancel,
  };
}

export const defaultScreenReaderInstructions = `
To pick up a draggable item, press the space bar.
While dragging, use the arrow keys to move the item.
Press space again to drop the item in its new position, or press escape to cancel.
`;

export type KanbanBoardAnnouncements = {
  onDragStart: (activeId: string) => string;
  onDragMove?: (activeId: string, overId?: string) => string | undefined;
  onDragOver: (activeId: string, overId?: string) => string;
  onDragEnd: (activeId: string, overId?: string) => string;
  onDragCancel: (activeId: string) => string;
};

export const defaultAnnouncements: KanbanBoardAnnouncements = {
  onDragStart(activeId) {
    return `Picked up draggable item ${activeId}.`;
  },
  onDragOver(activeId, overId) {
    if (overId) {
      return `Draggable item ${activeId} was moved over droppable area ${overId}.`;
    }

    return `Draggable item ${activeId} is no longer over a droppable area.`;
  },
  onDragEnd(activeId, overId) {
    if (overId) {
      return `Draggable item ${activeId} was dropped over droppable area ${overId}`;
    }

    return `Draggable item ${activeId} was dropped.`;
  },
  onDragCancel(activeId) {
    return `Dragging was cancelled. Draggable item ${activeId} was dropped.`;
  },
};

export type KanbanBoardLiveRegionProps = {
  id: string;
  announcement: string;
  ariaLiveType?: 'polite' | 'assertive' | 'off';
};

export function KanbanBoardLiveRegion({
  announcement,
  ariaLiveType = 'assertive',
  className,
  id,
  ref,
  ...props
}: ComponentProps<'div'> & KanbanBoardLiveRegionProps) {
  return (
    <div
      aria-live={ariaLiveType}
      aria-atomic
      className={cn(
        'clip-[rect(0_0_0_0)] clip-path-[inset(100%)] fixed top-0 left-0 -m-px h-px w-px overflow-hidden border-0 p-0 whitespace-nowrap',
        className,
      )}
      id={id}
      ref={ref}
      role="status"
      {...props}
    >
      {announcement}
    </div>
  );
}

export type KanbanBoardHiddenTextProps = {
  id: string;
  value: string;
};

export function KanbanBoardHiddenText({
  id,
  value,
  className,
  ref,
  ...props
}: ComponentProps<'div'> & KanbanBoardHiddenTextProps) {
  return (
    <div id={id} className={cn('hidden', className)} ref={ref} {...props}>
      {value}
    </div>
  );
}

export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState('');
  const announce = useCallback((value: string | undefined) => {
    if (value != undefined) {
      setAnnouncement(value);
    }
  }, []);

  return { announce, announcement } as const;
}

export type KanbanBoardAccessibilityProps = {
  announcements?: KanbanBoardAnnouncements;
  container?: Element;
  screenReaderInstructions?: string;
  hiddenTextDescribedById: string;
};

export const KanbanBoardAccessibility = ({
  announcements = defaultAnnouncements,
  container,
  hiddenTextDescribedById,
  screenReaderInstructions = defaultScreenReaderInstructions,
}: KanbanBoardAccessibilityProps) => {
  const { announce, announcement } = useAnnouncement();
  const liveRegionId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useDndMonitor(
    useMemo(
      () => ({
        onDragStart(activeId) {
          announce(announcements.onDragStart(activeId));
        },
        onDragMove(activeId, overId) {
          if (announcements.onDragMove) {
            announce(announcements.onDragMove(activeId, overId));
          }
        },
        onDragOver(activeId, overId) {
          announce(announcements.onDragOver(activeId, overId));
        },
        onDragEnd(activeId, overId) {
          announce(announcements.onDragEnd(activeId, overId));
        },
        onDragCancel(activeId) {
          announce(announcements.onDragCancel(activeId));
        },
      }),
      [announce, announcements],
    ),
  );

  if (!mounted) {
    return null;
  }

  const markup = (
    <>
      <KanbanBoardHiddenText
        id={hiddenTextDescribedById}
        value={screenReaderInstructions}
      />
      <KanbanBoardLiveRegion id={liveRegionId} announcement={announcement} />
    </>
  );

  return container ? createPortal(markup, container) : markup;
};

export type KanbanBoardProviderProps = {
  announcements?: KanbanBoardAnnouncements;
  screenReaderInstructions?: string;
  container?: Element;
  children: React.ReactNode;
};

export const KanbanBoardProvider = ({
  announcements,
  screenReaderInstructions,
  container,
  children,
}: KanbanBoardProviderProps) => {
  const draggableDescribedById = useId();
  const monitorsReference = useRef<KanbanBoardDndMonitorEventHandler[]>([]);
  // Store the activeId in a ref to avoid re-rendering when it changes.
  // This is useful for announcing the drag start and end when you lack access
  // to the active ID, e.g. because you're using `onDragOver` from the
  // `DataTransfer` API. When trying to access data during the dragover event
  // using getData(), it will always return an empty string. This is a security
  // restriction in the HTML5 Drag and Drop API - you cannot access the data
  // during the dragover event, only during the drop event.
  // @see https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer
  const activeIdReference = useRef<string>('');

  const registerMonitor = useCallback(
    (monitor: KanbanBoardDndMonitorEventHandler) => {
      monitorsReference.current.push(monitor);
    },
    [],
  );

  const unregisterMonitor = useCallback(
    (monitor: KanbanBoardDndMonitorEventHandler) => {
      monitorsReference.current = monitorsReference.current.filter(
        m => m !== monitor,
      );
    },
    [],
  );

  const triggerEvent = useCallback(
    (eventType: KanbanBoardDndEventType, activeId: string, overId?: string) => {
      for (const monitor of monitorsReference.current) {
        const handler = monitor[eventType];
        if (handler) {
          handler(activeId, overId);
        }
      }
    },
    [],
  );

  const contextValue = useMemo(
    () => ({
      activeIdRef: activeIdReference,
      draggableDescribedById,
      registerMonitor,
      unregisterMonitor,
      triggerEvent,
    }),
    [
      activeIdReference,
      draggableDescribedById,
      registerMonitor,
      unregisterMonitor,
      triggerEvent,
    ],
  );

  return (
    <TooltipProvider>
      <KanbanBoardContext.Provider value={contextValue}>
        {children}
        <KanbanBoardAccessibility
          announcements={announcements}
          screenReaderInstructions={screenReaderInstructions}
          container={container}
          hiddenTextDescribedById={draggableDescribedById}
        />
      </KanbanBoardContext.Provider>
    </TooltipProvider>
  );
};

/*
Constants
*/

/**
 * Event data transfer types
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer
 */
const DATA_TRANSFER_TYPES = {
  CARD: 'kanban-board-card',
};

const KANBAN_BOARD_CIRCLE_COLORS_MAP = {
  primary: 'bg-kanban-board-circle-primary',
  gray: 'bg-kanban-board-circle-gray',
  red: 'bg-kanban-board-circle-red',
  yellow: 'bg-kanban-board-circle-yellow',
  green: 'bg-kanban-board-circle-green',
  cyan: 'bg-kanban-board-circle-cyan',
  blue: 'bg-kanban-board-circle-blue',
  indigo: 'bg-kanban-board-circle-indigo',
  violet: 'bg-kanban-board-circle-violet',
  purple: 'bg-kanban-board-circle-purple',
  pink: 'bg-kanban-board-circle-pink',
};

export type KanbanBoardCircleColor =
  keyof typeof KANBAN_BOARD_CIRCLE_COLORS_MAP;

export const KANBAN_BOARD_CIRCLE_COLORS = Object.keys(
  KANBAN_BOARD_CIRCLE_COLORS_MAP,
) as KanbanBoardCircleColor[];

/*
Board
*/

export const KanbanBoard = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          'flex h-full flex-grow flex-col items-start gap-x-2 overflow-x-auto py-1',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
KanbanBoard.displayName = 'KanbanBoard';

/**
 * Add some extra margin to the right of the container to allow for scrolling
 * when adding a new column.
 */
export const KanbanBoardExtraMargin = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn('h-1 w-8 flex-shrink-0', className)}
        ref={ref}
        {...props}
      />
    );
  }
);
KanbanBoardExtraMargin.displayName = 'KanbanBoardExtraMargin';

/*
Column
*/

export type KanbanBoardColumnProps = {
  columnId: string;
  onDropOverColumn?: (dataTransferData: string) => void;
};

export const kanbanBoardColumnClassNames =
  'w-64 flex-shrink-0 rounded-xl border flex flex-col border-white/20 dark:border-white/10 dev-lab-glass-light dark:dev-lab-glass-dark bg-white/25 dark:bg-card/25 py-2 max-h-full shadow-xl';

export const KanbanBoardColumn = forwardRef<
  HTMLElement,
  ComponentProps<'section'> & KanbanBoardColumnProps
>(({ className, columnId, onDropOverColumn, ...props }, ref) => {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const { onDragEnd, onDragOver } = useDndEvents();

  return (
    <section
      aria-labelledby={`column-${columnId}-title`}
      className={cn(
        kanbanBoardColumnClassNames,
        isDropTarget && 'border-primary shadow-[0_0_20px_rgba(255,85,93,0.3)]',
        className,
      )}
      onDragLeave={() => {
        setIsDropTarget(false);
      }}
      onDragOver={event => {
        if (event.dataTransfer.types.includes(DATA_TRANSFER_TYPES.CARD)) {
          event.preventDefault();
          setIsDropTarget(true);
          onDragOver('', columnId);
        }
      }}
      onDrop={event => {
        const data = event.dataTransfer.getData(DATA_TRANSFER_TYPES.CARD);
        onDropOverColumn?.(data);
        onDragEnd(JSON.parse(data).id as string, columnId);
        setIsDropTarget(false);
      }}
      ref={ref}
      {...props}
    />
  );
});
KanbanBoardColumn.displayName = 'KanbanBoardColumn';

export function KanbanBoardColumnSkeleton() {
  return (
    <section className={cn(kanbanBoardColumnClassNames, 'h-full py-0')}>
      <Skeleton className="h-full w-full" />
    </section>
  );
}

export const KanbanBoardColumnHeader = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn('flex items-center justify-between px-2 py-1', className)}
        ref={ref}
        {...props}
      />
    );
  }
);
KanbanBoardColumnHeader.displayName = 'KanbanBoardColumnHeader';

export type KanbanBoardColumnTitleProps = {
  columnId: string;
};

export const KanbanBoardColumnTitle = forwardRef<HTMLHeadingElement, ComponentProps<'h2'> & KanbanBoardColumnTitleProps>(
  ({ className, columnId, ...props }, ref) => {
    return (
      <h2
        className={cn(
          'dev-lab-text-primary inline-flex items-center text-sm font-medium',
          className,
        )}
        ref={ref}
        id={`column-${columnId}-title`}
        {...props}
      />
    );
  }
);
KanbanBoardColumnTitle.displayName = 'KanbanBoardColumnTitle';

export const KanbanBoardColumnIconButton = forwardRef<
  React.ElementRef<typeof Button>,
  ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  return (
    <Button
      className={cn('dev-lab-text-muted hover:dev-lab-text-primary size-6 hover:bg-white/20 dark:hover:bg-white/10', className)}
      variant="ghost"
      size="icon"
      ref={ref}
      {...props}
    />
  );
});
KanbanBoardColumnIconButton.displayName = 'KanbanBoardColumnIconButton';

export type KanbanBoardColorCircleProps = {
  color?: KanbanBoardCircleColor;
};

export const KanbanColorCircle = forwardRef<HTMLDivElement, ComponentProps<'div'> & KanbanBoardColorCircleProps>(
  ({ className, color = 'primary', ...props }, ref) => {
    return (
      <div
        className={cn(
          'mr-2 size-2 rounded-full',
          KANBAN_BOARD_CIRCLE_COLORS_MAP[color],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
KanbanColorCircle.displayName = 'KanbanColorCircle';

export const KanbanBoardColumnList = forwardRef<HTMLUListElement, ComponentProps<'ul'>>(
  ({ className, ...props }, ref) => {
    return (
      <ul
        className={cn('min-h-0.5 flex-grow overflow-y-auto', className)}
        ref={ref}
        {...props}
      />
    );
  }
);
KanbanBoardColumnList.displayName = 'KanbanBoardColumnList';

export type KanbanBoardDropDirection = 'none' | 'top' | 'bottom';

export type KanbanBoardColumnListItemProps = {
  cardId: string;
  onDropOverListItem?: (
    dataTransferData: string,
    dropDirection: KanbanBoardDropDirection,
  ) => void;
};

export const kanbanBoardColumnListItemClassNames =
  '-mb-[2px] border-b-2 border-t-2 border-b-transparent border-t-transparent px-2 py-1 last:mb-0';

export const KanbanBoardColumnListItem = forwardRef<
  HTMLLIElement,
  ComponentProps<'li'> & KanbanBoardColumnListItemProps
>(({ cardId, className, onDropOverListItem, ...props }, ref) => {
  const [dropDirection, setDropDirection] =
    useState<KanbanBoardDropDirection>('none');
  const { onDragOver, onDragEnd } = useDndEvents();

  return (
    <li
      className={cn(
        kanbanBoardColumnListItemClassNames,
        dropDirection === 'top' && 'border-t-[#ff555d]',
        dropDirection === 'bottom' && 'border-b-[#ff555d]',
        className,
      )}
      onDragLeave={() => {
        setDropDirection('none');
      }}
      onDragOver={event => {
        if (event.dataTransfer.types.includes(DATA_TRANSFER_TYPES.CARD)) {
          event.preventDefault();
          event.stopPropagation();
          const rect = event.currentTarget.getBoundingClientRect();
          const midpoint = (rect.top + rect.bottom) / 2;
          setDropDirection(event.clientY <= midpoint ? 'top' : 'bottom');
          onDragOver('', cardId);
        }
      }}
      onDrop={event => {
        event.stopPropagation();
        const data = event.dataTransfer.getData(DATA_TRANSFER_TYPES.CARD);
        onDropOverListItem?.(data, dropDirection);

        onDragEnd(JSON.parse(data).id as string, cardId);
        setDropDirection('none');
      }}
      ref={ref}
      {...props}
    />
  );
});
KanbanBoardColumnListItem.displayName = 'KanbanBoardColumnListItem';

export const KanbanBoardColumnFooter = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn('flex items-center justify-between px-2 pt-1', className)}
        ref={ref}
        {...props}
      />
    );
  }
);
KanbanBoardColumnFooter.displayName = 'KanbanBoardColumnFooter';

export const KanbanBoardColumnButton = forwardRef<
  React.ElementRef<typeof Button>,
  ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  return (
    <Button
      className={cn(
        'bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-primary hover:text-primary-hover hover:bg-white/40 dark:hover:bg-white/20 w-full justify-start transition-all',
        className,
      )}
      variant="outline"
      size="sm"
      ref={ref}
      {...props}
    />
  );
});
KanbanBoardColumnButton.displayName = 'KanbanBoardColumnButton';

/*
Card
*/

export type KanbanBoardCardProps<T extends { id: string } = { id: string }> = {
  /**
   * A string representing the data to add to the DataTransfer.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/setData#data
   */
  data: T;
  /**
   * Whether the card is being moved with the keyboard.
   */
  isActive?: boolean;
};

const kanbanBoardCardClassNames =
  'rounded-xl border border-white/20 dark:border-white/10 dev-lab-glass-light dark:dev-lab-glass-dark bg-white/30 dark:bg-white/10 p-3 text-start dev-lab-text-primary shadow-lg hover:shadow-xl transition-shadow';

export const KanbanBoardCard = forwardRef<
  HTMLButtonElement,
  ComponentProps<'button'> & KanbanBoardCardProps
>(({ className, data, isActive = false, ...props }, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const { draggableDescribedById, onDragStart } = useDndEvents();

  return (
    <button
      aria-describedby={draggableDescribedById}
      aria-roledescription="draggable"
      className={cn(
        kanbanBoardCardClassNames,
        'focus-visible:ring-ring inline-flex w-full cursor-grab touch-manipulation flex-col gap-1 focus-visible:ring-1 focus-visible:outline-none',
        isDragging
          ? 'cursor-grabbing active:cursor-grabbing'
          : 'group relative',
        isActive && 'rotate-1 transform shadow-lg',
        className,
      )}
      draggable
      onDragStart={event => {
        setIsDragging(true);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData(
          DATA_TRANSFER_TYPES.CARD,
          JSON.stringify(data),
        );
        // Remove outline from the card when dragging.
        event.currentTarget.blur();

        onDragStart(data.id);
      }}
      onDragEnd={() => {
        setIsDragging(false);
      }}
      ref={ref}
      {...props}
    />
  );
});
KanbanBoardCard.displayName = 'KanbanBoardCard';

export const KanbanBoardCardTitle = forwardRef<HTMLHeadingElement, ComponentProps<'h3'>>(
  ({ className, ...props }, ref) => {
    return (
      <h3 className={cn('text-sm font-medium', className)} ref={ref} {...props} />
    );
  }
);
KanbanBoardCardTitle.displayName = 'KanbanBoardCardTitle';

export const KanbanBoardCardDescription = forwardRef<HTMLParagraphElement, ComponentProps<'p'>>(
  ({ className, ...props }, ref) => {
    return (
      <p
        className={cn(
          'dev-lab-text-primary text-xs leading-5 whitespace-pre-wrap',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
KanbanBoardCardDescription.displayName = 'KanbanBoardCardDescription';

export function KanbanBoardCardTextarea({
  className,
  onChange,
  value,
  ref: externalReference,
  ...props
}: ComponentProps<'textarea'>) {
  const internalReference = useRef<HTMLTextAreaElement | null>(null);

  /**
   * Adjusts the height of the textarea to handle cases where the text exceeds
   * the width of the Textarea and wraps around to the next line.
   */
  const adjustTextareaHeight = () => {
    if (internalReference.current) {
      internalReference.current.style.height = 'auto'; // Reset height to recalculate.
      internalReference.current.style.height = `${internalReference.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    // When the component mounts, adjust the height of the textarea. This
    // prevents a bug where the text area is too short when the component
    // mounts and has long text.
    adjustTextareaHeight();
  }, []);

  useEffect(() => {
    // When the value is emptied, adjust the height of the textarea. This
    // prevents a bug where the text area is too short when the component
    // is emptied and had long text before being emptied.
    if (value === '') {
      adjustTextareaHeight();
    }
  }, [value]);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange?.(event);
    adjustTextareaHeight();
  }

  // Expose the internal ref to the possible external ref.
  useImperativeHandle(externalReference, () => internalReference.current!);

  return (
    <Textarea
      className={cn(
        kanbanBoardCardClassNames,
        'min-h-min resize-none overflow-hidden text-xs leading-5 bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 dev-lab-text-primary placeholder:dev-lab-text-muted-light',
        className,
      )}
      onChange={handleChange}
      rows={1}
      value={value}
      ref={internalReference}
      {...props}
    />
  );
}

export type KanbanBoardCardButtonGroupProps = {
  disabled?: boolean;
};

export const KanbanBoardCardButtonGroup = forwardRef<
  HTMLDivElement,
  ComponentProps<'div'> & KanbanBoardCardButtonGroupProps
>(({ className, disabled = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'dev-lab-glass-light dark:dev-lab-glass-dark bg-white/40 dark:bg-white/20 absolute top-2.5 right-2.5 z-40 hidden items-center rounded-lg border border-white/20 dark:border-white/10',
        !disabled && 'group-focus-within:flex group-hover:flex',
        className,
      )}
      {...props}
    />
  );
});
KanbanBoardCardButtonGroup.displayName = 'KanbanBoardCardButtonGroup';

export type KanbanBoardCardButtonProps = {
  tooltip?: string;
};

/**
 * A button that can be used within a KanbanBoardCard.
 * It's a div under the hood because you shouldn't nest buttons within buttons,
 * and the card is a button.
 */
export function KanbanBoardCardButton({
  className,
  tooltip,
  ref: externalReference,
  ...props
}: ComponentProps<'div'> & KanbanBoardCardButtonProps) {
  const internalReference = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(externalReference, () => internalReference.current!);

  // Handler for keydown events to emulate button behavior.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Check if the pressed key is 'Enter' or 'Space'.
    if (event.key === 'Enter' || event.key === ' ') {
      // Prevent default behavior (like scrolling on Space).
      event.preventDefault();
      // Prevent the event from bubbling up to parent elements.
      event.stopPropagation();

      // Simulate a click on the div.
      internalReference.current?.click();
    }
  };

  const button = (
    <div
        className={cn(
          buttonVariants({ size: 'icon', variant: 'ghost' }),
          'border-white/20 dark:border-white/10 size-5 border hover:cursor-default hover:bg-white/20 dark:hover:bg-white/10 [&_svg]:size-3.5 dev-lab-text-primary',
          className,
        )}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      ref={internalReference}
      {...props}
    />
  );

  if (!tooltip) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>

      <TooltipContent align="center" side="bottom" className="dev-lab-glass-light dark:dev-lab-glass-dark border-white/20 dark:border-white/10 bg-white/25 dark:bg-card/25 dev-lab-text-primary">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

