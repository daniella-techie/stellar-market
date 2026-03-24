import "@testing-library/jest-dom";
import React from "react";
import { render, act, screen } from "@testing-library/react";
import { SocketProvider, useSocket } from "@/context/SocketContext";

// Mock AuthContext — SocketProvider calls useAuth()
jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ token: "mock-token", user: null, login: jest.fn(), logout: jest.fn(), isLoading: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock socket.io-client
jest.mock("socket.io-client", () => {
  const handlers: Record<string, ((...args: unknown[]) => void)[]> = {};
  const socket = {
    on: jest.fn((event: string, fn: (...args: unknown[]) => void) => {
      handlers[event] = handlers[event] ?? [];
      handlers[event].push(fn);
    }),
    off: jest.fn(),
    emit: jest.fn(),
    connected: false,
    disconnect: jest.fn(),
    _trigger: (event: string, ...args: unknown[]) => {
      handlers[event]?.forEach((fn) => fn(...args));
    },
  };
  return { io: jest.fn(() => socket), __socket: socket };
});

import * as socketModule from "socket.io-client";
const mockSocket = (socketModule as unknown as { __socket: { _trigger: (e: string, ...a: unknown[]) => void; connected: boolean } }).__socket;

function TestConsumer() {
  const { isConnected } = useSocket();
  return <div data-testid="status">{isConnected ? "connected" : "disconnected"}</div>;
}

// Provide a JWT so SocketProvider actually calls io()
beforeEach(() => {
  localStorage.setItem("stellarmarket_jwt", "mock.token.here");
});
afterEach(() => {
  localStorage.clear();
});

describe("SocketProvider", () => {
  it("starts disconnected", () => {
    render(
      <SocketProvider>
        <TestConsumer />
      </SocketProvider>
    );
    expect(screen.getByTestId("status")).toHaveTextContent("disconnected");
  });

  it("updates to connected when connect event fires", async () => {
    render(
      <SocketProvider>
        <TestConsumer />
      </SocketProvider>
    );

    await act(async () => {
      mockSocket._trigger("connect");
    });

    expect(screen.getByTestId("status")).toHaveTextContent("connected");
  });

  it("updates to disconnected when disconnect event fires after connecting", async () => {
    render(
      <SocketProvider>
        <TestConsumer />
      </SocketProvider>
    );

    await act(async () => {
      mockSocket._trigger("connect");
    });
    await act(async () => {
      mockSocket._trigger("disconnect");
    });

    expect(screen.getByTestId("status")).toHaveTextContent("disconnected");
  });
});
