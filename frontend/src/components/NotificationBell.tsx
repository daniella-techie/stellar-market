"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import axios from "axios";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import { Notification, PaginatedResponse } from "@/types";
import NotificationItem from "./NotificationItem";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export default function NotificationBell() {
    const { socket } = useSocket();
    const { token, user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    const fetchRecentNotifications = useCallback(async () => {
        if (!token) return;
        try {
            const res = await axios.get<PaginatedResponse<Notification>>(
                `${API}/notifications?page=1&limit=5`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setRecentNotifications(res.data.data);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            // loading removed
        }
    }, [token]);

    useEffect(() => {
        fetchUnreadCount();
        fetchRecentNotifications();
    }, [token, fetchUnreadCount, fetchRecentNotifications]);

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification: Notification) => {
            setUnreadCount((prev) => prev + 1);
            setRecentNotifications((prev) => [notification, ...prev.slice(0, 4)]);
        };

        const handleNotificationsRead = () => {
            setUnreadCount(0);
            setRecentNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        };

        socket.on("notification:new", handleNewNotification);
        socket.on("notifications:read", handleNotificationsRead);

        return () => {
            socket.off("notification:new", handleNewNotification);
            socket.off("notifications:read", handleNotificationsRead);
        };
    }, [socket]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []); // Dependencies are correct

    const markAsRead = async (notification: Notification) => {
        if (notification.read || !token) return; // Corrected the syntax error here
        try {
            await axios.put(`${API}/notifications/${notification.id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUnreadCount((prev) => Math.max(0, prev - 1));
            setRecentNotifications((prev) =>
                prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
            );
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) fetchRecentNotifications();
                }}
                className="relative p-2 rounded-lg text-theme-text hover:text-theme-heading hover:bg-theme-border/50 transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-theme-error opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-theme-error text-[10px] text-white font-bold items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-theme-card border border-theme-border rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-theme-border flex justify-between items-center">
                        <h3 className="font-semibold text-theme-heading text-sm">Notifications</h3>
                        <Link
                            href="/notifications"
                            className="text-xs text-stellar-blue hover:underline"
                            onClick={() => setIsOpen(false)}
                        >
                            View All
                        </Link>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {recentNotifications.length > 0 ? (
                            recentNotifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onClick={(n) => {
                                        markAsRead(n);
                                        setIsOpen(false);
                                    }}
                                />
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center">
                                <p className="text-sm text-theme-text">No notifications yet</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
