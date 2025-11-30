/* eslint-disable unicorn/no-null */
import React, {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import {
  MoreHorizontal,
  Pen,
  Plus,
  Trash2,
} from 'lucide-react';

import { useJsLoaded } from './use-js-loaded';
import type {
  KanbanBoardCircleColor,
  KanbanBoardDropDirection,
} from './kanban';
import {
  KANBAN_BOARD_CIRCLE_COLORS,
  KanbanBoard,
  KanbanBoardCard,
  KanbanBoardCardButton,
  KanbanBoardCardButtonGroup,
  KanbanBoardCardDescription,
  KanbanBoardCardTextarea,
  KanbanBoardColumn,
  KanbanBoardColumnButton,
  kanbanBoardColumnClassNames,
  KanbanBoardColumnFooter,
  KanbanBoardColumnHeader,
  KanbanBoardColumnIconButton,
  KanbanBoardColumnList,
  KanbanBoardColumnListItem,
  kanbanBoardColumnListItemClassNames,
  KanbanBoardColumnSkeleton,
  KanbanBoardColumnTitle,
  KanbanBoardExtraMargin,
  KanbanBoardProvider,
  KanbanColorCircle,
  useDndEvents,
} from './kanban';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { Input } from '../../ui/input';
import { Skeleton } from '../../ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../ui/tooltip';
import { cn } from '../../../lib/utils';

// Simple ID generator (replace with @paralleldrive/cuid2 if needed)
function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Types
type Card = {
  id: string;
  title: string;
};

type Column = {
  id: string;
  title: string;
  color: KanbanBoardCircleColor;
  items: Card[];
};

export function KanbanExample() {
  // Create the first column
  const firstColumnId = createId();
  const firstColumn: Column = {
    id: firstColumnId,
    title: 'Backlog',
    color: 'primary',
    items: [
      {
        id: createId(),
        title: 'Add a new column',
      },
      {
        id: createId(),
        title: 'Add a new card',
      },
      {
        id: createId(),
        title: 'Move a card to another column',
      },
    ],
  };

  // Create a deep clone of the first column with unique IDs for the first duplicate
  const duplicateColumnId = createId();
  const duplicateColumn: Column = {
    id: duplicateColumnId,
    title: firstColumn.title,
    color: firstColumn.color,
    items: firstColumn.items.map(card => ({
      id: createId(),
      title: card.title,
    })),
  };

  // Create a second deep clone of the first column with unique IDs for the second duplicate
  const duplicateColumn2Id = createId();
  const duplicateColumn2: Column = {
    id: duplicateColumn2Id,
    title: firstColumn.title,
    color: firstColumn.color,
    items: firstColumn.items.map(card => ({
      id: createId(),
      title: card.title,
    })),
  };

  const [columns, setColumns] = useState<Column[]>([
    firstColumn,
    {
      id: createId(),
      title: 'To Do',
      color: 'blue',
      items: [
        {
          id: createId(),
          title: 'Install the Shadcn Kanban board',
        },
        {
          id: createId(),
          title: 'Build amazing apps',
        },
      ],
    },
    {
      id: createId(),
      title: 'In Progress',
      color: 'red',
      items: [
        {
          id: createId(),
          title: 'Make some magic',
        },
      ],
    },
    {
      id: createId(),
      title: 'Done',
      color: 'green',
      items: [
        {
          id: createId(),
          title: 'Welcome to the Dev Lab Kanban!',
        },
      ],
    },
  ]);

  // Store the duplicate columns separately
  const [duplicateFirstColumn, setDuplicateFirstColumn] = useState<Column>(duplicateColumn);
  const [duplicateFirstColumn2, setDuplicateFirstColumn2] = useState<Column>(duplicateColumn2);

  // Scroll to the right when a new column is added.
  const scrollContainerReference = useRef<HTMLDivElement>(null);

  function scrollRight() {
    if (scrollContainerReference.current) {
      scrollContainerReference.current.scrollLeft =
        scrollContainerReference.current.scrollWidth;
    }
  }

  /*
  Column logic
  */

  const handleAddColumn = (title?: string) => {
    if (title) {
      flushSync(() => {
        setColumns(previousColumns => [
          ...previousColumns,
          {
            id: createId(),
            title,
            color:
              KANBAN_BOARD_CIRCLE_COLORS[previousColumns.length % KANBAN_BOARD_CIRCLE_COLORS.length] ?? 'primary',
            items: [],
          },
        ]);
      });
    }

    scrollRight();
  };

  function handleDeleteColumn(columnId: string) {
    // Don't allow deleting the duplicate columns (they're part of the first column wrapper)
    if (columnId === duplicateFirstColumn.id || columnId === duplicateFirstColumn2.id) {
      return;
    }
    flushSync(() => {
      setColumns(previousColumns =>
        previousColumns.filter(column => column.id !== columnId),
      );
    });

    scrollRight();
  }

  function handleUpdateColumnTitle(columnId: string, title: string) {
    // Check if it's one of the duplicate columns
    if (columnId === duplicateFirstColumn.id) {
      setDuplicateFirstColumn(prev => ({ ...prev, title }));
    } else if (columnId === duplicateFirstColumn2.id) {
      setDuplicateFirstColumn2(prev => ({ ...prev, title }));
    } else {
      setColumns(previousColumns =>
        previousColumns.map(column =>
          column.id === columnId ? { ...column, title } : column,
        ),
      );
    }
  }

  /*
  Card logic
  */

  function handleAddCard(columnId: string, cardContent: string) {
    // Check if it's one of the duplicate columns
    if (columnId === duplicateFirstColumn.id) {
      setDuplicateFirstColumn(prev => ({
        ...prev,
        items: [...prev.items, { id: createId(), title: cardContent }],
      }));
    } else if (columnId === duplicateFirstColumn2.id) {
      setDuplicateFirstColumn2(prev => ({
        ...prev,
        items: [...prev.items, { id: createId(), title: cardContent }],
      }));
    } else {
      setColumns(previousColumns =>
        previousColumns.map(column =>
          column.id === columnId
            ? {
                ...column,
                items: [...column.items, { id: createId(), title: cardContent }],
              }
            : column,
        ),
      );
    }
  }

  function handleDeleteCard(cardId: string) {
    // Check if the card is in one of the duplicate columns
    if (duplicateFirstColumn.items.some(card => card.id === cardId)) {
      setDuplicateFirstColumn(prev => ({
        ...prev,
        items: prev.items.filter(({ id }) => id !== cardId),
      }));
    } else if (duplicateFirstColumn2.items.some(card => card.id === cardId)) {
      setDuplicateFirstColumn2(prev => ({
        ...prev,
        items: prev.items.filter(({ id }) => id !== cardId),
      }));
    } else {
      setColumns(previousColumns =>
        previousColumns.map(column =>
          column.items.some(card => card.id === cardId)
            ? { ...column, items: column.items.filter(({ id }) => id !== cardId) }
            : column,
        ),
      );
    }
  }

  function handleMoveCardToColumn(columnId: string, index: number, card: Card) {
    // Check if it's one of the duplicate columns
    if (columnId === duplicateFirstColumn.id) {
      setDuplicateFirstColumn(prev => {
        const updatedItems = prev.items.filter(({ id }) => id !== card.id);
        return {
          ...prev,
          items: [
            ...updatedItems.slice(0, index),
            card,
            ...updatedItems.slice(index),
          ],
        };
      });
      // Also remove the card from other columns
      setColumns(previousColumns =>
        previousColumns.map(column => ({
          ...column,
          items: column.items.filter(({ id }) => id !== card.id),
        })),
      );
      // Remove from second duplicate if it exists there
      if (duplicateFirstColumn2.items.some(c => c.id === card.id)) {
        setDuplicateFirstColumn2(prev => ({
          ...prev,
          items: prev.items.filter(({ id }) => id !== card.id),
        }));
      }
    } else if (columnId === duplicateFirstColumn2.id) {
      setDuplicateFirstColumn2(prev => {
        const updatedItems = prev.items.filter(({ id }) => id !== card.id);
        return {
          ...prev,
          items: [
            ...updatedItems.slice(0, index),
            card,
            ...updatedItems.slice(index),
          ],
        };
      });
      // Also remove the card from other columns
      setColumns(previousColumns =>
        previousColumns.map(column => ({
          ...column,
          items: column.items.filter(({ id }) => id !== card.id),
        })),
      );
      // Remove from first duplicate if it exists there
      if (duplicateFirstColumn.items.some(c => c.id === card.id)) {
        setDuplicateFirstColumn(prev => ({
          ...prev,
          items: prev.items.filter(({ id }) => id !== card.id),
        }));
      }
    } else {
      setColumns(previousColumns =>
        previousColumns.map(column => {
          if (column.id === columnId) {
            // Remove the card from the column (if it exists) before reinserting it.
            const updatedItems = column.items.filter(({ id }) => id !== card.id);
            return {
              ...column,
              items: [
                // Items before the insertion index.
                ...updatedItems.slice(0, index),
                // Insert the card.
                card,
                // Items after the insertion index.
                ...updatedItems.slice(index),
              ],
            };
          } else {
            // Remove the card from other columns.
            return {
              ...column,
              items: column.items.filter(({ id }) => id !== card.id),
            };
          }
        }),
      );
      // Also remove the card from the duplicate columns if they exist there
      if (duplicateFirstColumn.items.some(c => c.id === card.id)) {
        setDuplicateFirstColumn(prev => ({
          ...prev,
          items: prev.items.filter(({ id }) => id !== card.id),
        }));
      }
      if (duplicateFirstColumn2.items.some(c => c.id === card.id)) {
        setDuplicateFirstColumn2(prev => ({
          ...prev,
          items: prev.items.filter(({ id }) => id !== card.id),
        }));
      }
    }
  }

  function handleUpdateCardTitle(cardId: string, cardTitle: string) {
    // Check if the card is in one of the duplicate columns
    if (duplicateFirstColumn.items.some(card => card.id === cardId)) {
      setDuplicateFirstColumn(prev => ({
        ...prev,
        items: prev.items.map(card =>
          card.id === cardId ? { ...card, title: cardTitle } : card,
        ),
      }));
    } else if (duplicateFirstColumn2.items.some(card => card.id === cardId)) {
      setDuplicateFirstColumn2(prev => ({
        ...prev,
        items: prev.items.map(card =>
          card.id === cardId ? { ...card, title: cardTitle } : card,
        ),
      }));
    } else {
      setColumns(previousColumns =>
        previousColumns.map(column =>
          column.items.some(card => card.id === cardId)
            ? {
                ...column,
                items: column.items.map(card =>
                  card.id === cardId ? { ...card, title: cardTitle } : card,
                ),
              }
            : column,
        ),
      );
    }
  }

  /*
  Moving cards with the keyboard.
  */
  const [activeCardId, setActiveCardId] = useState<string>('');
  const originalCardPositionReference = useRef<{
    columnId: string;
    cardIndex: number;
  } | null>(null);
  const { onDragStart, onDragEnd, onDragCancel, onDragOver } = useDndEvents();

  // This helper returns the appropriate overId after a card is placed.
  // If there's another card below, return that card's id, otherwise return the column's id.
  function getOverId(column: Column, cardIndex: number): string {
    if (cardIndex < column.items.length - 1) {
      return column.items[cardIndex + 1].id;
    }

    return column.id;
  }

  // Find column and index for a given card.
  function findCardPosition(cardId: string): {
    columnIndex: number;
    cardIndex: number;
    isDuplicate: boolean;
    duplicateIndex?: number; // 1 for first duplicate, 2 for second duplicate
  } {
    // Check first duplicate column
    const duplicateCardIndex = duplicateFirstColumn.items.findIndex(c => c.id === cardId);
    if (duplicateCardIndex !== -1) {
      return { columnIndex: 0, cardIndex: duplicateCardIndex, isDuplicate: true, duplicateIndex: 1 };
    }

    // Check second duplicate column
    const duplicate2CardIndex = duplicateFirstColumn2.items.findIndex(c => c.id === cardId);
    if (duplicate2CardIndex !== -1) {
      return { columnIndex: 0, cardIndex: duplicate2CardIndex, isDuplicate: true, duplicateIndex: 2 };
    }

    // Check regular columns
    for (const [columnIndex, column] of columns.entries()) {
      const cardIndex = column.items.findIndex(c => c.id === cardId);

      if (cardIndex !== -1) {
        return { columnIndex, cardIndex, isDuplicate: false };
      }
    }

    return { columnIndex: -1, cardIndex: -1, isDuplicate: false };
  }

  function moveActiveCard(
    cardId: string,
    direction: 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown',
  ) {
    const { columnIndex, cardIndex, isDuplicate, duplicateIndex } = findCardPosition(cardId);
    if (columnIndex === -1 || cardIndex === -1) return;

    const card = isDuplicate 
      ? (duplicateIndex === 1 
          ? duplicateFirstColumn.items[cardIndex]
          : duplicateFirstColumn2.items[cardIndex])
      : columns[columnIndex].items[cardIndex];

    let newColumnIndex = columnIndex;
    let newCardIndex = cardIndex;
    let newIsDuplicate = isDuplicate;
    let newDuplicateIndex = duplicateIndex;
    let targetColumnId: string;

    switch (direction) {
      case 'ArrowUp': {
        if (isDuplicate) {
          if (duplicateIndex === 2) {
            // Move from second duplicate to first duplicate
            newDuplicateIndex = 1;
            newCardIndex = Math.min(cardIndex, duplicateFirstColumn.items.length);
            targetColumnId = duplicateFirstColumn.id;
          } else {
            // Move from first duplicate to original first column
            newIsDuplicate = false;
            newDuplicateIndex = undefined;
            newColumnIndex = 0;
            newCardIndex = Math.min(cardIndex, columns[0].items.length);
            targetColumnId = columns[0].id;
          }
        } else {
          newCardIndex = Math.max(cardIndex - 1, 0);
          targetColumnId = columns[columnIndex].id;
        }
        break;
      }
      case 'ArrowDown': {
        if (isDuplicate) {
          if (duplicateIndex === 1) {
            // Move from first duplicate to second duplicate
            newDuplicateIndex = 2;
            newCardIndex = Math.min(cardIndex, duplicateFirstColumn2.items.length);
            targetColumnId = duplicateFirstColumn2.id;
          } else {
            // Stay in second duplicate
            newCardIndex = Math.min(
              cardIndex + 1,
              duplicateFirstColumn2.items.length - 1,
            );
            targetColumnId = duplicateFirstColumn2.id;
          }
        } else {
          if (columnIndex === 0) {
            // Move from original first column to first duplicate
            newIsDuplicate = true;
            newDuplicateIndex = 1;
            newCardIndex = Math.min(cardIndex, duplicateFirstColumn.items.length);
            targetColumnId = duplicateFirstColumn.id;
          } else {
            newCardIndex = Math.min(
              cardIndex + 1,
              columns[columnIndex].items.length - 1,
            );
            targetColumnId = columns[columnIndex].id;
          }
        }
        break;
      }
      case 'ArrowLeft': {
        if (isDuplicate) {
          // Move to the original first column
          newIsDuplicate = false;
          newDuplicateIndex = undefined;
          newColumnIndex = 0;
          newCardIndex = Math.min(
            cardIndex,
            columns[0].items.length,
          );
          targetColumnId = columns[0].id;
        } else {
          newColumnIndex = Math.max(columnIndex - 1, 0);
          newCardIndex = Math.min(
            cardIndex,
            columns[newColumnIndex].items.length,
          );
          targetColumnId = columns[newColumnIndex].id;
        }
        break;
      }
      case 'ArrowRight': {
        if (isDuplicate) {
          // Move to the second column (index 1)
          newIsDuplicate = false;
          newDuplicateIndex = undefined;
          newColumnIndex = Math.min(1, columns.length - 1);
          newCardIndex = Math.min(
            cardIndex,
            columns[newColumnIndex].items.length,
          );
          targetColumnId = columns[newColumnIndex].id;
        } else {
          if (columnIndex === 0) {
            // Move from first column to first duplicate
            newIsDuplicate = true;
            newDuplicateIndex = 1;
            newCardIndex = Math.min(cardIndex, duplicateFirstColumn.items.length);
            targetColumnId = duplicateFirstColumn.id;
          } else {
            newColumnIndex = Math.min(columnIndex + 1, columns.length - 1);
            newCardIndex = Math.min(
              cardIndex,
              columns[newColumnIndex].items.length,
            );
            targetColumnId = columns[newColumnIndex].id;
          }
        }
        break;
      }
    }

    // Perform state update in flushSync to ensure immediate state update.
    flushSync(() => {
      handleMoveCardToColumn(targetColumnId, newCardIndex, card);
    });

    // Find the card's new position and announce it.
    const { columnIndex: updatedColumnIndex, cardIndex: updatedCardIndex, isDuplicate: updatedIsDuplicate, duplicateIndex: updatedDuplicateIndex } =
      findCardPosition(cardId);
    const targetColumn = updatedIsDuplicate 
      ? (updatedDuplicateIndex === 1 ? duplicateFirstColumn : duplicateFirstColumn2)
      : columns[updatedColumnIndex];
    const overId = getOverId(targetColumn, updatedCardIndex);

    onDragOver(cardId, overId);
  }

  function handleCardKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    cardId: string,
  ) {
    const { key } = event;

    if (activeCardId === '' && key === ' ') {
      // Pick up the card.
      event.preventDefault();
      setActiveCardId(cardId);
      onDragStart(cardId);

      const { columnIndex, cardIndex, isDuplicate, duplicateIndex } = findCardPosition(cardId);
      originalCardPositionReference.current =
        columnIndex !== -1 && cardIndex !== -1
          ? { 
              columnId: isDuplicate 
                ? (duplicateIndex === 1 ? duplicateFirstColumn.id : duplicateFirstColumn2.id)
                : columns[columnIndex].id, 
              cardIndex 
            }
          : null;
    } else if (activeCardId === cardId) {
      // Card is already active.
      if (key === ' ' || key === 'Enter') {
        event.preventDefault();
        // Drop the card.
        flushSync(() => {
          setActiveCardId('');
        });

        const { columnIndex, cardIndex, isDuplicate, duplicateIndex } = findCardPosition(cardId);
        if (columnIndex !== -1 && cardIndex !== -1) {
          const targetColumn = isDuplicate 
            ? (duplicateIndex === 1 ? duplicateFirstColumn : duplicateFirstColumn2)
            : columns[columnIndex];
          const overId = getOverId(targetColumn, cardIndex);
          onDragEnd(cardId, overId);
        } else {
          // If we somehow can't find the card, just call onDragEnd with cardId.
          onDragEnd(cardId);
        }

        originalCardPositionReference.current = null;
      } else if (key === 'Escape') {
        event.preventDefault();

        // Cancel the drag.
        if (originalCardPositionReference.current) {
          const { columnId, cardIndex } = originalCardPositionReference.current;
          const {
            columnIndex: currentColumnIndex,
            cardIndex: currentCardIndex,
            isDuplicate: currentIsDuplicate,
            duplicateIndex: currentDuplicateIndex,
          } = findCardPosition(cardId);

          // Revert card only if it moved.
          const currentColumnId = currentIsDuplicate 
            ? (currentDuplicateIndex === 1 ? duplicateFirstColumn.id : duplicateFirstColumn2.id)
            : (currentColumnIndex !== -1 ? columns[currentColumnIndex].id : null);
          
          if (
            currentColumnIndex !== -1 &&
            currentColumnId &&
            (columnId !== currentColumnId || cardIndex !== currentCardIndex)
          ) {
            const card = currentIsDuplicate
              ? (currentDuplicateIndex === 1 
                  ? duplicateFirstColumn.items[currentCardIndex]
                  : duplicateFirstColumn2.items[currentCardIndex])
              : columns[currentColumnIndex].items[currentCardIndex];
            flushSync(() => {
              handleMoveCardToColumn(columnId, cardIndex, card);
            });
          }
        }

        onDragCancel(cardId);
        originalCardPositionReference.current = null;

        setActiveCardId('');
      } else if (
        key === 'ArrowLeft' ||
        key === 'ArrowRight' ||
        key === 'ArrowUp' ||
        key === 'ArrowDown'
      ) {
        event.preventDefault();
        moveActiveCard(cardId, key);
        // onDragOver is called inside moveActiveCard after placement.
      }
    }
  }

  function handleCardBlur() {
    setActiveCardId('');
  }

  const jsLoaded = useJsLoaded();

  return (
    <KanbanBoard ref={scrollContainerReference}>
      <div className="flex flex-grow items-start gap-x-2 overflow-x-auto">
        {columns.map((column, index) => (
          <div key={column.id} className="flex flex-col gap-y-2">
            {jsLoaded ? (
              <>
                {/* Original column */}
                <MyKanbanBoardColumn
                  activeCardId={activeCardId}
                  column={column}
                  onAddCard={handleAddCard}
                  onCardBlur={handleCardBlur}
                  onCardKeyDown={handleCardKeyDown}
                  onDeleteCard={handleDeleteCard}
                  onDeleteColumn={handleDeleteColumn}
                  onMoveCardToColumn={handleMoveCardToColumn}
                  onUpdateCardTitle={handleUpdateCardTitle}
                  onUpdateColumnTitle={handleUpdateColumnTitle}
                />
                {/* Duplicated first column - only for the first column */}
                {index === 0 && (
                  <>
                    <MyKanbanBoardColumn
                      activeCardId={activeCardId}
                      column={duplicateFirstColumn}
                      onAddCard={handleAddCard}
                      onCardBlur={handleCardBlur}
                      onCardKeyDown={handleCardKeyDown}
                      onDeleteCard={handleDeleteCard}
                      onDeleteColumn={handleDeleteColumn}
                      onMoveCardToColumn={handleMoveCardToColumn}
                      onUpdateCardTitle={handleUpdateCardTitle}
                      onUpdateColumnTitle={handleUpdateColumnTitle}
                    />
                    {/* Second duplicate column */}
                    <MyKanbanBoardColumn
                      activeCardId={activeCardId}
                      column={duplicateFirstColumn2}
                      onAddCard={handleAddCard}
                      onCardBlur={handleCardBlur}
                      onCardKeyDown={handleCardKeyDown}
                      onDeleteCard={handleDeleteCard}
                      onDeleteColumn={handleDeleteColumn}
                      onMoveCardToColumn={handleMoveCardToColumn}
                      onUpdateCardTitle={handleUpdateCardTitle}
                      onUpdateColumnTitle={handleUpdateColumnTitle}
                    />
                  </>
                )}
              </>
            ) : (
              <>
                <KanbanBoardColumnSkeleton key={column.id} />
                {index === 0 && (
                  <>
                    <KanbanBoardColumnSkeleton key={`${column.id}-duplicate`} />
                    <KanbanBoardColumnSkeleton key={`${column.id}-duplicate-2`} />
                  </>
                )}
              </>
            )}
          </div>
        ))}

        {/* Add a new column */}
        {jsLoaded ? (
          <MyNewKanbanBoardColumn onAddColumn={handleAddColumn} />
        ) : (
          <Skeleton className="h-9 w-10.5 flex-shrink-0" />
        )}

        <KanbanBoardExtraMargin />
      </div>
    </KanbanBoard>
  );
}

function MyKanbanBoardColumn({
  activeCardId,
  column,
  onAddCard,
  onCardBlur,
  onCardKeyDown,
  onDeleteCard,
  onDeleteColumn,
  onMoveCardToColumn,
  onUpdateCardTitle,
  onUpdateColumnTitle,
}: {
  activeCardId: string;
  column: Column;
  onAddCard: (columnId: string, cardContent: string) => void;
  onCardBlur: () => void;
  onCardKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    cardId: string,
  ) => void;
  onDeleteCard: (cardId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onMoveCardToColumn: (columnId: string, index: number, card: Card) => void;
  onUpdateCardTitle: (cardId: string, cardTitle: string) => void;
  onUpdateColumnTitle: (columnId: string, columnTitle: string) => void;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const listReference = useRef<HTMLUListElement>(null);
  const moreOptionsButtonReference = useRef<HTMLButtonElement>(null);
  const { onDragCancel, onDragEnd } = useDndEvents();

  function scrollList() {
    if (listReference.current) {
      listReference.current.scrollTop = listReference.current.scrollHeight;
    }
  }

  function closeDropdownMenu() {
    flushSync(() => {
      setIsEditingTitle(false);
    });

    moreOptionsButtonReference.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const columnTitle = formData.get('columnTitle') as string;
    onUpdateColumnTitle(column.id, columnTitle);
    closeDropdownMenu();
  }

  function handleDropOverColumn(dataTransferData: string) {
    const card = JSON.parse(dataTransferData) as Card;
    onMoveCardToColumn(column.id, 0, card);
  }

  function handleDropOverListItem(cardId: string) {
    return (
      dataTransferData: string,
      dropDirection: KanbanBoardDropDirection,
    ) => {
      const card = JSON.parse(dataTransferData) as Card;
      const cardIndex = column.items.findIndex(({ id }) => id === cardId);
      const currentCardIndex = column.items.findIndex(
        ({ id }) => id === card.id,
      );

      const baseIndex = dropDirection === 'top' ? cardIndex : cardIndex + 1;
      const targetIndex =
        currentCardIndex !== -1 && currentCardIndex < baseIndex
          ? baseIndex - 1
          : baseIndex;

      // Safety check to ensure targetIndex is within bounds
      const safeTargetIndex = Math.max(
        0,
        Math.min(targetIndex, column.items.length),
      );
      const overCard = column.items[safeTargetIndex];

      if (card.id === overCard?.id) {
        onDragCancel(card.id);
      } else {
        onMoveCardToColumn(column.id, safeTargetIndex, card);
        onDragEnd(card.id, overCard?.id || column.id);
      }
    };
  }

  return (
    <KanbanBoardColumn
      columnId={column.id}
      key={column.id}
      onDropOverColumn={handleDropOverColumn}
    >
      <KanbanBoardColumnHeader>
        {isEditingTitle ? (
          <form
            className="w-full"
            onSubmit={handleSubmit}
            onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                closeDropdownMenu();
              }
            }}
          >
            <Input
              aria-label="Column title"
              autoFocus
              defaultValue={column.title}
              name="columnTitle"
              onKeyDown={event => {
                if (event.key === 'Escape') {
                  closeDropdownMenu();
                }
              }}
              required
              className="bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 dev-lab-text-primary placeholder:dev-lab-text-muted-light"
            />
          </form>
        ) : (
          <>
            <KanbanBoardColumnTitle columnId={column.id}>
              <KanbanColorCircle color={column.color} />
              {column.title}
            </KanbanBoardColumnTitle>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <KanbanBoardColumnIconButton ref={moreOptionsButtonReference}>
                  <MoreHorizontal />

                  <span className="sr-only">
                    More options for {column.title}
                  </span>
                </KanbanBoardColumnIconButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="dev-lab-glass-light dark:dev-lab-glass-dark border-white/20 dark:border-white/10 bg-white/25 dark:bg-[#2f3235]/25">
                <DropdownMenuLabel className="dev-lab-text-primary">Column</DropdownMenuLabel>

                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setIsEditingTitle(true)} className="dev-lab-text-primary hover:bg-white/20 dark:hover:bg-white/10 focus:bg-white/20 dark:focus:bg-white/10">
                    <Pen />
                    Edit Details
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="text-destructive hover:bg-white/20 dark:hover:bg-white/10 focus:bg-white/20 dark:focus:bg-white/10"
                    onClick={() => onDeleteColumn(column.id)}
                  >
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </KanbanBoardColumnHeader>

      <KanbanBoardColumnList ref={listReference}>
        {column.items.map(card => (
          <KanbanBoardColumnListItem
            cardId={card.id}
            key={card.id}
            onDropOverListItem={handleDropOverListItem(card.id)}
          >
            <MyKanbanBoardCard
              card={card}
              isActive={activeCardId === card.id}
              onCardBlur={onCardBlur}
              onCardKeyDown={onCardKeyDown}
              onDeleteCard={onDeleteCard}
              onUpdateCardTitle={onUpdateCardTitle}
            />
          </KanbanBoardColumnListItem>
        ))}
      </KanbanBoardColumnList>

      <MyNewKanbanBoardCard
        column={column}
        onAddCard={onAddCard}
        scrollList={scrollList}
      />
    </KanbanBoardColumn>
  );
}

function MyKanbanBoardCard({
  card,
  isActive,
  onCardBlur,
  onCardKeyDown,
  onDeleteCard,
  onUpdateCardTitle,
}: {
  card: Card;
  isActive: boolean;
  onCardBlur: () => void;
  onCardKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    cardId: string,
  ) => void;
  onDeleteCard: (cardId: string) => void;
  onUpdateCardTitle: (cardId: string, cardTitle: string) => void;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const kanbanBoardCardReference = useRef<HTMLButtonElement>(null);
  // This ref tracks the previous `isActive` state. It is used to refocus the
  // card after it was discarded with the keyboard.
  const previousIsActiveReference = useRef(isActive);
  // This ref tracks if the card was cancelled via Escape.
  const wasCancelledReference = useRef(false);

  useEffect(() => {
    // Maintain focus after the card is picked up and moved.
    if (isActive && !isEditingTitle) {
      kanbanBoardCardReference.current?.focus();
    }

    // Refocus the card after it was discarded with the keyboard.
    if (
      !isActive &&
      previousIsActiveReference.current &&
      wasCancelledReference.current
    ) {
      kanbanBoardCardReference.current?.focus();
      wasCancelledReference.current = false;
    }

    previousIsActiveReference.current = isActive;
  }, [isActive, isEditingTitle]);

  function handleBlur() {
    flushSync(() => {
      setIsEditingTitle(false);
    });

    kanbanBoardCardReference.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const cardTitle = formData.get('cardTitle') as string;
    onUpdateCardTitle(card.id, cardTitle);
    handleBlur();
  }

  return isEditingTitle ? (
    <form onBlur={handleBlur} onSubmit={handleSubmit}>
      <KanbanBoardCardTextarea
        aria-label="Edit card title"
        autoFocus
        defaultValue={card.title}
        name="cardTitle"
        onFocus={event => event.target.select()}
        onInput={event => {
          const input = event.currentTarget as HTMLTextAreaElement;
          if (/\S/.test(input.value)) {
            // Clear the error message if input is valid
            input.setCustomValidity('');
          } else {
            input.setCustomValidity(
              'Card content cannot be empty or just whitespace.',
            );
          }
        }}
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }

          if (event.key === 'Escape') {
            handleBlur();
          }
        }}
        placeholder="Edit card title ..."
        required
      />
    </form>
  ) : (
    <KanbanBoardCard
      data={card}
      isActive={isActive}
      onBlur={onCardBlur}
      onClick={() => setIsEditingTitle(true)}
      onKeyDown={event => {
        if (event.key === ' ') {
          // Prevent the button "click" action on space because that should
          // be used to pick up and move the card using the keyboard.
          event.preventDefault();
        }

        if (event.key === 'Escape') {
          // Mark that this card was cancelled.
          wasCancelledReference.current = true;
        }

        onCardKeyDown(event, card.id);
      }}
      ref={kanbanBoardCardReference}
    >
      <KanbanBoardCardDescription>{card.title}</KanbanBoardCardDescription>
      <KanbanBoardCardButtonGroup disabled={isActive}>
        <KanbanBoardCardButton
          className="text-destructive"
          onClick={() => onDeleteCard(card.id)}
          tooltip="Delete card"
        >
          <Trash2 />

          <span className="sr-only">Delete card</span>
        </KanbanBoardCardButton>
      </KanbanBoardCardButtonGroup>
    </KanbanBoardCard>
  );
}

function MyNewKanbanBoardCard({
  column,
  onAddCard,
  scrollList,
}: {
  column: Column;
  onAddCard: (columnId: string, cardContent: string) => void;
  scrollList: () => void;
}) {
  const [cardContent, setCardContent] = useState('');
  const newCardButtonReference = useRef<HTMLButtonElement>(null);
  const submitButtonReference = useRef<HTMLButtonElement>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);

  function handleAddCardClick() {
    flushSync(() => {
      setShowNewCardForm(true);
    });

    scrollList();
  }

  function handleCancelClick() {
    flushSync(() => {
      setShowNewCardForm(false);
      setCardContent('');
    });

    newCardButtonReference.current?.focus();
  }

  function handleInputChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setCardContent(event.currentTarget.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    flushSync(() => {
      onAddCard(column.id, cardContent.trim());
      setCardContent('');
    });

    scrollList();
  }

  return showNewCardForm ? (
    <>
      <form
        onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            handleCancelClick();
          }
        }}
        onSubmit={handleSubmit}
      >
        <div className={kanbanBoardColumnListItemClassNames}>
          <KanbanBoardCardTextarea
            aria-label="New card content"
            autoFocus
            name="cardContent"
            onChange={handleInputChange}
            onInput={event => {
              const input = event.currentTarget as HTMLTextAreaElement;
              if (/\S/.test(input.value)) {
                // Clear the error message if input is valid
                input.setCustomValidity('');
              } else {
                input.setCustomValidity(
                  'Card content cannot be empty or just whitespace.',
                );
              }
            }}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submitButtonReference.current?.click();
              }

              if (event.key === 'Escape') {
                handleCancelClick();
              }
            }}
            placeholder="New post ..."
            required
            value={cardContent}
          />
        </div>

        <KanbanBoardColumnFooter>
          <Button ref={submitButtonReference} size="sm" type="submit" className="bg-[#ff555d] hover:bg-[#ff444c] text-white transition-all hover:scale-105 shadow-lg dev-lab-accent-glow">
            Add
          </Button>

          <Button
            onClick={handleCancelClick}
            size="sm"
            variant="outline"
            type="button"
            className="bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/20"
          >
            Cancel
          </Button>
        </KanbanBoardColumnFooter>
      </form>
    </>
  ) : (
    <KanbanBoardColumnFooter>
      <KanbanBoardColumnButton
        onClick={handleAddCardClick}
        ref={newCardButtonReference}
      >
        <Plus />

        <span aria-hidden>New card</span>

        <span className="sr-only">Add new card to {column.title}</span>
      </KanbanBoardColumnButton>
    </KanbanBoardColumnFooter>
  );
}

function MyNewKanbanBoardColumn({
  onAddColumn,
}: {
  onAddColumn: (columnTitle?: string) => void;
}) {
  const [showEditor, setShowEditor] = useState(false);
  const newColumnButtonReference = useRef<HTMLButtonElement>(null);
  const inputReference = useRef<HTMLInputElement>(null);

  function handleAddColumnClick() {
    flushSync(() => {
      setShowEditor(true);
    });

    onAddColumn();
  }

  function handleCancelClick() {
    flushSync(() => {
      setShowEditor(false);
    });

    newColumnButtonReference.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const columnTitle = formData.get('columnTitle') as string;
    onAddColumn(columnTitle);
    if (inputReference.current) {
      inputReference.current.value = '';
    }
  }

  return showEditor ? (
    <form
      className={kanbanBoardColumnClassNames}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          handleCancelClick();
        }
      }}
      onSubmit={handleSubmit}
    >
      <KanbanBoardColumnHeader>
        <Input
          aria-label="Column title"
          autoFocus
          name="columnTitle"
          onKeyDown={event => {
            if (event.key === 'Escape') {
              handleCancelClick();
            }
          }}
          placeholder="New column title ..."
          ref={inputReference}
          required
          className="bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 dev-lab-text-primary placeholder:dev-lab-text-muted-light"
        />
      </KanbanBoardColumnHeader>

      <KanbanBoardColumnFooter>
        <Button size="sm" type="submit" className="bg-[#ff555d] hover:bg-[#ff444c] text-white transition-all hover:scale-105 shadow-lg dev-lab-accent-glow">
          Add
        </Button>

        <Button
          onClick={handleCancelClick}
          size="sm"
          type="button"
          variant="outline"
          className="bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/20"
        >
          Cancel
        </Button>
      </KanbanBoardColumnFooter>
    </form>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleAddColumnClick}
          ref={newColumnButtonReference}
          variant="outline"
          className="dev-lab-glass-light dark:dev-lab-glass-dark bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/20 shadow-lg"
        >
          <Plus />

          <span className="sr-only">Add column</span>
        </Button>
      </TooltipTrigger>

      <TooltipContent className="dev-lab-glass-light dark:dev-lab-glass-dark border-white/20 dark:border-white/10 bg-white/25 dark:bg-[#2f3235]/25 dev-lab-text-primary">
        Add a new column to the board
      </TooltipContent>
    </Tooltip>
  );
}

