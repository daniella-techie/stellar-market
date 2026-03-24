"use client";

import { WalletProvider } from "@/context/WalletContext";
import { SocketProvider } from "@/context/SocketContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/context/ThemeContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <WalletProvider>
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>{children}</ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}
