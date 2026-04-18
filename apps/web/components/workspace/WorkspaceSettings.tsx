"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateWorkspaceName } from "@/lib/actions/workspaces";
import { Check, Loader2 } from "lucide-react";

interface WorkspaceSettingsProps {
  workspaceId: string;
  workspaceSlug: string;
  initialName: string;
  userRole: string;
}

export function WorkspaceSettings({
  workspaceId,
  workspaceSlug,
  initialName,
  userRole,
}: WorkspaceSettingsProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canEdit = userRole === "owner" || userRole === "admin";

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit || name.trim() === initialName) return;
    setError(null);
    startTransition(async () => {
      try {
        await updateWorkspaceName(workspaceId, name, workspaceSlug);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10 space-y-10">
      {/* General */}
      <section className="rounded-xl border border-border bg-bg-surface p-6 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-faint">
          General
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Workspace name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
              maxLength={80}
              className="w-full rounded-lg bg-bg border border-border px-3 py-2 text-sm text-text outline-none focus:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Workspace slug
            </label>
            <input
              type="text"
              value={workspaceSlug}
              disabled
              className="w-full rounded-lg bg-bg border border-border px-3 py-2 text-sm text-text-faint outline-none opacity-50 cursor-not-allowed font-mono"
            />
            <p className="mt-1 text-xs text-text-faint">
              The URL slug cannot be changed after creation.
            </p>
          </div>

          {canEdit && (
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={isPending || name.trim() === initialName || !name.trim()}
                className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saved ? (
                  <Check className="h-3.5 w-3.5" />
                ) : null}
                {saved ? "Saved!" : "Save changes"}
              </button>
              {error && (
                <p className="text-xs text-danger">{error}</p>
              )}
            </div>
          )}
        </form>
      </section>

      {/* Role info */}
      {!canEdit && (
        <p className="text-xs text-text-faint">
          Only workspace owners and admins can change settings.
        </p>
      )}
    </div>
  );
}
