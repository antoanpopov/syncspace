"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import type { CardUpdate } from "@/lib/actions/boards";

export type CardMovePayload = { cards: CardUpdate[] };

export type CardAddPayload = {
  card: {
    id: string;
    boardId: string;
    columnId: string;
    title: string;
    sortOrder: number;
    createdById: string;
  };
};

interface UseBoardSocketOptions {
  boardId: string;
  onCardsMoved?: (payload: CardMovePayload) => void;
  onCardAdded?: (payload: CardAddPayload) => void;
}

export function useBoardSocket({
  boardId,
  onCardsMoved,
  onCardAdded,
}: UseBoardSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  // Keep callback refs stable so the socket effect doesn't re-run on every render
  const onCardsMovedRef = useRef(onCardsMoved);
  const onCardAddedRef = useRef(onCardAdded);
  useEffect(() => { onCardsMovedRef.current = onCardsMoved; });
  useEffect(() => { onCardAddedRef.current = onCardAdded; });

  useEffect(() => {
    const socket = io(
      process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001",
      { transports: ["websocket"] }
    );

    socket.emit("board:join", boardId);

    socket.on("board:cards-moved", (payload: CardMovePayload) => {
      onCardsMovedRef.current?.(payload);
    });
    socket.on("board:card-added", (payload: CardAddPayload) => {
      onCardAddedRef.current?.(payload);
    });

    socketRef.current = socket;

    return () => {
      socket.emit("board:leave", boardId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [boardId]);

  function emitCardsMoved(payload: CardMovePayload) {
    socketRef.current?.emit("board:cards-moved", { boardId, ...payload });
  }

  function emitCardAdded(payload: CardAddPayload) {
    socketRef.current?.emit("board:card-added", { boardId, ...payload });
  }

  return { emitCardsMoved, emitCardAdded };
}
