"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInvitation } from "@/lib/actions/invitations";

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      try {
        const slug = await acceptInvitation(token);
        router.push(slug ? `/${slug}` : "/workspaces");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleAccept}
        disabled={isPending}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
      >
        {isPending ? "Joining…" : "Accept invitation"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
