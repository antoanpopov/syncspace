"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

interface UsePageSocketOptions {
  pageId: string;
  onTitleUpdate: (title: string) => void;
}

export function usePageSocket({ pageId, onTitleUpdate }: UsePageSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const onTitleUpdateRef = useRef(onTitleUpdate);
  useEffect(() => { onTitleUpdateRef.current = onTitleUpdate; });

  useEffect(() => {
    const socket = io(
      process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001",
      { transports: ["websocket"] }
    );

    socket.emit("page:join", pageId);

    socket.on("page:title-updated", ({ title }: { title: string }) => {
      onTitleUpdateRef.current(title);
    });

    socketRef.current = socket;

    return () => {
      socket.emit("page:leave", pageId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [pageId]);

  function emitTitleUpdate(title: string) {
    socketRef.current?.emit("page:title-updated", { pageId, title });
  }

  return { emitTitleUpdate };
}
