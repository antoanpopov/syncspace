"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { KanbanColumn } from "./KanbanColumn";
import type { Column } from "./KanbanColumn";
import { KanbanCard, type Card } from "./KanbanCard";
import { CardDetail, type Member } from "./CardDetail";
import { PresenceAvatars } from "@/components/shared/PresenceAvatars";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { usePresence } from "@/lib/hooks/usePresence";
import {
  addCard,
  addColumn,
  persistCardMoves,
  persistColumnOrder,
  updateBoardIcon,
  updateBoardTitle,
  type CardUpdate,
} from "@/lib/actions/boards";
import { useBoardSocket, type CardAddPayload } from "@/lib/hooks/useBoardSocket";

interface KanbanBoardProps {
  boardId: string;
  boardTitle: string;
  boardIcon: string | null;
  workspaceSlug: string;
  initialColumns: Column[];
  members: Member[];
  currentUserId: string;
  currentUserName: string;
  currentUserColor: string;
}

export function KanbanBoard({
  boardId,
  boardTitle,
  boardIcon,
  workspaceSlug,
  initialColumns,
  members,
  currentUserId,
  currentUserName,
  currentUserColor,
}: KanbanBoardProps) {
  const router = useRouter();
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [icon, setIcon] = useState<string | null>(boardIcon);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [title, setTitle] = useState(boardTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(boardTitle);

  function handleTitleSave() {
    const trimmed = editTitle.trim() || boardTitle;
    setTitle(trimmed);
    setEditTitle(trimmed);
    setIsEditingTitle(false);
    updateBoardTitle(boardId, trimmed, workspaceSlug).then(() => router.refresh());
  }

  const handleIconSelect = useCallback(
    (emoji: string) => {
      setIcon(emoji);
      updateBoardIcon(boardId, emoji, workspaceSlug).then(() => router.refresh());
    },
    [boardId, workspaceSlug, router]
  );

  // ── Presence ─────────────────────────────────────────────────
  const { others: presentOthers } = usePresence({
    room: `board:${boardId}`,
    userId: currentUserId,
    userName: currentUserName,
    color: currentUserColor,
  });

  // ── Sensors ──────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Helpers ───────────────────────────────────────────────────
  function findCard(id: string): Card | null {
    for (const col of columns) {
      const c = col.cards.find((c) => c.id === id);
      if (c) return c;
    }
    return null;
  }

  function findColByCardId(cardId: string): Column | null {
    return columns.find((col) => col.cards.some((c) => c.id === cardId)) ?? null;
  }

  function findCol(id: string): Column | null {
    return columns.find((col) => col.id === id) ?? null;
  }

  function buildCardUpdates(cols: Column[]): CardUpdate[] {
    return cols.flatMap((col) =>
      col.cards.map((card, i) => ({
        id: card.id,
        columnId: col.id,
        sortOrder: i,
      }))
    );
  }

  // ── Socket ────────────────────────────────────────────────────
  const { emitCardsMoved, emitCardAdded } = useBoardSocket({
    boardId,
    onCardsMoved: ({ cards: updates }) => {
      setColumns((prev) => {
        const map = new Map(updates.map((u) => [u.id, u]));
        const allCards = prev.flatMap((col) => col.cards);
        return prev.map((col) => ({
          ...col,
          cards: allCards
            .filter(
              (card) =>
                (map.get(card.id)?.columnId ?? card.columnId) === col.id
            )
            .map((card) => {
              const u = map.get(card.id);
              return u
                ? { ...card, columnId: u.columnId, sortOrder: u.sortOrder }
                : card;
            })
            .sort((a, b) => a.sortOrder - b.sortOrder),
        }));
      });
    },
    onCardAdded: ({ card }: CardAddPayload) => {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === card.columnId
            ? { ...col, cards: [...col.cards, { ...card, createdAt: new Date(card.createdAt), updatedAt: new Date(card.updatedAt) }] }
            : col
        )
      );
    },
  });

  // ── DnD handlers ─────────────────────────────────────────────
  function onDragStart({ active }: DragStartEvent) {
    const type = active.data.current?.type;
    if (type === "column") {
      setActiveColumn(findCol(String(active.id)));
    } else {
      setActiveCard(findCard(String(active.id)));
    }
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    // Column drags are handled entirely in onDragEnd
    if (active.data.current?.type === "column") return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const sourceCol = findColByCardId(activeId);
    // Resolve the target column — over could be a card, a column ID, or a drop-zone ID
    const targetCol =
      findCol(overId) ??
      findCol(overId.replace("drop-", "")) ??
      findColByCardId(overId);

    if (!sourceCol || !targetCol || sourceCol.id === targetCol.id) return;

    // Cross-column move — live visual feedback
    setColumns((prev) => {
      const card = prev.flatMap((c) => c.cards).find((c) => c.id === activeId);
      if (!card) return prev;

      return prev.map((col) => {
        if (col.id === sourceCol.id) {
          return { ...col, cards: col.cards.filter((c) => c.id !== activeId) };
        }
        if (col.id === targetCol.id) {
          const overIdx = col.cards.findIndex((c) => c.id === overId);
          const newCards = [...col.cards];
          const moved = { ...card, columnId: targetCol.id };
          if (overIdx >= 0) newCards.splice(overIdx, 0, moved);
          else newCards.push(moved);
          return { ...col, cards: newCards };
        }
        return col;
      });
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveCard(null);
    setActiveColumn(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // ── Column reorder ──────────────────────────────────────────
    if (active.data.current?.type === "column") {
      const oldIdx = columns.findIndex((c) => c.id === activeId);
      const newIdx = columns.findIndex((c) => c.id === overId);
      if (oldIdx !== newIdx && newIdx !== -1) {
        const reordered = arrayMove(columns, oldIdx, newIdx);
        setColumns(reordered);
        persistColumnOrder(
          reordered.map((col, i) => ({ id: col.id, sortOrder: i }))
        );
      }
      return;
    }

    // ── Card reorder within same column ─────────────────────────
    const activeCol = findColByCardId(activeId);
    if (!activeCol) return;

    const isReorderInSameCol =
      activeCol.cards.some((c) => c.id === overId) && activeId !== overId;

    let finalColumns = columns;

    if (isReorderInSameCol) {
      const oldIdx = activeCol.cards.findIndex((c) => c.id === activeId);
      const newIdx = activeCol.cards.findIndex((c) => c.id === overId);
      finalColumns = columns.map((col) =>
        col.id === activeCol.id
          ? { ...col, cards: arrayMove(col.cards, oldIdx, newIdx) }
          : col
      );
      setColumns(finalColumns);
    }

    // Persist + broadcast
    const updates = buildCardUpdates(finalColumns);
    persistCardMoves(updates);
    emitCardsMoved({ cards: updates });
  }

  // ── Add card ──────────────────────────────────────────────────
  async function handleAddCard(columnId: string, title: string) {
    const tempId = `temp-${Date.now()}`;
    const optimistic: Card = {
      id: tempId,
      boardId,
      columnId,
      title,
      description: null,
      assigneeId: null,
      labels: null,
      dueDate: null,
      sortOrder: columns.find((c) => c.id === columnId)?.cards.length ?? 0,
      createdById: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? { ...col, cards: [...col.cards, optimistic] }
          : col
      )
    );

    const card = await addCard(boardId, columnId, title);

    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? {
              ...col,
              cards: col.cards.map((c) =>
                c.id === tempId ? { ...optimistic, ...card } : c
              ),
            }
          : col
      )
    );

    emitCardAdded({
      card: {
        ...card,
        description: null,
        assigneeId: null,
        labels: null,
        dueDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  // ── Card detail callbacks ─────────────────────────────────────
  function handleCardUpdated(cardId: string, updates: Partial<Card>) {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === cardId ? { ...c, ...updates } : c
        ),
      }))
    );
    setSelectedCard((prev) =>
      prev?.id === cardId ? { ...prev, ...updates } : prev
    );
  }

  function handleCardDeleted(cardId: string) {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== cardId),
      }))
    );
  }

  // ── Add column ────────────────────────────────────────────────
  async function handleAddColumn() {
    const trimmed = newColumnTitle.trim();
    if (!trimmed) return;
    const col = await addColumn(boardId, trimmed);
    setColumns((prev) => [...prev, { ...col, cards: [] }]);
    setNewColumnTitle("");
    setAddingColumn(false);
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3.5 border-b border-border flex-shrink-0 flex items-center justify-between gap-4">
        {/* Left: icon + title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowIconPicker((v) => !v)}
              title="Change icon"
              className="text-xl leading-none rounded-md p-1 hover:bg-bg-hover transition-colors select-none"
            >
              {icon ?? "📋"}
            </button>
            {showIconPicker && (
              <EmojiPicker
                onSelect={handleIconSelect}
                onClose={() => setShowIconPicker(false)}
              />
            )}
          </div>
          {isEditingTitle ? (
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave();
                if (e.key === "Escape") {
                  setEditTitle(title);
                  setIsEditingTitle(false);
                }
              }}
              className="text-xl font-bold bg-transparent border-b-2 border-accent outline-none min-w-0 w-48"
            />
          ) : (
            <h1
              className="text-xl font-bold cursor-text truncate hover:opacity-75 transition-opacity"
              onClick={() => { setEditTitle(title); setIsEditingTitle(true); }}
              title="Click to rename"
            >
              {title}
            </h1>
          )}
        </div>

        {/* Right: add column + presence */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setAddingColumn(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted hover:text-text hover:border-border-strong transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add column
          </button>
          <PresenceAvatars users={presentOthers} />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          id={`board-${boardId}`}
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          {/* SortableContext for columns (horizontal) */}
          {columns.length === 0 && !addingColumn && (
            <div className="flex flex-1 flex-col items-center justify-center text-center px-8 py-20">
              <div className="text-5xl mb-5">📋</div>
              <h2 className="text-lg font-semibold mb-2">No columns yet</h2>
              <p className="text-sm text-text-muted mb-6 max-w-xs">
                Add columns to organise your work — like "To Do", "In Progress", and "Done".
              </p>
              <button
                onClick={() => setAddingColumn(true)}
                className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add first column
              </button>
            </div>
          )}

          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-4 p-6 h-full items-start w-max">
              {columns.map((col) => (
                <KanbanColumn
                  key={col.id}
                  id={col.id}
                  title={col.title}
                  color={col.color}
                  cards={col.cards}
                  members={members}
                  onAddCard={handleAddCard}
                  onCardClick={setSelectedCard}
                />
              ))}

              {/* Add column inline form — trigger button is in the header */}
              {addingColumn && (
                <div className="w-72 flex-shrink-0 rounded-xl border border-accent/40 bg-bg-surface p-3 space-y-2">
                  <input
                    autoFocus
                    type="text"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddColumn();
                      if (e.key === "Escape") {
                        setAddingColumn(false);
                        setNewColumnTitle("");
                      }
                    }}
                    placeholder="Column title…"
                    className="w-full rounded-md bg-bg border border-border px-2 py-1.5 text-sm outline-none focus:border-accent"
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleAddColumn}
                      className="flex-1 rounded-md bg-accent px-2 py-1 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
                    >
                      Add column
                    </button>
                    <button
                      onClick={() => {
                        setAddingColumn(false);
                        setNewColumnTitle("");
                      }}
                      className="rounded-md px-2 py-1 text-xs text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
            {activeCard ? (
              <KanbanCard
                card={activeCard}
                overlay
                assignee={members.find((m) => m.userId === activeCard.assigneeId) ?? null}
              />
            ) : activeColumn ? (
              <KanbanColumn
                id={activeColumn.id}
                title={activeColumn.title}
                color={activeColumn.color}
                cards={activeColumn.cards}
                onAddCard={() => {}}
                onCardClick={() => {}}
                overlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Card detail slide-over */}
      {selectedCard && (
        <CardDetail
          card={selectedCard}
          members={members}
          onClose={() => setSelectedCard(null)}
          onUpdated={handleCardUpdated}
          onDeleted={handleCardDeleted}
        />
      )}
    </div>
  );
}
