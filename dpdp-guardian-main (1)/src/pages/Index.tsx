import { useState, useEffect } from "react";
import { SearchInput } from "@/components/SearchInput";
import { ComplianceResult } from "@/components/ComplianceResult";
import { ChatMessage } from "@/components/ChatMessage";
import { AppSidebar } from "@/components/AppSidebar";
import { Shield, FileSearch, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: string[];
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

const Index = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "demo-1",
      role: "assistant",
      content: "Welcome to DPDP AI Guardian. I've analyzed your current data policies. You can see the compliance summary below, or ask me specific questions about the DPDP Act.",
    }
  ]);
  const [showResults, setShowResults] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<"chatgpt" | "gemini">("chatgpt");

  // Mock compliance results for demo
  const mockFindings = [
    {
      summary: "Personal data stored without encryption",
      section: "Section 8",
      clauseDescription: "Obligation to ensure reasonable security safeguards for personal data",
      complianceStatus: "Non-Compliant" as const,
      riskLevel: "High" as const,
      explanation: "The DPDP Act requires data fiduciaries to implement reasonable security measures to protect personal data. Storing personal data without encryption increases the risk of unauthorized access and data breaches.",
      remediation: [
        "Enable encryption at rest using AES-256 or equivalent",
        "Implement TLS 1.3 for data in transit",
        "Conduct regular security audits",
        "Document encryption policies and procedures",
      ],
    },
    {
      summary: "User consent not properly logged",
      section: "Section 6",
      clauseDescription: "Processing of personal data with valid consent from the data principal",
      complianceStatus: "Partially Compliant" as const,
      riskLevel: "Medium" as const,
      explanation: "While consent is being collected, the system lacks proper timestamping and audit trails for consent records, which may not meet the DPDP Act's requirements for demonstrable consent.",
      remediation: [
        "Implement consent management system with timestamps",
        "Store consent records with immutable audit trails",
        "Enable consent withdrawal mechanisms",
        "Maintain consent logs for required retention period",
      ],
    },
    {
      summary: "Data retention policy documented",
      section: "Section 8(7)",
      clauseDescription: "Erasure of personal data upon withdrawal of consent or purpose fulfillment",
      complianceStatus: "Compliant" as const,
      riskLevel: "Low" as const,
      explanation: "The organization has documented data retention policies that align with DPDP requirements for data erasure upon consent withdrawal or when the specified purpose is fulfilled.",
      remediation: [],
    },
  ];

  const loadSession = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        const loadedMessages: Message[] = data.map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          files: msg.files || [],
        }));
        setMessages(loadedMessages);
        setShowResults(loadedMessages.length > 0);
        setCurrentSessionId(sessionId);
      }
    } catch (err) {
      console.warn("Supabase load session error:", err);
    }
  };

  const handleSelectSession = (sessionId: string | null) => {
    if (sessionId) {
      loadSession(sessionId);
    } else {
      handleNewChat();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setShowResults(false);
    setCurrentSessionId(null);
  };

  const handleSubmit = async (query: string, files: UploadedFile[]) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: query || "Hello",
      files: files.map((f) => f.name),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    let sessionId = currentSessionId;

    // Create session if user is logged in and no current session
    if (user && !sessionId) {
      try {
        const title = query.slice(0, 50) || "AI Chat";
        const { data: sessionData, error: sessionError } = await supabase
          .from("chat_sessions")
          .insert({ user_id: user.id, title })
          .select()
          .single();

        if (!sessionError && sessionData) {
          sessionId = sessionData.id;
          setCurrentSessionId(sessionId);
        }
      } catch (err) {
        console.warn("Supabase session creation error:", err);
      }
    }

    // Save user message if session exists
    if (sessionId) {
      try {
        await supabase.from("chat_messages").insert({
          session_id: sessionId,
          role: "user",
          content: userMessage.content,
          files: userMessage.files,
        });
      } catch (err) {
        console.warn("Supabase message save error:", err);
      }
    }

    try {
      // Call backend API
      const response = await fetch("http://localhost:8000/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: query,
          model: selectedModel,
          history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setShowResults(true);

        // Save assistant message if session exists
        if (sessionId) {
          await supabase.from("chat_messages").insert({
            session_id: sessionId,
            role: "assistant",
            content: assistantMessage.content,
            files: [],
          });
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error calling AI API:", error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar
          currentSessionId={currentSessionId || undefined}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
        />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-border bg-card">
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SidebarTrigger>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-lg">
                    <Shield className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">AI Chat Assistant</h1>
                    <p className="text-sm text-muted-foreground hidden sm:block">
                      Chat with AI models powered by ChatGPT and Gemini
                    </p>
                  </div>
                </div>
              </div>

              {/* Header Title Information */}
              <div className="hidden md:block">
                <p className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  Powered by OpenAI
                </p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-6">
              <div className="max-w-4xl mx-auto">
                {/* Empty State */}
                {messages.length === 0 && (
                  <div className="text-center py-16">
                    <div className="inline-flex p-4 bg-muted rounded-2xl mb-6">
                      <FileSearch className="h-12 w-12 text-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">
                      AI Chat Assistant
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto mb-8">
                      Start a conversation with AI. Choose between ChatGPT and Gemini models.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                      {[
                        { title: "Upload Documents", desc: "PDF, DOCX, TXT files" },
                        { title: "Describe Findings", desc: "Technical issues or gaps" },
                        { title: "Get Compliance Map", desc: "DPDP sections & remediation" },
                      ].map((item, idx) => (
                        <div key={idx} className="p-4 bg-card border border-border rounded-xl">
                          <p className="font-semibold text-foreground">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Messages */}
                {messages.length > 0 && (
                  <div className="space-y-6 mb-6">
                    {messages.map((msg) => (
                      <ChatMessage
                        key={msg.id}
                        role={msg.role}
                        content={msg.content}
                        files={msg.files}
                      />
                    ))}

                    {isLoading && (
                      <div className="flex gap-4">
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                          <p className="text-sm text-muted-foreground">AI is thinking...</p>
                        </div>
                      </div>
                    )}

                    {showResults && (
                      <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <ComplianceResult
                          findings={mockFindings}
                          uploadedFiles={messages[messages.length - 1]?.files || []}
                          overallRiskPercentage={65}
                          analysisTime="1.5m"
                          confidenceScore={94}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Search Input */}
                <div className="sticky bottom-4 bg-background pt-4">
                  <SearchInput
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    placeholder="Type your message to chat with AI..."
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
