import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Plus, LogOut, User, Trash2, Clock, Sparkles, ChevronRight, History, FileText, Settings, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

interface AppSidebarProps {
  currentSessionId?: string;
  onSelectSession: (sessionId: string | null) => void;
  onNewChat: () => void;
}

export const AppSidebar = ({ currentSessionId, onSelectSession, onNewChat }: AppSidebarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSessions();
    } else {
      setSessions([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setSessions(data);
      }
    } catch (err) {
      console.warn("Supabase fetch error, using empty sessions:", err);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId);

    if (!error) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        onSelectSession(null);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <Sidebar className="border-r border-border/50 bg-gradient-to-b from-background to-background/95">
      <SidebarHeader className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Compliance AI</h2>
            <p className="text-xs text-muted-foreground">DPDP Analysis</p>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onNewChat}
              className="w-full gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <Plus className="h-4 w-4" />
              New Analysis
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            Start a new compliance analysis
          </TooltipContent>
        </Tooltip>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 space-y-6">
        {user ? (
          <>
            {/* Recent Analyses Section */}
            <SidebarGroup className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <SidebarGroupLabel className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  Recent Analyses
                </SidebarGroupLabel>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {sessions.length}
                </span>
              </div>

              <SidebarGroupContent>
                <SidebarMenu>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <SidebarMenuItem key={i}>
                        <div className="px-2 py-3 flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-lg" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-2 w-16" />
                          </div>
                        </div>
                      </SidebarMenuItem>
                    ))
                  ) : sessions.length === 0 ? (
                    <div className="px-2 py-4 text-center space-y-2">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No analyses yet
                      </p>
                      <Button
                        onClick={onNewChat}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        Start your first
                      </Button>
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <SidebarMenuItem key={session.id} className="mb-1">
                        <SidebarMenuButton
                          onClick={() => onSelectSession(session.id)}
                          className={`group relative px-2 py-3 rounded-lg transition-all duration-200 ${currentSessionId === session.id
                            ? "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 shadow-sm"
                            : "hover:bg-muted/50"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg flex-shrink-0 ${currentSessionId === session.id
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                              }`}>
                              <MessageSquare className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium truncate ${currentSessionId === session.id ? "text-primary" : "text-foreground"
                                  }`}>
                                  {session.title}
                                </p>
                                <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${currentSessionId === session.id ? "rotate-90" : ""
                                  }`} />
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(session.updated_at)}
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteSession(e, session.id)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          <div className="px-2 py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Get Started</h3>
              <p className="text-sm text-muted-foreground">
                Sign in to save and manage your compliance analyses
              </p>
            </div>
            <Button
              onClick={() => navigate("/auth")}
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
            >
              Sign In to Continue
            </Button>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white">
                  {getUserInitials(user.email || "")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => navigate("/profile")}
                    variant="ghost"
                    size="sm"
                    className="gap-2 justify-start text-muted-foreground hover:text-foreground w-full"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Account settings
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              onClick={() => navigate("/auth")}
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
            >
              Get Started Free
            </Button>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <HelpCircle className="h-3 w-3" />
              <span>No credit card required</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};