"use client";

interface TypingIndicatorProps {
  isTyping: boolean;
  username?: string;
}

export default function TypingIndicator({ isTyping, username }: TypingIndicatorProps) {
  if (!isTyping) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-theme-text text-sm">
      <div className="flex gap-1">
        <span
          className="w-1.5 h-1.5 rounded-full bg-theme-text animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-theme-text animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-theme-text animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      {username && <span>{username} is typing…</span>}
    </div>
  );
}
