"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";

const LABEL_COLORS: Record<string, string> = {
  bug:     "#FF5F5F",
  feature: "#5B7FFF",
  design:  "#C084FC",
  dev:     "#22D3EE",
  blocked: "#FFB454",
  review:  "#5EFF8C",
};

export type Card = {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  labels: string[] | null;
  dueDate: Date | null;
  sortOrder: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

interface KanbanCardProps {
  card: Card;
  /** Resolved assignee — pass from parent which has the members list */
  assignee?: { name: string; image: string | null } | null;
  /** True when rendered inside DragOverlay */
  overlay?: boolean;
  onClick?: (card: Card) => void;
}

export function KanbanCard({ card, assignee, overlay = false, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: "card" } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Placeholder ghost shown in the original slot while dragging
  if (isDragging && !overlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-md border border-dashed border-border bg-bg-surface/50 h-[52px]"
      />
    );
  }

  const now = new Date();
  const due = card.dueDate ? new Date(card.dueDate) : null;
  const isOverdue = due && due < now;
  const isSoon = due && !isOverdue && (due.getTime() - now.getTime()) < 2 * 24 * 60 * 60 * 1000;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={!overlay ? () => onClick?.(card) : undefined}
      className={`rounded-md bg-bg p-3 border border-border select-none transition-colors hover:border-border-strong ${
        overlay
          ? "shadow-xl rotate-1 cursor-grabbing"
          : "cursor-grab active:cursor-grabbing"
      }`}
    >
      <p className="text-sm leading-snug">{card.title}</p>
      {card.description && (
        <p className="mt-1 text-xs text-text-muted line-clamp-2">
          {card.description}
        </p>
      )}
      {card.labels && card.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {card.labels.map((l) => {
            const color = LABEL_COLORS[l];
            return color ? (
              <span
                key={l}
                className="rounded-full px-2 py-0.5 text-[10px] font-medium text-bg"
                style={{ backgroundColor: color }}
              >
                {l}
              </span>
            ) : null;
          })}
        </div>
      )}
      {/* Due date + assignee row */}
      {(due || card.assigneeId) && (
        <div className="mt-2 flex items-center justify-between gap-2">
          {due && (
            <span className={`flex items-center gap-1 text-[10px] font-medium ${
              isOverdue ? "text-[#FF5F5F]" : isSoon ? "text-[#FFB454]" : "text-text-faint"
            }`}>
              <CalendarDays className="h-3 w-3" />
              {due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
          {assignee && (
            <span className="ml-auto flex-shrink-0" title={assignee.name}>
              <Avatar name={assignee.name} image={assignee.image} size={18} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
