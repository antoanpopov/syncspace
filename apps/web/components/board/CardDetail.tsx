"use client";

import { useState, useEffect, useRef } from "react";
import { updateCard, deleteCard } from "@/lib/actions/boards";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { CalendarDays, X, Trash2 } from "lucide-react";
import type { Card } from "./KanbanCard";
import { Avatar } from "@/components/shared/Avatar";

export type Member = {
  userId: string;
  name: string;
  image: string | null;
};

const LABEL_OPTIONS = [
  { id: "bug",     label: "Bug",     color: "#FF5F5F" },
  { id: "feature", label: "Feature", color: "#5B7FFF" },
  { id: "design",  label: "Design",  color: "#C084FC" },
  { id: "dev",     label: "Dev",     color: "#22D3EE" },
  { id: "blocked", label: "Blocked", color: "#FFB454" },
  { id: "review",  label: "Review",  color: "#5EFF8C" },
];

interface CardDetailProps {
  card: Card;
  members: Member[];
  onClose: () => void;
  onUpdated: (cardId: string, updates: Partial<Card>) => void;
  onDeleted: (cardId: string) => void;
}

export function CardDetail({ card, members, onClose, onUpdated, onDeleted }: CardDetailProps) {
  const [title, setTitle]           = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [assigneeId, setAssigneeId]  = useState<string | null>(card.assigneeId);
  const [labels, setLabels]          = useState<string[]>(card.labels ?? []);
  const [dueDate, setDueDate]        = useState<string>(
    card.dueDate ? new Date(card.dueDate).toISOString().slice(0, 10) : ""
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [visible, setVisible]        = useState(false);

  const debouncedTitle = useDebounce(title, 500);
  const debouncedDesc  = useDebounce(description, 500);
  const initialTitle   = useRef(card.title);
  const initialDesc    = useRef(card.description ?? "");

  // Slide-in on mount
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  function close() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  // Persist title
  useEffect(() => {
    if (debouncedTitle === initialTitle.current) return;
    updateCard(card.id, { title: debouncedTitle });
    onUpdated(card.id, { title: debouncedTitle });
  }, [debouncedTitle, card.id, onUpdated]);

  // Persist description
  useEffect(() => {
    if (debouncedDesc === initialDesc.current) return;
    updateCard(card.id, { description: debouncedDesc || null });
    onUpdated(card.id, { description: debouncedDesc || null });
  }, [debouncedDesc, card.id, onUpdated]);

  function handleAssignee(userId: string | null) {
    setAssigneeId(userId);
    updateCard(card.id, { assigneeId: userId });
    onUpdated(card.id, { assigneeId: userId });
  }

  function toggleLabel(id: string) {
    const next = labels.includes(id) ? labels.filter((l) => l !== id) : [...labels, id];
    setLabels(next);
    updateCard(card.id, { labels: next.length ? next : null });
    onUpdated(card.id, { labels: next.length ? next : null });
  }

  function handleDueDate(val: string) {
    setDueDate(val);
    const date = val ? new Date(val) : null;
    updateCard(card.id, { dueDate: date });
    onUpdated(card.id, { dueDate: date });
  }

  async function handleDelete() {
    await deleteCard(card.id);
    onDeleted(card.id);
    close();
  }

  const assignee = members.find((m) => m.userId === assigneeId);

  const now = new Date();
  const due = dueDate ? new Date(dueDate) : null;
  const isOverdue = due && due < now;
  const isSoon = due && !isOverdue && (due.getTime() - now.getTime()) < 2 * 24 * 60 * 60 * 1000;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={close}
      />

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 z-50 w-[440px] flex flex-col bg-bg-surface border-l border-border shadow-2xl overflow-y-auto transition-transform duration-200 ease-out ${visible ? "translate-x-0" : "translate-x-full"}`}>

        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-border">
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={2}
            className="flex-1 resize-none bg-transparent text-lg font-semibold text-text outline-none placeholder:text-text-faint leading-snug"
            placeholder="Card title"
          />
          <button
            onClick={close}
            className="mt-0.5 rounded-md p-1.5 text-text-faint hover:text-text hover:bg-bg-hover transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Labels preview strip */}
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-5 pt-4">
            {labels.map((l) => {
              const opt = LABEL_OPTIONS.find((o) => o.id === l);
              return opt ? (
                <span
                  key={l}
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium text-bg"
                  style={{ backgroundColor: opt.color }}
                >
                  {opt.label}
                </span>
              ) : null;
            })}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 p-5 space-y-6">

          {/* Description */}
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-faint">Description</h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Add a description…"
              className="w-full resize-none rounded-lg bg-bg border border-border px-3 py-2.5 text-sm text-text placeholder:text-text-faint outline-none focus:border-accent transition-colors"
            />
          </section>

          {/* Due date */}
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-faint">Due date</h3>
            <div className="relative">
              <CalendarDays className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${
                isOverdue ? "text-[#FF5F5F]" : isSoon ? "text-[#FFB454]" : "text-text-faint"
              }`} />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => handleDueDate(e.target.value)}
                className={`w-full rounded-lg bg-bg border px-3 py-2 pl-9 text-sm outline-none transition-colors [color-scheme:dark] ${
                  isOverdue
                    ? "border-[#FF5F5F]/50 text-[#FF5F5F] focus:border-[#FF5F5F]"
                    : isSoon
                    ? "border-[#FFB454]/50 text-[#FFB454] focus:border-[#FFB454]"
                    : "border-border text-text focus:border-accent"
                }`}
              />
              {dueDate && (
                <button
                  onClick={() => handleDueDate("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {isOverdue && (
              <p className="mt-1 text-xs text-[#FF5F5F]">Overdue</p>
            )}
            {isSoon && !isOverdue && (
              <p className="mt-1 text-xs text-[#FFB454]">Due soon</p>
            )}
          </section>

          {/* Assignee */}
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-faint">Assignee</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleAssignee(null)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border transition-colors ${
                  !assigneeId
                    ? "bg-accent/20 border-accent/50 text-accent"
                    : "border-border text-text-muted hover:border-border-strong hover:text-text"
                }`}
              >
                None
              </button>
              {members.map((m) => (
                <button
                  key={m.userId}
                  onClick={() => handleAssignee(m.userId)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border transition-colors ${
                    assigneeId === m.userId
                      ? "bg-accent/20 border-accent/50 text-accent"
                      : "border-border text-text-muted hover:border-border-strong hover:text-text"
                  }`}
                >
                  <Avatar name={m.name} image={m.image} size={16} />
                  {m.name}
                </button>
              ))}
            </div>
            {assignee && (
              <div className="mt-2 flex items-center gap-2">
                <Avatar name={assignee.name} image={assignee.image} size={20} />
                <span className="text-xs text-text-muted">{assignee.name}</span>
              </div>
            )}
          </section>

          {/* Labels */}
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-faint">Labels</h3>
            <div className="flex flex-wrap gap-2">
              {LABEL_OPTIONS.map((opt) => {
                const active = labels.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleLabel(opt.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border transition-all ${
                      active
                        ? "border-transparent text-bg font-medium"
                        : "border-border text-text-muted hover:border-border-strong"
                    }`}
                    style={active ? { backgroundColor: opt.color } : {}}
                  >
                    {!active && (
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                    )}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Meta */}
          <section className="pt-2 border-t border-border">
            <dl className="space-y-1 text-xs text-text-faint">
              <div className="flex items-center justify-between">
                <dt>Created</dt>
                <dd>{new Date(card.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted flex-1">Delete this card?</span>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-md px-3 py-1.5 text-xs text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-md bg-danger px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
              >
                Delete
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 w-full rounded-lg border border-border px-3 py-2 text-xs text-text-faint hover:text-danger hover:border-danger/40 hover:bg-danger/5 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete card
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// Re-export so existing imports of Avatar from CardDetail still work
export { Avatar } from "@/components/shared/Avatar";
