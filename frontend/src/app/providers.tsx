"use client";

import { WalletProvider } from "@/context/WalletContext";
import { SocketProvider } from "@/context/SocketContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { ThemeProvider } from "@/context/ThemeContext";
import { useEffect } from "react";
import { registerServiceWorker } from "@/utils/registerServiceWorker";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    // Track user interaction for push notification prompt
    const trackInteraction = () => {
      localStorage.setItem('stellarmarket-has-interacted', 'true');
      // Remove listeners after first interaction
      window.removeEventListener('click', trackInteraction);
      window.removeEventListener('keydown', trackInteraction);
      window.removeEventListener('touchstart', trackInteraction);
    };

    window.addEventListener('click', trackInteraction);
    window.addEventListener('keydown', trackInteraction);
    window.addEventListener('touchstart', trackInteraction);

    return () => {
      window.removeEventListener('click', trackInteraction);
      window.removeEventListener('keydown', trackInteraction);
      window.removeEventListener('touchstart', trackInteraction);
    };
  }, []);

  return (
    <NextThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeProvider>
        <ToastProvider>
          <WalletProvider>
            <AuthProvider>
              <SocketProvider>{children}</SocketProvider>
            </AuthProvider>
          </WalletProvider>
        </ToastProvider>
      </ThemeProvider>
    </NextThemeProvider>
  );
}
