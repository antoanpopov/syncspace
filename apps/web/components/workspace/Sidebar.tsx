"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus,
  Settings,
  Users,
  ChevronLeft,
  Menu,
  GripVertical,
  LogOut,
  ChevronsUpDown,
  MoreHorizontal,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Avatar } from "@/components/shared/Avatar";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderPages, deletePage } from "@/lib/actions/pages";
import { reorderBoards, deleteBoard } from "@/lib/actions/boards";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SidebarItem {
  id: string;
  title: string;
  icon: string | null;
}

interface SidebarProps {
  workspace: { id: string; name: string; slug: string };
  pages: SidebarItem[];
  boards: SidebarItem[];
  userRole: string;
  user: { name: string; email: string; image: string | null };
}

// ── Sortable item ──────────────────────────────────────────────────────────────

function SortableSidebarItem({
  item,
  href,
  active,
  defaultIcon,
  onDelete,
}: {
  item: SidebarItem;
  href: string;
  active: boolean;
  defaultIcon: string;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const [confirming, setConfirming] = useState(false);

  const baseStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Inline delete confirmation
  if (confirming) {
    return (
      <li
        ref={setNodeRef}
        style={baseStyle}
        className="rounded-md border border-danger/30 bg-danger/5 px-2 py-1.5"
      >
        <div className="flex items-center gap-1.5">
          <span className="flex-1 truncate text-[11px] text-text-muted">
            Delete "{item.title}"?
          </span>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded px-1.5 py-0.5 text-[10px] text-text-faint hover:text-text hover:bg-bg-hover transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { onDelete(); setConfirming(false); }}
            className="rounded bg-danger px-1.5 py-0.5 text-[10px] font-medium text-white hover:opacity-90 transition-opacity"
          >
            Delete
          </button>
        </div>
      </li>
    );
  }

  return (
    <li
      ref={setNodeRef}
      style={baseStyle}
      className="group"
      {...attributes}
    >
      <div
        className={`flex items-center gap-0.5 rounded-md transition-colors ${
          active
            ? "bg-bg-active text-text"
            : "text-text-muted hover:bg-bg-hover hover:text-text"
        }`}
      >
        {/* Drag handle — visible on hover */}
        <button
          type="button"
          {...listeners}
          className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-text-faint hover:text-text-muted transition-opacity touch-none"
          tabIndex={-1}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3 w-3" />
        </button>

        {/* Nav link */}
        <Link
          href={href}
          className="flex flex-1 items-center gap-2 rounded-md py-1.5 min-w-0 text-sm"
        >
          <span className="text-xs flex-shrink-0">{item.icon || defaultIcon}</span>
          <span className="truncate">{item.title}</span>
        </Link>

        {/* More button — visible on hover */}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setConfirming(true); }}
          title="Delete"
          className="flex-shrink-0 p-1 mr-1 opacity-0 group-hover:opacity-100 rounded text-text-faint hover:text-danger hover:bg-danger/10 transition-all"
          tabIndex={-1}
        >
          <MoreHorizontal className="h-3 w-3" />
        </button>
      </div>
    </li>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────

export function Sidebar({ workspace, pages, boards, userRole, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  const [localPages, setLocalPages] = useState<SidebarItem[]>(pages);
  const [localBoards, setLocalBoards] = useState<SidebarItem[]>(boards);
  // Refs so drag-end callbacks always see current state without stale closure
  const localPagesRef = useRef(localPages);
  const localBoardsRef = useRef(localBoards);
  useEffect(() => { localPagesRef.current = localPages; }, [localPages]);
  useEffect(() => { localBoardsRef.current = localBoards; }, [localBoards]);

  // Sync server props → local state.
  // If the same items exist (just a router.refresh() for title/icon changes),
  // preserve local order and only update item properties.
  // If items are added or removed, reset to server order.
  useEffect(() => {
    setLocalPages((prev) => {
      const prevSet = new Set(prev.map((p) => p.id));
      const nextSet = new Set(pages.map((p) => p.id));
      const sameItems =
        prevSet.size === nextSet.size &&
        [...nextSet].every((id) => prevSet.has(id));
      if (sameItems) {
        const byId = new Map(pages.map((p) => [p.id, p]));
        return prev.map((p) => ({ ...p, ...byId.get(p.id) }));
      }
      return pages;
    });
  }, [pages]);

  useEffect(() => {
    setLocalBoards((prev) => {
      const prevSet = new Set(prev.map((b) => b.id));
      const nextSet = new Set(boards.map((b) => b.id));
      const sameItems =
        prevSet.size === nextSet.size &&
        [...nextSet].every((id) => prevSet.has(id));
      if (sameItems) {
        const byId = new Map(boards.map((b) => [b.id, b]));
        return prev.map((b) => ({ ...b, ...byId.get(b.id) }));
      }
      return boards;
    });
  }, [boards]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Delete handlers ────────────────────────────────────────────────────────
  const handleDeletePage = useCallback(
    (pageId: string, href: string) => {
      setLocalPages((prev) => prev.filter((p) => p.id !== pageId));
      deletePage(pageId, workspace.slug);
      if (pathname === href) router.push(`/${workspace.slug}`);
    },
    [workspace.slug, pathname, router]
  );

  const handleDeleteBoard = useCallback(
    (boardId: string, href: string) => {
      setLocalBoards((prev) => prev.filter((b) => b.id !== boardId));
      deleteBoard(boardId, workspace.slug);
      if (pathname === href) router.push(`/${workspace.slug}`);
    },
    [workspace.slug, pathname, router]
  );

  const handlePageDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return;
      const prev = localPagesRef.current;
      const oldIdx = prev.findIndex((p) => p.id === active.id);
      const newIdx = prev.findIndex((p) => p.id === over.id);
      if (oldIdx === newIdx) return;
      const next = arrayMove(prev, oldIdx, newIdx);
      setLocalPages(next);
      // Fire server action outside the state update to avoid setState-during-render
      reorderPages(workspace.id, next.map((p) => p.id));
    },
    [workspace.id]
  );

  const handleBoardDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return;
      const prev = localBoardsRef.current;
      const oldIdx = prev.findIndex((b) => b.id === active.id);
      const newIdx = prev.findIndex((b) => b.id === over.id);
      if (oldIdx === newIdx) return;
      const next = arrayMove(prev, oldIdx, newIdx);
      setLocalBoards(next);
      reorderBoards(workspace.id, next.map((b) => b.id));
    },
    [workspace.id]
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-bg-surface border border-border p-2 md:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      <aside
        className={`${
          collapsed ? "-translate-x-full" : "translate-x-0"
        } fixed md:relative md:translate-x-0 z-40 flex h-screen w-60 flex-col border-r border-border bg-bg-surface transition-transform`}
      >
        {/* Workspace header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Link
            href={`/${workspace.slug}`}
            className="truncate text-sm font-semibold"
          >
            {workspace.name}
          </Link>
          <button
            onClick={() => setCollapsed(true)}
            className="rounded p-1 text-text-muted hover:bg-bg-hover md:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">

          {/* Pages section */}
          <div className="mb-4">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider text-text-faint">
                Pages
              </span>
              <Link
                href={`/${workspace.slug}/pages/new`}
                className="rounded p-0.5 text-text-faint hover:text-text-muted hover:bg-bg-hover"
              >
                <Plus className="h-3.5 w-3.5" />
              </Link>
            </div>
            {localPages.length === 0 ? (
              <p className="px-2 text-xs text-text-faint">No pages yet</p>
            ) : (
              <DndContext
                id="sidebar-pages"
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handlePageDragEnd}
              >
                <SortableContext
                  items={localPages.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="space-y-0.5">
                    {localPages.map((page) => {
                      const href = `/${workspace.slug}/pages/${page.id}`;
                      return (
                        <SortableSidebarItem
                          key={page.id}
                          item={page}
                          href={href}
                          active={pathname === href}
                          defaultIcon="📄"
                          onDelete={() => handleDeletePage(page.id, href)}
                        />
                      );
                    })}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Boards section */}
          <div className="mb-4">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider text-text-faint">
                Boards
              </span>
              <Link
                href={`/${workspace.slug}/boards/new`}
                className="rounded p-0.5 text-text-faint hover:text-text-muted hover:bg-bg-hover"
              >
                <Plus className="h-3.5 w-3.5" />
              </Link>
            </div>
            {localBoards.length === 0 ? (
              <p className="px-2 text-xs text-text-faint">No boards yet</p>
            ) : (
              <DndContext
                id="sidebar-boards"
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleBoardDragEnd}
              >
                <SortableContext
                  items={localBoards.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="space-y-0.5">
                    {localBoards.map((board) => {
                      const href = `/${workspace.slug}/boards/${board.id}`;
                      return (
                        <SortableSidebarItem
                          key={board.id}
                          item={board}
                          href={href}
                          active={pathname === href}
                          defaultIcon="📋"
                          onDelete={() => handleDeleteBoard(board.id, href)}
                        />
                      );
                    })}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-2 py-2 space-y-0.5">
          <Link
            href={`/${workspace.slug}/settings/members`}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-muted hover:bg-bg-hover hover:text-text transition-colors"
          >
            <Users className="h-4 w-4" />
            Members
          </Link>
          {(userRole === "owner" || userRole === "admin") && (
            <Link
              href={`/${workspace.slug}/settings`}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-muted hover:bg-bg-hover hover:text-text transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          )}
          <Link
            href="/workspaces"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-muted hover:bg-bg-hover hover:text-text transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            All workspaces
          </Link>

          {/* User menu */}
          <div ref={userMenuRef} className="relative mt-1 pt-1 border-t border-border">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-bg-hover transition-colors group"
            >
              <Avatar name={user.name} image={user.image} size={24} />
              <div className="flex-1 text-left min-w-0">
                <p className="truncate text-xs font-medium text-text leading-none">{user.name}</p>
                <p className="truncate text-[10px] text-text-faint mt-0.5">{user.email}</p>
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 text-text-faint group-hover:text-text-muted flex-shrink-0 transition-colors" />
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-border bg-bg-surface shadow-xl overflow-hidden">
                <div className="px-3 py-2.5 border-b border-border">
                  <p className="text-xs font-medium text-text truncate">{user.name}</p>
                  <p className="text-[10px] text-text-faint truncate mt-0.5">{user.email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/sign-in" })}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text-muted hover:text-danger hover:bg-danger/5 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  );
}
