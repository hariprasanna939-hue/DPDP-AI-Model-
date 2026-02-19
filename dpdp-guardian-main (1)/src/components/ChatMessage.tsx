import { Bot, User, FileText, ExternalLink, Copy, Check, Download, Paperclip, Share } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  files?: string[];
  timestamp?: Date;
  showCopyButton?: boolean;
}

export const ChatMessage = ({
  role,
  content,
  files = [],
  timestamp = new Date(),
  showCopyButton = true
}: ChatMessageProps) => {
  const isAssistant = role === "assistant";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Chat Message',
          text: content,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      handleCopy();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`group flex gap-3 ${isAssistant ? "" : "flex-row-reverse"} p-3 hover:bg-muted/20 transition-colors`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div
          className={`relative w-8 h-8 rounded-full flex items-center justify-center shadow-md ${isAssistant
            ? "bg-gradient-to-br from-primary to-primary/80"
            : "bg-gradient-to-br from-secondary to-secondary/80"
            }`}
        >
          {isAssistant ? (
            <Bot className="h-4 w-4 text-white" />
          ) : (
            <User className="h-4 w-4 text-white" />
          )}
          <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background ${isAssistant ? "bg-green-500" : "bg-blue-500"
            }`} />
        </div>
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[90%] space-y-2 ${isAssistant ? "" : "items-end flex flex-col"}`}>
        {/* Header with role and timestamp */}
        <div className={`flex items-center gap-2 ${isAssistant ? "" : "flex-row-reverse"}`}>
          <span className={`font-semibold text-xs ${isAssistant ? "text-primary" : "text-secondary"
            }`}>
            {isAssistant ? "Compliance Assistant" : "You"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(timestamp)}
          </span>
        </div>

        {/* Files Attachments */}
        {files.length > 0 && (
          <div className={`flex flex-wrap gap-1 ${isAssistant ? "" : "justify-end"}`}>
            {files.map((file, idx) => (
              <div
                key={idx}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border bg-card ${isAssistant
                  ? "border-primary/20"
                  : "border-secondary/20"
                  }`}
              >
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium max-w-[120px] truncate">
                  {file}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Message Bubble with Right Side Actions */}
        <div className="flex items-start gap-2">
          {isAssistant && (
            <div className="flex-shrink-0 flex flex-col gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 w-7 p-0"
                title={copied ? "Copied!" : "Copy message"}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-7 w-7 p-0"
                title="Share message"
              >
                <Share className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <div className="relative flex-1">
            <div
              className={`px-4 py-3 rounded-xl shadow-sm ${isAssistant
                ? "bg-card border border-border rounded-tl-sm"
                : "bg-primary text-primary-foreground rounded-tr-sm"
                }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
            </div>
          </div>

          {!isAssistant && (
            <div className="flex-shrink-0 flex flex-col gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 w-7 p-0"
                title={copied ? "Copied!" : "Copy message"}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-7 w-7 p-0"
                title="Share message"
              >
                <Share className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Metadata */}
        {isAssistant && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span>AI-generated</span>
            </div>
            {files.length > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                <span>{files.length} file{files.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};