import { useState, useRef } from "react";
import { Search, Upload, X, FileText, Send, Paperclip, Mic, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface SearchInputProps {
  onSubmit: (query: string, files: UploadedFile[]) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const SearchInput = ({ onSubmit, isLoading, placeholder = "Ask me anything..." }: SearchInputProps) => {
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (uploadedFiles) {
      const newFiles: UploadedFile[] = Array.from(uploadedFiles).map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = () => {
    if (query.trim() || files.length > 0) {
      onSubmit(query, files);
      setQuery("");
      setFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleVoiceInput = () => {
    if (!isRecording) {
      setIsRecording(true);
      // Voice recording logic would go here
      setTimeout(() => setIsRecording(false), 3000); // Simulate recording
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* File Preview Section */}
      {files.length > 0 && (
        <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 p-4 rounded-xl border border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {files.length} file{files.length > 1 ? "s" : ""} attached
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFiles([])}
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
            >
              Clear all
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="group flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="p-1.5 bg-primary/10 rounded">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate max-w-[180px]">
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="ml-2 p-1 hover:bg-destructive/10 rounded-full transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <div className="relative bg-white dark:bg-gray-900 border-2 border-primary/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 focus-within:border-primary focus-within:shadow-primary/10">
        <div className="p-4">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/70 focus:outline-none resize-none min-h-[80px] max-h-[200px] text-base leading-relaxed"
            rows={3}
            disabled={isLoading}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between px-4 pb-4 border-t border-border pt-3">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="hidden"
            />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="h-9 px-3 gap-2 rounded-lg hover:bg-primary/10"
            >
              <Upload className="h-4 w-4" />
              <span className="text-sm">Upload</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleVoiceInput}
              disabled={isLoading}
              className={`h-9 px-3 gap-2 rounded-lg hover:bg-primary/10 ${isRecording ? "bg-red-500/10 text-red-500" : ""
                }`}
            >
              <Mic className={`h-4 w-4 ${isRecording ? "animate-pulse" : ""}`} />
              <span className="text-sm">{isRecording ? "Listening..." : "Voice"}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>PDF, DOC</span>
              </div>
              <div className="flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                <span>Images</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || (!query.trim() && files.length === 0)}
              size="lg"
              className="h-11 px-6 gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span className="font-semibold">Analyze</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Character Count */}
        <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground">
          {query.length > 0 && (
            <span className="bg-background px-2 py-1 rounded">
              {query.length} characters
            </span>
          )}
        </div>
      </div>

      {/* Helper Text */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span>Press Enter to send</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span>Shift + Enter for new line</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span>Drag & drop files supported</span>
        </div>
      </div>
    </div>
  );
};