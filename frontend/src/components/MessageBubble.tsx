import { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
}

export default function MessageBubble({ message, isMe }: MessageBubbleProps) {
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
          isMe
            ? "bg-stellar-blue text-white rounded-br-none"
            : "bg-theme-card text-theme-text border border-theme-border rounded-bl-none"
        }`}
      >
        <p className="text-sm">{message.content}</p>
        <span className="text-[10px] opacity-70 mt-1 block text-right">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
