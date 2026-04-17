import "dotenv/config";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { Server as SocketServer } from "socket.io";
import { Hocuspocus } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { createDb, yjsDocuments, eq } from "@syncspace/db";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const db = createDb(process.env.DATABASE_URL);

const PORT = parseInt(process.env.PORT || "3001", 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

// ── Shared HTTP server ────────────────────────────────────────────────────────

const httpServer = createServer((_, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", service: "syncspace-realtime" }));
});

// ── Socket.io — Kanban + presence ─────────────────────────────────────────────
// destroyUpgrade:false tells engine.io not to destroy WebSocket connections
// that don't match the /socket.io/ path, so Hocuspocus can claim them below.

const io = new SocketServer(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
  destroyUpgrade: false,
});

type PresenceUser = {
  socketId: string;
  userId: string;
  userName: string;
  color: string;
};
const presenceRooms = new Map<string, Map<string, PresenceUser>>();

io.on("connection", (socket) => {
  console.log(`[socket.io] Client connected: ${socket.id}`);

  // ── Page rooms (title sync) ──────────────────────────────────
  socket.on("page:join", (pageId: string) => {
    socket.join(`page:${pageId}`);
  });

  socket.on("page:leave", (pageId: string) => {
    socket.leave(`page:${pageId}`);
  });

  socket.on(
    "page:title-updated",
    ({ pageId, title }: { pageId: string; title: string }) => {
      socket.to(`page:${pageId}`).emit("page:title-updated", { title });
    }
  );

  // ── Board rooms ───────────────────────────────────────────────
  socket.on("board:join", (boardId: string) => {
    socket.join(`board:${boardId}`);
    console.log(`[socket.io] ${socket.id} joined board:${boardId}`);
  });

  socket.on("board:leave", (boardId: string) => {
    socket.leave(`board:${boardId}`);
  });

  socket.on(
    "board:cards-moved",
    (payload: { boardId: string; cards: unknown[] }) => {
      socket.to(`board:${payload.boardId}`).emit("board:cards-moved", {
        cards: payload.cards,
      });
    }
  );

  socket.on(
    "board:card-added",
    (payload: { boardId: string; card: unknown }) => {
      socket.to(`board:${payload.boardId}`).emit("board:card-added", {
        card: payload.card,
      });
    }
  );

  // ── Presence ──────────────────────────────────────────────────
  socket.on(
    "presence:join",
    ({ room, userId, userName, color }: {
      room: string; userId: string; userName: string; color: string;
    }) => {
      socket.join(room);
      if (!presenceRooms.has(room)) presenceRooms.set(room, new Map());
      presenceRooms
        .get(room)!
        .set(socket.id, { socketId: socket.id, userId, userName, color });
      io.to(room).emit(
        "presence:update",
        Array.from(presenceRooms.get(room)!.values())
      );
    }
  );

  socket.on("presence:leave", ({ room }: { room: string }) => {
    socket.leave(room);
    presenceRooms.get(room)?.delete(socket.id);
    io.to(room).emit(
      "presence:update",
      Array.from(presenceRooms.get(room)?.values() ?? [])
    );
  });

  socket.on("disconnect", () => {
    console.log(`[socket.io] Client disconnected: ${socket.id}`);
    presenceRooms.forEach((users, room) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        io.to(room).emit("presence:update", Array.from(users.values()));
      }
    });
  });
});

// ── Hocuspocus — Yjs collaborative editing ────────────────────────────────────
// Runs on the SAME HTTP server via a noServer WebSocketServer.
// All WebSocket upgrade requests that Socket.io ignores are routed here.

const hocuspocus = new Hocuspocus({
  extensions: [
    new Database({
      fetch: async ({ documentName }) => {
        console.log(`[hocuspocus] Fetching doc: ${documentName}`);
        const rows = await db
          .select()
          .from(yjsDocuments)
          .where(eq(yjsDocuments.pageId, documentName));

        if (rows.length > 0 && rows[0].state) {
          return Buffer.from(rows[0].state, "base64");
        }
        return null;
      },
      store: async ({ documentName, state }) => {
        console.log(`[hocuspocus] Storing doc: ${documentName}`);
        const base64State = Buffer.from(state).toString("base64");
        await db
          .insert(yjsDocuments)
          .values({ pageId: documentName, state: base64State })
          .onConflictDoUpdate({
            target: yjsDocuments.pageId,
            set: { state: base64State, updatedAt: new Date() },
          });
      },
    }),
  ],
});

// noServer = we handle the upgrade ourselves and forward to this WSS
const hocuspocusWss = new WebSocketServer({ noServer: true });

hocuspocusWss.on("connection", (ws, request) => {
  hocuspocus.handleConnection(ws, request);
});

// Route non-socket.io WebSocket upgrades to Hocuspocus
httpServer.on("upgrade", (request, socket, head) => {
  const pathname = (request.url ?? "").split("?")[0];
  if (!pathname.startsWith("/socket.io/")) {
    hocuspocusWss.handleUpgrade(request, socket, head, (ws) => {
      hocuspocusWss.emit("connection", ws, request);
    });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`[server] Listening on :${PORT}`);
  console.log(`[server] Socket.io  → ws://localhost:${PORT}/socket.io/`);
  console.log(`[server] Hocuspocus → ws://localhost:${PORT}/`);
});
