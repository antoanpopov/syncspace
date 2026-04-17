"use client";

import type { PresenceUser } from "@/lib/hooks/usePresence";

interface PresenceAvatarsProps {
  users: PresenceUser[];
  max?: number;
}

export function PresenceAvatars({ users, max = 4 }: PresenceAvatarsProps) {
  if (users.length === 0) return null;

  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((u) => (
        <div
          key={u.socketId}
          title={u.userName}
          className="w-7 h-7 rounded-full border-2 border-bg-surface flex items-center justify-center text-xs font-semibold text-bg flex-shrink-0 transition-transform hover:scale-110 hover:z-10 cursor-default"
          style={{ backgroundColor: u.color }}
        >
          {u.userName.charAt(0).toUpperCase()}
        </div>
      ))}
      {overflow > 0 && (
        <div
          title={`${overflow} more`}
          className="w-7 h-7 rounded-full border-2 border-bg-surface bg-bg-hover flex items-center justify-center text-[10px] font-semibold text-text-muted flex-shrink-0"
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
