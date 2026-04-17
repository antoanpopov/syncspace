"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

export type PresenceUser = {
  socketId: string;
  userId: string;
  userName: string;
  color: string;
};

interface UsePresenceOptions {
  room: string;
  userId: string;
  userName: string;
  color: string;
}

export function usePresence({ room, userId, userName, color }: UsePresenceOptions) {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(
      process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001",
      { transports: ["websocket"] }
    );

    socket.emit("presence:join", { room, userId, userName, color });

    socket.on("presence:update", (list: PresenceUser[]) => {
      setUsers(list);
    });

    socketRef.current = socket;

    return () => {
      socket.emit("presence:leave", { room });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [room, userId, userName, color]);

  // Filter out self so the component can show "others" or "all" as needed
  const others = users.filter((u) => u.userId !== userId);

  return { users, others };
}
