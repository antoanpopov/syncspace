"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutGrid,
  Plus,
  Settings,
  Users,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  workspace: { id: string; name: string; slug: string };
  pages: { id: string; title: string; icon: string | null }[];
  boards: { id: string; title: string; icon: string | null }[];
  userRole: string;
}

export function Sidebar({ workspace, pages, boards, userRole }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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
            {pages.length === 0 ? (
              <p className="px-2 text-xs text-text-faint">No pages yet</p>
            ) : (
              <ul className="space-y-0.5">
                {pages.map((page) => {
                  const href = `/${workspace.slug}/pages/${page.id}`;
                  const active = pathname === href;
                  return (
                    <li key={page.id}>
                      <Link
                        href={href}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                          active
                            ? "bg-bg-active text-text"
                            : "text-text-muted hover:bg-bg-hover hover:text-text"
                        }`}
                      >
                        <span className="text-xs">{page.icon || "📄"}</span>
                        <span className="truncate">{page.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
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
            {boards.length === 0 ? (
              <p className="px-2 text-xs text-text-faint">No boards yet</p>
            ) : (
              <ul className="space-y-0.5">
                {boards.map((board) => {
                  const href = `/${workspace.slug}/boards/${board.id}`;
                  const active = pathname === href;
                  return (
                    <li key={board.id}>
                      <Link
                        href={href}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                          active
                            ? "bg-bg-active text-text"
                            : "text-text-muted hover:bg-bg-hover hover:text-text"
                        }`}
                      >
                        <span className="text-xs">{board.icon || "📋"}</span>
                        <span className="truncate">{board.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-2 py-3 space-y-0.5">
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
