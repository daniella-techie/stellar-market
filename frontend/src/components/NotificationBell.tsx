"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import axios from "axios";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

// Shared channel name for cross-tab read-state synchronization.
const BC_CHANNEL = "stellarmarket:notifications";

export default function NotificationBell() {
    const { socket } = useSocket();
    const { token, user } = useAuth();
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);
    // Tracks which socket instance has listeners attached so reconnects
    // don't result in duplicated event handlers.
    const listenerSocketRef = useRef<typeof socket>(null);

    const fetchUnreadCount = useCallback(async () => {
        if (!token) return;
        try {
            const res = await axios.get<{ count: number }>(`${API}/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUnreadCount(res.data.count);
        } catch (error) {
            console.error("Failed to fetch unread count:", error);
        }
    }, [token]);

    // Initial fetch and polling every 30s as a safety net against missed events.
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    // Reset count when the user navigates directly to the notifications page
    // and broadcast the change to any other open tabs.
    useEffect(() => {
        if (pathname === "/notifications") {
            setUnreadCount(0);
            if (typeof window !== "undefined") {
                try {
                    const bc = new BroadcastChannel(BC_CHANNEL);
                    bc.postMessage({ type: "read" });
                    bc.close();
                } catch {
                    // BroadcastChannel unavailable in some private-browsing contexts
                }
            }
        }
    }, [pathname]);

    const handleOpenNotifications = useCallback(async () => {
        if (!token) return;
        setUnreadCount(0);
        // Inform other open tabs immediately so their badge resets without a round-trip.
        if (typeof window !== "undefined") {
            try {
                const bc = new BroadcastChannel(BC_CHANNEL);
                bc.postMessage({ type: "read" });
                bc.close();
            } catch {
                // BroadcastChannel unavailable
            }
        }
        try {
            await axios.put(
                `${API}/notifications/read-all`,
                {},
                { headers: { Authorization: `Bearer ${token}` } },
            );
        } catch {
            // keep UI responsive; unread count will reconcile on next poll/socket update
        }
    }, [token]);

    // Cross-tab synchronization via BroadcastChannel.
    // When another tab marks notifications read this tab resets its badge too.
    useEffect(() => {
        if (typeof window === "undefined") return;

        let bc: BroadcastChannel;
        try {
            bc = new BroadcastChannel(BC_CHANNEL);
        } catch {
            // BroadcastChannel not supported
            return;
        }

        const handleMessage = (event: MessageEvent<{ type: string }>) => {
            if (event.data?.type === "read") {
                setUnreadCount(0);
            }
        };

        bc.addEventListener("message", handleMessage);
        return () => {
            bc.removeEventListener("message", handleMessage);
            bc.close();
        };
    }, []);

    // Socket event listeners.
    // The ref guard ensures we only attach once per socket instance — this prevents
    // duplicate increments when the SocketProvider re-renders without changing
    // the underlying socket object.
    useEffect(() => {
        if (!socket) return;
        if (listenerSocketRef.current === socket) return;
        listenerSocketRef.current = socket;

        const handleNewNotification = () => {
            setUnreadCount((prev: number) => prev + 1);
        };

        const handleNotificationsRead = () => {
            setUnreadCount(0);
        };

        // Re-sync the authoritative count from the server after every (re)connect
        // so a network interruption never leaves the badge showing stale data.
        const handleConnect = () => {
            fetchUnreadCount();
        };

        socket.on("notification:new", handleNewNotification);
        socket.on("notifications:read", handleNotificationsRead);
        socket.on("connect", handleConnect);

        return () => {
            socket.off("notification:new", handleNewNotification);
            socket.off("notifications:read", handleNotificationsRead);
            socket.off("connect", handleConnect);
            listenerSocketRef.current = null;
        };
    }, [socket, fetchUnreadCount]);

    if (!user) return null;

    return (
        <Link
            href="/notifications"
            onClick={handleOpenNotifications}
            className="relative p-2 rounded-lg text-theme-text hover:text-theme-heading hover:bg-theme-border/50 transition-colors"
            aria-label="Notifications"
            id="notification-bell"
        >
            <Bell size={20} />
            {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-theme-error opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-theme-error text-[10px] text-white font-bold items-center justify-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                </span>
            )}
            <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : "No unread notifications"}
            </span>
        </Link>
    );
}