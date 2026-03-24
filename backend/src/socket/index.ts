import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { registerMessageHandlers } from "./messageHandlers";

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
  };
}

let io: SocketServer;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.frontendUrl,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // JWT auth middleware — runs before every connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error("Authentication error: No token provided."));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
      (socket as AuthenticatedSocket).data.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Authentication error: Invalid or expired token."));
    }
  });

  io.on("connection", (socket) => {
    const authedSocket = socket as AuthenticatedSocket;
    const userId = authedSocket.data.userId;

    // Join personal room so we can target this user from anywhere
    socket.join(`user:${userId}`);
    console.log(`Socket connected: user=${userId} socket=${socket.id}`);

    registerMessageHandlers(io, authedSocket);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: user=${userId} socket=${socket.id}`);
    });
  });

  return io;
}

export function getIo(): SocketServer {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}
