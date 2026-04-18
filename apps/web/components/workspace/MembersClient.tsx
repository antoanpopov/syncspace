"use client";

import { useState, useTransition } from "react";
import { createInvitation, removeMember } from "@/lib/actions/invitations";

export interface MemberRow {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  isMe: boolean;
}

interface MembersClientProps {
  workspaceId: string;
  members: MemberRow[];
  canManage: boolean;
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-medium flex-shrink-0">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    owner: "bg-amber-400/15 text-amber-400 border-amber-400/30",
    admin: "bg-accent/15 text-accent border-accent/30",
    member: "bg-bg border-border text-text-muted",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs capitalize ${
        styles[role] ?? styles.member
      }`}
    >
      {role}
    </span>
  );
}

export function MembersClient({
  workspaceId,
  members: initialMembers,
  canManage,
}: MembersClientProps) {
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInviteLink(null);
    const trimmed = email.trim();
    if (!trimmed) return;

    startTransition(async () => {
      try {
        const token = await createInvitation(workspaceId, trimmed);
        const link = `${window.location.origin}/invite/${token}`;
        setInviteLink(link);
        setEmail("");
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to create invitation"
        );
      }
    });
  }

  function handleCopy() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRemove(userId: string) {
    startTransition(async () => {
      await removeMember(workspaceId, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    });
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      {/* Invite form */}
      {canManage && (
        <section className="rounded-xl border border-border bg-bg-surface p-5 space-y-4">
          <h2 className="text-sm font-semibold">Invite someone</h2>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
              required
            />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {isPending ? "…" : "Generate link"}
            </button>
          </form>

          {error && <p className="text-xs text-red-400">{error}</p>}

          {inviteLink && (
            <div className="rounded-lg border border-border bg-bg p-3 flex items-center gap-2">
              <code className="flex-1 truncate text-xs text-text-muted font-mono">
                {inviteLink}
              </code>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 rounded-md px-3 py-1.5 text-xs font-medium border border-border hover:border-border-strong transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}
          <p className="text-xs text-text-faint">
            Share this link with your colleague. It expires in 7&nbsp;days.
          </p>
        </section>
      )}

      {/* Member list */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-text-muted px-1">
          {members.length} {members.length === 1 ? "member" : "members"}
        </h2>
        <div className="rounded-xl border border-border overflow-hidden">
          {members.map((member, i) => (
            <div
              key={member.userId}
              className={`flex items-center gap-3 px-4 py-3 ${
                i !== 0 ? "border-t border-border" : ""
              }`}
            >
              <Avatar name={member.name} image={member.image} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {member.name}
                  {member.isMe && (
                    <span className="ml-1.5 text-xs text-text-faint">
                      (you)
                    </span>
                  )}
                </p>
                <p className="text-xs text-text-faint truncate">
                  {member.email}
                </p>
              </div>
              <RoleBadge role={member.role} />
              {canManage && !member.isMe && member.role !== "owner" && (
                <button
                  onClick={() => handleRemove(member.userId)}
                  disabled={isPending}
                  className="text-xs text-text-faint hover:text-red-400 transition-colors disabled:opacity-50 ml-2"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
