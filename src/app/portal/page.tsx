"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  HeartHandshake,
  Heart,
  MessageSquare,
  ShieldAlert,
  Users,
  Settings,
  BookOpen,
  LogOut,
  Send,
  Flag,
  Trash2,
  RefreshCw,
  PhoneCall,
  UserPlus,
  FileCheck,
  Lock,
  Shield,
  Star,
  Volume2,
  VolumeX,
  BarChart3,
  Sparkles,
  LifeBuoy,
} from "lucide-react";
import { ApplicationReview, IncidentReview, VolunteerStatusControls, saveAdminAction } from "@/components/AdminControls";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { soundManager } from "@/lib/sound";
import { CANNED_RESPONSES } from "@/lib/canned-responses";
import { transliterateSinglishToSinhala } from "@/lib/singlish";
import {
  Volunteer,
  SupportTicket,
  ConversationMessage,
  PrivacyRequest,
  IncidentReport,
  VolunteerApplication,
  AdminAuditEvent,
  UserFeedback,
} from "@/lib/types";
import { PlatformAnalytics } from "@/lib/store";

function requestSignal(signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(12000);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

function getSupporterHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("hid_supporter_session") : null;
  return token ? { "x-supporter-session": token } : {};
}

export default function PortalDashboard() {
  const router = useRouter();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<Volunteer | null>(null);
  const [myAvailability, setMyAvailability] = useState<"online" | "busy" | "offline">("online");
  const [authLoading, setAuthLoading] = useState(true);

  // Active Tab: 'queue' | 'guidelines' | 'reports' | 'privacy' | 'team' | 'applications' | 'settings'
  const [activeTab, setActiveTab] = useState<string>("queue");

  // Queue & Tickets
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketFilter, setTicketFilter] = useState<"all" | "waiting" | "mine" | "closed">("all");
  const [selectedTicketRef, setSelectedTicketRef] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [activeMessages, setActiveMessages] = useState<ConversationMessage[]>([]);
  const [visitorTyping, setVisitorTyping] = useState<{ isTyping: boolean; name: string }>({ isTyping: false, name: "" });
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [chatError, setChatError] = useState("");
  const [showGuidanceDrawer, setShowGuidanceDrawer] = useState(false);

  // Supervisor / Admin Data
  const [privacyRequests, setPrivacyRequests] = useState<PrivacyRequest[]>([]);
  const [incidentReports, setIncidentReports] = useState<IncidentReport[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditEvent[]>([]);
  const [userFeedback, setUserFeedback] = useState<UserFeedback[]>([]);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [adminError, setAdminError] = useState("");
  const [adminNotice, setAdminNotice] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [supporterSinglishAuto, setSupporterSinglishAuto] = useState(false);
  const [showCannedMenu, setShowCannedMenu] = useState(false);
  const [isCleaningData, setIsCleaningData] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);
  const [platformSettings, setPlatformSettings] = useState({
    serviceStatus: "online",
    pilotMode: "true",
    operatingHours: "8:00 AM - 10:00 PM IST (Sri Lanka Time)",
    retentionDays: "30",
  });

  // Admin New Volunteer Form
  const [newVolData, setNewVolData] = useState({
    email: "",
    displayName: "",
    role: "supporter",
    password: "",
  });
  const [newVolMsg, setNewVolMsg] = useState("");

  const messageContainerRef = useRef<HTMLDivElement>(null);
  const selectedTicketRefRef = useRef<string | null>(null);
  const activeTicketRef = useRef<SupportTicket | null>(null);
  const nearBottomRef = useRef(true);
  const queueLoadingRef = useRef<AbortSignal | null>(null);
  const ticketLoadingRef = useRef<AbortSignal | null>(null);
  const sendingReplyRef = useRef(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ticketFailuresRef = useRef(0);
  const previousWaitingCountRef = useRef(0);
  const activeMessagesCountRef = useRef(0);

  // 1. Authenticate Supporter Session
  const checkAuth = useCallback((signal?: AbortSignal) => {
    return fetch("/api/portal/auth/me", { cache: "no-store", headers: getSupporterHeaders(), signal: requestSignal(signal) }).then(async (res) => {
      if (signal?.aborted) return;
      if (res.status === 401) {
        if (typeof window !== "undefined") localStorage.removeItem("hid_supporter_session");
        router.push("/portal/login");
        return;
      }
      if (!res.ok) throw new Error("Unable to verify your supporter session. Please try again.");
      const data = await res.json();
      if (signal?.aborted) return;
      setCurrentUser(data.supporter);
      setMyAvailability(data.availability);
    }).catch((error: unknown) => {
      if (!signal?.aborted) setChatError(error instanceof Error ? error.message : "Connection interrupted. Please try again.");
    }).finally(() => {
      if (!signal?.aborted) setAuthLoading(false);
    });
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    void checkAuth(controller.signal);
    return () => controller.abort();
  }, [checkAuth]);

  // 2. Fetch Tickets Queue
  const fetchTickets = useCallback((signal?: AbortSignal) => {
    if (queueLoadingRef.current && !queueLoadingRef.current.aborted) return;
    const loadingSignal = requestSignal(signal);
    queueLoadingRef.current = loadingSignal;
    return fetch("/api/portal/tickets", { cache: "no-store", headers: getSupporterHeaders(), signal: loadingSignal }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (!signal?.aborted) {
          const list: SupportTicket[] = data.tickets || [];
          const waitingCount = list.filter((t) => t.status === "waiting").length;
          if (waitingCount > previousWaitingCountRef.current && previousWaitingCountRef.current > 0) {
            void soundManager.playTicketAlert();
          }
          previousWaitingCountRef.current = waitingCount;
          setTickets(list);
        }
      }
    }).catch((error: unknown) => {
      if (!signal?.aborted) console.error("Fetch tickets error", error);
    }).finally(() => {
      if (queueLoadingRef.current === loadingSignal) queueLoadingRef.current = null;
    });
  }, []);

  useEffect(() => {
    if (currentUser) {
      const controller = new AbortController();
      void fetchTickets(controller.signal);
      const interval = setInterval(() => { void fetchTickets(controller.signal); }, 5000);
      return () => { controller.abort(); clearInterval(interval); };
    }
  }, [currentUser, fetchTickets]);

  // 3. Poll Selected Ticket Messages
  const pollActiveTicket = useCallback((signal?: AbortSignal) => {
    if (!selectedTicketRef || (ticketLoadingRef.current && !ticketLoadingRef.current.aborted)) return;
    const loadingSignal = requestSignal(signal);
    ticketLoadingRef.current = loadingSignal;
    return fetch(`/api/portal/tickets/${selectedTicketRef}`, { cache: "no-store", headers: getSupporterHeaders(), signal: loadingSignal }).then(async (res) => {
      if (signal?.aborted || selectedTicketRefRef.current !== selectedTicketRef) return;
      if (res.ok) {
        const data = await res.json();
        if (signal?.aborted || selectedTicketRefRef.current !== selectedTicketRef) return;
        ticketFailuresRef.current = 0;
        activeTicketRef.current = data.ticket;
        setActiveTicket(data.ticket);
        
        const newMsgs: ConversationMessage[] = data.messages || [];
        if (newMsgs.length > activeMessagesCountRef.current && activeMessagesCountRef.current > 0) {
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg && (lastMsg.sender_role === "visitor" || (lastMsg as unknown as { senderRole?: string }).senderRole === "visitor")) {
            void soundManager.playMessageChime();
          }
        }
        activeMessagesCountRef.current = newMsgs.length;

        setActiveMessages((previous) => newMsgs.length >= previous.length ? newMsgs : previous);
        setVisitorTyping(data.typing || { isTyping: false, name: "" });
        setChatError("");
      } else {
        ticketFailuresRef.current += 1;
        if (!activeTicketRef.current && ticketFailuresRef.current >= 2) {
          setChatError("This conversation could not be loaded. Check your access or choose another conversation.");
        } else if (ticketFailuresRef.current >= 3) {
          setChatError("Connection update delayed. Reconnecting automatically; your draft is safe.");
        }
      }
    }).catch((error: unknown) => {
      if (!signal?.aborted && selectedTicketRefRef.current === selectedTicketRef) {
        console.error("Poll active ticket error", error);
        ticketFailuresRef.current += 1;
        if (ticketFailuresRef.current >= 3) {
          setChatError("Connection interrupted. Retrying automatically; your draft is safe.");
        }
      }
    }).finally(() => {
      if (ticketLoadingRef.current === loadingSignal) ticketLoadingRef.current = null;
    });
  }, [selectedTicketRef]);

  useEffect(() => {
    if (selectedTicketRef) {
      const controller = new AbortController();
      void pollActiveTicket(controller.signal);
      const interval = setInterval(() => { void pollActiveTicket(controller.signal); }, 3000);
      return () => { controller.abort(); clearInterval(interval); };
    }
  }, [selectedTicketRef, pollActiveTicket]);

  useEffect(() => {
    const container = messageContainerRef.current;
    if (container && nearBottomRef.current) container.scrollTop = container.scrollHeight;
  }, [activeMessages.length, visitorTyping.isTyping]);

  useEffect(() => () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, []);

  // 4. Fetch Tab Data
  const fetchTabData = useCallback((signal?: AbortSignal) => {
    if (!currentUser) return;
    const isSuperOrAdmin = currentUser.role === "admin" || currentUser.role === "supervisor";

    if (!isSuperOrAdmin) return;
    const options = { cache: "no-store" as const, headers: getSupporterHeaders(), signal: requestSignal(signal) };
    const load = <T,>(path: string, apply: (data: T) => void) => fetch(path, options)
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load this section. Please refresh.");
        const data = await response.json() as T;
        if (!signal?.aborted) apply(data);
      }).catch((error: unknown) => {
        if (!signal?.aborted) setAdminError(error instanceof Error ? error.message : "Unable to load this section.");
      });
    if (activeTab === "privacy") return load<{ requests: PrivacyRequest[] }>("/api/portal/admin/privacy-requests", (data) => setPrivacyRequests(data.requests));
    if (activeTab === "reports") return load<{ reports: IncidentReport[] }>("/api/portal/admin/incident-reports", (data) => setIncidentReports(data.reports));
    if (activeTab === "analytics") return load<{ analytics: PlatformAnalytics }>("/api/portal/admin/analytics", (data) => setAnalytics(data.analytics));
    if (activeTab === "team") return load<{ volunteers: Volunteer[] }>("/api/portal/admin/volunteers", (data) => setVolunteers(data.volunteers));
    if (activeTab === "applications") return load<{ applications: VolunteerApplication[] }>("/api/portal/admin/applications", (data) => setApplications(data.applications));
    if (activeTab === "feedback") return load<{ feedback: UserFeedback[] }>("/api/portal/admin/feedback", (data) => setUserFeedback(data.feedback));
    if (activeTab === "settings") return Promise.all([
      load<typeof platformSettings>("/api/portal/admin/settings", setPlatformSettings),
      load<{ auditEvents: AdminAuditEvent[] }>("/api/portal/admin/audit", (data) => setAuditLogs(data.auditEvents)),
    ]);
  }, [currentUser, activeTab]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchTabData(controller.signal);
    return () => controller.abort();
  }, [fetchTabData]);

  // Update Supporter Availability
  const handleAvailabilityChange = async (newStatus: "online" | "busy" | "offline") => {
    setChatError("");
    try {
      await saveAdminAction("/api/portal/availability", { status: newStatus });
      setMyAvailability(newStatus);
    } catch (error: unknown) {
      setChatError(error instanceof Error ? error.message : "Unable to update your availability.");
    }
  };

  // Run Automated 30-Day Data Shredder
  const handleRunCleanup = async () => {
    setIsCleaningData(true);
    setCleanupResult(null);
    try {
      const res = await fetch("/api/portal/admin/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSupporterHeaders() },
        body: JSON.stringify({ retentionDays: 30 }),
      });
      const data = await res.json();
      if (res.ok) {
        setCleanupResult(`Successfully shredded ${data.purgedCount} expired conversations (older than 30 days) adhering to PDPA.`);
      } else {
        setCleanupResult(`Cleanup error: ${data.error || "Failed to shred data."}`);
      }
    } catch (err: unknown) {
      setCleanupResult(err instanceof Error ? err.message : "Cleanup failed.");
    } finally {
      setIsCleaningData(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") localStorage.removeItem("hid_supporter_session");
      await saveAdminAction("/api/portal/auth/logout", {});
      router.push("/portal/login");
    } catch (error: unknown) { setChatError(error instanceof Error ? error.message : "Unable to sign out. Please try again."); }
  };

  // Supporter Typing Ping
  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setReplyText(supporterSinglishAuto ? transliterateSinglishToSinhala(val) : val);
    if (!activeTicket || activeTicket.status === "closed") return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    fetch(`/api/portal/tickets/${activeTicket.ticket_ref}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTyping: true }),
    }).catch(() => { });

    typingTimerRef.current = setTimeout(() => {
      if (activeTicket) {
        fetch(`/api/portal/tickets/${activeTicket.ticket_ref}/typing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isTyping: false }),
        }).catch(() => { });
      }
    }, 3000);
  };

  // Send Supporter Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket || sendingReplyRef.current || activeTicket.status === "closed") return;

    const textToSend = replyText.trim();
    const sendingTicketRef = activeTicket.ticket_ref;
    sendingReplyRef.current = true;
    setChatError("");
    setIsSendingReply(true);

    try {
      const res = await fetch(`/api/portal/tickets/${activeTicket.ticket_ref}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: textToSend }),
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const data = await res.json();
        if (selectedTicketRefRef.current === sendingTicketRef) {
          nearBottomRef.current = true;
          setActiveMessages((prev) => prev.some((message) => message.id === data.message.id) ? prev : [...prev, data.message]);
          setReplyText("");
        }
        fetchTickets();
      } else {
        const err = await res.json();
        if (selectedTicketRefRef.current === sendingTicketRef) setChatError(err.error || "Failed to send message. Ensure conversation is assigned to you.");
      }
    } catch (err) {
      console.error("Supporter send message error", err);
      if (selectedTicketRefRef.current === sendingTicketRef) setChatError("Your message could not be sent. Your draft is saved here; reconnect and try again.");
    } finally {
      setIsSendingReply(false);
      sendingReplyRef.current = false;
    }
  };

  const handleTicketAction = async (action: string, body: unknown = {}) => {
    if (!activeTicket || pendingAction) return;
    setPendingAction(`ticket:${action}`); setChatError("");
    try {
      await saveAdminAction(`/api/portal/tickets/${activeTicket.ticket_ref}/${action}`, body);
      void pollActiveTicket(); void fetchTickets();
    } catch (error: unknown) { setChatError(error instanceof Error ? error.message : "Unable to update this conversation."); }
    finally { setPendingAction(""); }
  };

  const handleAssignToMe = () => handleTicketAction("assign");
  const handleReturnToQueue = () => handleTicketAction("unassign");

  // Close Ticket
  const handleCloseTicket = async () => {
    if (!activeTicket) return;
    const confirm = window.confirm("Are you sure you want to close this conversation?");
    if (!confirm) return;

    await handleTicketAction("close");
  };

  // Flag Ticket
  const handleTogglePriority = async () => {
    if (!activeTicket) return;
    const newPriority = !activeTicket.is_priority_review;
    await handleTicketAction("flag", { isPriority: newPriority });
  };

  const handleToggleSafety = async () => {
    if (!activeTicket) return;
    const newSafety = !activeTicket.is_safety_flagged;
    const notes = prompt("Enter safety assessment or supervisor handover notes:");
    if (notes === null) return;
    await handleTicketAction("flag", { isSafetyFlagged: newSafety, notes });
  };

  // Process Privacy Deletion
  const handleProcessDeletion = async (ticketId: string) => {
    const confirm = window.confirm("Execute permanent cryptographic shredding of all messages and recovery credentials for this conversation?");
    if (!confirm) return;

    if (pendingAction) return;
    setPendingAction(`delete:${ticketId}`); setAdminError(""); setAdminNotice("");
    try {
      await saveAdminAction(`/api/portal/admin/privacy-requests/${ticketId}/process`, {});
      setAdminNotice("Conversation messages and access credentials were permanently deleted.");
      void fetchTabData(); void fetchTickets();
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Unable to process this deletion request.");
    } finally { setPendingAction(""); }
  };

  // Create Volunteer Account
  const handleCreateVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingAction) return;
    setPendingAction("create-volunteer");
    setNewVolMsg("");
    try {
      const res = await fetch("/api/portal/admin/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVolData),
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        setNewVolMsg("Volunteer account created successfully.");
        setNewVolData({ email: "", displayName: "", role: "supporter", password: "" });
        fetchTabData();
      } else {
        const err = await res.json();
        setNewVolMsg(err.error || "Failed to create account.");
      }
    } catch (err: unknown) {
      setNewVolMsg(err instanceof Error ? err.message : "Error creating account.");
    } finally { setPendingAction(""); }
  };

  const handleSaveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pendingAction) return;
    setPendingAction("settings"); setAdminError(""); setAdminNotice("");
    try {
      await saveAdminAction("/api/portal/admin/settings", platformSettings);
      setAdminNotice("Platform settings saved.");
      void fetchTabData();
    } catch (error: unknown) { setAdminError(error instanceof Error ? error.message : "Unable to save settings."); }
    finally { setPendingAction(""); }
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    if (ticketFilter === "waiting") return t.status === "waiting";
    if (ticketFilter === "mine") return t.assigned_volunteer_id === currentUser?.id;
    if (ticketFilter === "closed") return t.status === "closed";
    return true;
  });

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAF9F7]">
        <div className="flex items-center gap-2 text-sm text-[#25234A] font-semibold">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Verifying Supporter Session...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) return (
    <div className="mx-auto my-16 max-w-md rounded-3xl border border-[#E8E5DF] bg-white p-8 text-center">
      <p role="alert" className="mb-4 text-sm">{chatError || "Please sign in to continue."}</p>
      <button type="button" onClick={() => { setAuthLoading(true); setChatError(""); void checkAuth(); }} className="rounded-xl bg-[#25234A] px-5 py-3 text-sm text-white">Try again</button>
      <button type="button" onClick={() => router.push("/portal/login")} className="ml-3 text-sm underline">Sign in</button>
    </div>
  );

  const isSupervisorOrAdmin = currentUser.role === "admin" || currentUser.role === "supervisor";

  return (
    <div className="flex-1 flex flex-col bg-[#FAF9F7] text-base leading-relaxed">
      {/* PORTAL TOP NAVIGATION BAR */}
      <header className="bg-[#25234A] text-white border-b border-[#383466] px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Identity & Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#383466] border border-[#534D88] flex items-center justify-center text-[#B8D8C2] font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">{currentUser.display_name}</span>
                <span className="text-sm uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#534D88] text-[#B8D8C2]">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-sm text-[#FAF9F7]/70">Supporter ID: {currentUser.id}</p>
            </div>
          </div>

          {/* Availability Control & Actions */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Availability Pill Selector */}
            <div className="flex items-center p-1 rounded-xl bg-[#1A1838] border border-[#383466] text-sm">
              <button
                type="button"
                onClick={() => handleAvailabilityChange("online")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${myAvailability === "online" ? "bg-emerald-600 text-white" : "text-[#FAF9F7]/60 hover:text-white"
                  }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                <span>Online</span>
              </button>
              <button
                type="button"
                onClick={() => handleAvailabilityChange("busy")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${myAvailability === "busy" ? "bg-amber-600 text-white" : "text-[#FAF9F7]/60 hover:text-white"
                  }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-300" />
                <span>Busy</span>
              </button>
              <button
                type="button"
                onClick={() => handleAvailabilityChange("offline")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${myAvailability === "offline" ? "bg-slate-600 text-white" : "text-[#FAF9F7]/60 hover:text-white"
                  }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                <span>Offline</span>
              </button>
            </div>

            {/* Sound Mute/Unmute Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = soundManager.toggleMute();
                setIsMuted(next);
              }}
              className={`p-2 rounded-xl text-sm font-semibold border transition-colors flex items-center gap-1.5 ${
                isMuted
                  ? "bg-amber-900/40 text-amber-300 border-amber-600/50"
                  : "bg-[#383466] text-white border-[#534D88] hover:bg-[#4a4580]"
              }`}
              title={isMuted ? "Unmute chimes & alerts" : "Mute chimes & alerts"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline text-xs">{isMuted ? "Muted" : "Sound On"}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl bg-[#383466] hover:bg-rose-900/60 text-white text-sm font-semibold border border-[#534D88] flex items-center gap-1.5"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD TABS NAVIGATION */}
      <div className="bg-white border-b border-[#E8E5DF] px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2">
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0 ${activeTab === "queue"
                ? "bg-[#25234A] text-white shadow-xs"
                : "text-[#5B5875] hover:bg-[#FAF9F7]"
              }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Conversations Queue ({tickets.filter((t) => t.status !== "closed").length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("guidelines")}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0 ${activeTab === "guidelines"
                ? "bg-[#25234A] text-white shadow-xs"
                : "text-[#5B5875] hover:bg-[#FAF9F7]"
              }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Volunteer Guidelines</span>
          </button>

          {isSupervisorOrAdmin && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("analytics")}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0 ${activeTab === "analytics"
                    ? "bg-[#25234A] text-white shadow-xs"
                    : "text-[#5B5875] hover:bg-[#FAF9F7]"
                  }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics & Impact</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("reports")}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0 ${activeTab === "reports"
                    ? "bg-[#25234A] text-white shadow-xs"
                    : "text-[#5B5875] hover:bg-[#FAF9F7]"
                  }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Incident Reports</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("privacy")}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0 ${activeTab === "privacy"
                    ? "bg-[#25234A] text-white shadow-xs"
                    : "text-[#5B5875] hover:bg-[#FAF9F7]"
                  }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Privacy / Deletion Requests</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("feedback")}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0 ${activeTab === "feedback" ? "bg-[#25234A] text-white" : "text-[#5B5875] hover:bg-[#FAF9F7]"}`}
              ><Star className="w-4 h-4" /><span>Feedback</span></button>

              <button
                type="button"
                onClick={() => setActiveTab("applications")}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0 ${activeTab === "applications"
                    ? "bg-[#25234A] text-white shadow-xs"
                    : "text-[#5B5875] hover:bg-[#FAF9F7]"
                  }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>Volunteer Applications</span>
              </button>
            </>
          )}

          {currentUser.role === "admin" && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("team")}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0 ${activeTab === "team"
                    ? "bg-[#25234A] text-white shadow-xs"
                    : "text-[#5B5875] hover:bg-[#FAF9F7]"
                  }`}
              >
                <Users className="w-4 h-4" />
                <span>Volunteer Roster</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0 ${activeTab === "settings"
                    ? "bg-[#25234A] text-white shadow-xs"
                    : "text-[#5B5875] hover:bg-[#FAF9F7]"
                  }`}
              >
                <Settings className="w-4 h-4" />
                <span>Platform Settings & Audit</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* DASHBOARD CONTENT BODY */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 flex flex-col">
        {chatError && <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{chatError}</p>}
        {adminError && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><span>{adminError}</span><button type="button" onClick={() => { setAdminError(""); void fetchTabData(); }} className="font-semibold underline">Retry loading</button></div>}
        {adminNotice && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{adminNotice}</p>}
        {/* ============================================================== */}
        {/* TAB 1: CONVERSATIONS QUEUE & CHAT CONSOLE                      */}
        {/* ============================================================== */}
        {activeTab === "queue" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
            {/* Left Column: Tickets Queue List (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Filter Pills */}
              <div className="p-1.5 rounded-2xl bg-white border border-[#E8E5DF] flex items-center justify-between text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setTicketFilter("all")}
                  className={`px-3 py-1.5 rounded-xl ${ticketFilter === "all" ? "bg-[#EDE7F6] text-[#25234A]" : "text-[#5B5875]"}`}
                >
                  All ({tickets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTicketFilter("waiting")}
                  className={`px-3 py-1.5 rounded-xl ${ticketFilter === "waiting" ? "bg-[#EDE7F6] text-[#25234A]" : "text-[#5B5875]"}`}
                >
                  Waiting ({tickets.filter((t) => t.status === "waiting").length})
                </button>
                <button
                  type="button"
                  onClick={() => setTicketFilter("mine")}
                  className={`px-3 py-1.5 rounded-xl ${ticketFilter === "mine" ? "bg-[#EDE7F6] text-[#25234A]" : "text-[#5B5875]"}`}
                >
                  My Chats ({tickets.filter((t) => t.assigned_volunteer_id === currentUser.id).length})
                </button>
                <button
                  type="button"
                  onClick={() => setTicketFilter("closed")}
                  className={`px-3 py-1.5 rounded-xl ${ticketFilter === "closed" ? "bg-[#EDE7F6] text-[#25234A]" : "text-[#5B5875]"}`}
                >
                  Closed
                </button>
              </div>

              {/* Tickets List */}
              <div className="space-y-3 max-h-[700px] overflow-y-auto">
                {filteredTickets.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white border border-[#E8E5DF] text-center text-sm text-[#5B5875]">
                    No conversations in this view right now.
                  </div>
                ) : (
                  filteredTickets.map((t) => {
                    const isSelected = selectedTicketRef === t.ticket_ref;
                    return (
                      <div
                        key={t.id}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") event.currentTarget.click();
                        }}
                        onClick={() => {
                          if (selectedTicketRefRef.current === t.ticket_ref) return;
                          selectedTicketRefRef.current = t.ticket_ref;
                          nearBottomRef.current = true;
                          setActiveTicket(null);
                          setActiveMessages([]);
                          setVisitorTyping({ isTyping: false, name: "" });
                          setReplyText("");
                          setChatError("");
                          setSelectedTicketRef(t.ticket_ref);
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${isSelected
                            ? "bg-[#EDE7F6]/60 border-[#25234A] shadow-xs"
                            : "bg-white border-[#E8E5DF] hover:border-[#D4C7E8]"
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-mono font-bold text-[#25234A]">
                            {t.ticket_ref}
                          </span>
                          <span
                            className={`text-sm font-bold px-2 py-0.5 rounded-full ${t.status === "waiting"
                                ? "bg-amber-100 text-amber-900"
                                : t.status === "active"
                                  ? "bg-emerald-100 text-emerald-900"
                                  : t.status === "awaiting_reply"
                                    ? "bg-purple-100 text-purple-900"
                                    : "bg-slate-100 text-slate-700"
                              }`}
                          >
                            {t.status}
                          </span>
                        </div>

                        <div className="text-sm font-semibold text-[#25234A] truncate">
                          {t.topic || "Open Conversation"}
                        </div>

                        <div className="flex items-center justify-between text-sm text-[#5B5875] mt-2">
                          <span className="capitalize">Lang: {t.preferred_language === "si" ? "Sinhala" : "English"}</span>
                          <span>
                            {t.assigned_volunteer_name ? `With: ${t.assigned_volunteer_name}` : "Unassigned"}
                          </span>
                        </div>

                        {Boolean(t.is_priority_review || t.is_safety_flagged) && (
                          <div className="mt-2 flex items-center gap-1.5">
                            {Boolean(t.is_priority_review) && (
                              <span className="text-sm font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                Priority Review
                              </span>
                            )}
                            {Boolean(t.is_safety_flagged) && (
                              <span className="text-sm font-bold px-1.5 py-0.5 rounded-md bg-red-100 text-red-800">
                                Safety Flagged
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Active Chat Console (lg:col-span-8) */}
            <div className="lg:col-span-8 flex flex-col bg-white rounded-3xl border border-[#E8E5DF] shadow-md overflow-hidden min-h-[640px]">
              {selectedTicketRef && activeTicket ? (
                <>
                  {/* Console Header */}
                  <div className="p-4 sm:px-6 bg-[#FAF9F7] border-b border-[#E8E5DF] flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-[#25234A] font-mono">
                          {activeTicket.ticket_ref}
                        </span>
                        <span className="text-sm px-2 py-0.5 rounded-md bg-[#EDE7F6] text-[#25234A] font-medium">
                          {activeTicket.preferred_language === "si" ? "සිංහල" : "English"}
                        </span>
                        <span className="text-sm px-2 py-0.5 rounded-md bg-white border border-[#E8E5DF] text-[#5B5875]">
                          {activeTicket.topic || "General"}
                        </span>
                      </div>
                      <p className="text-sm text-[#5B5875] mt-0.5">
                        Assigned to: {activeTicket.assigned_volunteer_name || "Queue"}
                      </p>
                    </div>

                    {/* Console Actions */}
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {activeTicket.assigned_volunteer_id !== currentUser.id ? (
                        <button
                          type="button"
                          onClick={handleAssignToMe}
                          disabled={Boolean(pendingAction) || activeTicket.status === "closed"}
                          className="px-3 py-1.5 rounded-xl font-bold bg-[#25234A] text-white hover:bg-[#383466]"
                        >
                          Assign to Me
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleReturnToQueue}
                          disabled={Boolean(pendingAction) || activeTicket.status === "closed"}
                          className="px-3 py-1.5 rounded-xl font-medium bg-[#EDE7F6] text-[#25234A] hover:bg-[#D4C7E8]"
                        >
                          Return to Queue
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleTogglePriority}
                        disabled={Boolean(pendingAction)}
                        className={`p-2 rounded-xl border ${activeTicket.is_priority_review ? "bg-amber-100 border-amber-300 text-amber-900" : "bg-white text-[#5B5875]"
                          }`}
                        title="Flag for Priority / Supervisor Review"
                      >
                        <Flag className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleSafety}
                        disabled={Boolean(pendingAction)}
                        className={`p-2 rounded-xl border ${activeTicket.is_safety_flagged ? "bg-red-100 border-red-300 text-red-900" : "bg-white text-[#5B5875]"
                          }`}
                        title="Report Safety / Harm Concern"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowGuidanceDrawer(!showGuidanceDrawer)}
                        className="px-3 py-1.5 rounded-xl border border-[#D4C7E8] bg-[#FAF9F7] text-[#25234A] font-semibold hover:bg-[#EDE7F6]"
                      >
                        Empathetic Prompts
                      </button>

                      {activeTicket.status !== "closed" && (
                        <button
                          type="button"
                          onClick={handleCloseTicket}
                          disabled={Boolean(pendingAction) || (currentUser.role === "supporter" && activeTicket.assigned_volunteer_id !== currentUser.id)}
                          className="px-3 py-1.5 rounded-xl font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                        >
                          Close Chat
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Optional Empathetic Prompts Drawer */}
                  {showGuidanceDrawer && (
                    <div className="p-4 bg-[#EDE7F6]/60 border-b border-[#D4C7E8] text-sm space-y-2">
                      <div className="flex items-center justify-between font-bold text-[#25234A]">
                        <span>Compassionate Response Prompts (Click to insert):</span>
                        <button type="button" onClick={() => setShowGuidanceDrawer(false)} className="text-[#5B5875]">✕</button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyText("Thank you for sharing that with me. It takes courage to open up, and I am right here listening.")}
                          className="p-2 rounded-lg bg-white border border-[#D4C7E8] text-left hover:bg-[#FAF9F7] text-[#25234A]"
                        >
                          &ldquo;Thank you for sharing that with me. I am right here listening.&rdquo;
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyText("ඔබේ සිතේ ඇති ඕනෑම දෙයක් ඔබට පහසු වේලාවක මා සමග බෙදා ගන්න. මම ඔබට සවන් දීමට මෙහි සිටිමි.")}
                          className="p-2 rounded-lg bg-white border border-[#D4C7E8] text-left hover:bg-[#FAF9F7] font-sinhala text-[#25234A]"
                        >
                          &ldquo;ඔබේ සිතේ ඇති ඕනෑම දෙයක් මා සමග බෙදා ගන්න. මම ඔබට සවන් දීමට මෙහි සිටිමි.&rdquo;
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyText("That sounds so exhausting to carry all on your own. Please take all the time you need.")}
                          className="p-2 rounded-lg bg-white border border-[#D4C7E8] text-left hover:bg-[#FAF9F7] text-[#25234A]"
                        >
                          &ldquo;That sounds exhausting to carry alone. Take all the time you need.&rdquo;
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyText("If you feel overwhelmed, remember you are in a safe space right now. Would it help to talk about what feels heaviest today?")}
                          className="p-2 rounded-lg bg-white border border-[#D4C7E8] text-left hover:bg-[#FAF9F7] text-[#25234A]"
                        >
                          &ldquo;Would it help to talk about what feels heaviest today?&rdquo;
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Messages Stream */}
                  <div ref={messageContainerRef} onScroll={(event) => {
                    const container = event.currentTarget;
                    nearBottomRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < 90;
                  }} className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 max-h-[460px]">
                    {activeMessages.map((msg) => {
                      const isVisitor = msg.sender_role === "visitor";
                      const isSystem = msg.sender_role === "system";

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center my-2">
                            <div className="max-w-md px-3.5 py-1.5 rounded-full bg-[#EDE7F6]/80 text-sm text-[#5B5875] text-center border border-[#D4C7E8]">
                              {msg.content}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isVisitor ? "items-start" : "items-end"}`}
                        >
                          <div className="flex items-center gap-2 mb-1 text-sm text-[#5B5875] px-1">
                            <span className="font-semibold text-[#25234A]">
                              {isVisitor ? "Visitor (Anonymous)" : msg.sender_name}
                            </span>
                            <span>•</span>
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>

                          <div
                            className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${isVisitor
                                ? "bg-[#EDE7F6] text-[#25234A] rounded-bl-xs border border-[#D4C7E8]"
                                : "bg-[#25234A] text-white rounded-br-xs shadow-xs"
                              }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    })}

                    {/* Real-time Visitor Typing Indicator */}
                    {visitorTyping.isTyping && (
                      <div className="flex items-center gap-2 text-sm text-[#5B5875] italic py-1 px-2 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span>Visitor is typing a response...</span>
                      </div>
                    )}

                  </div>

                  {/* Supporter Reply Composer */}
                  <div className="p-4 bg-[#FAF9F7] border-t border-[#E8E5DF]">
                    {activeTicket.status !== "closed" ? (
                      <form onSubmit={handleSendReply} className="space-y-2">
                        {/* Supporter Helper Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setShowCannedMenu(!showCannedMenu)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 shadow-2xs ${
                                showCannedMenu
                                  ? "bg-[#25234A] text-white border-[#25234A]"
                                  : "bg-white border-[#D4C7E8] text-[#25234A] hover:bg-[#EDE7F6]"
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              <span>Empathetic Templates</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const crisisText = "ඔබට හෝ ඔබ දන්නා කෙනෙකුට හදිසි මානසික සුව සහනයක් අවශ්‍ය නම්, කරුණාකර ජාතික මානසික සෞඛ්‍ය උපකාරක අංකය 1926 (නොමිලේ, 24/7) හෝ සුමිත්‍රයෝ 011 269 2909 අමතන්න. ඔබගේ ජීවිතය අපට වටිනවා.";
                                setReplyText((prev) => prev ? `${prev}\n\n${crisisText}` : crisisText);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 flex items-center gap-1.5 transition-colors shadow-2xs"
                              title="Insert 1-Click 1926 and Sumithrayo Crisis Referral"
                            >
                              <LifeBuoy className="w-3.5 h-3.5 text-rose-600" />
                              <span>1-Click 1926 Referral</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSupporterSinglishAuto(!supporterSinglishAuto)}
                              className={`px-2 py-0.5 rounded-md text-xs font-medium border transition-colors ${
                                supporterSinglishAuto
                                  ? "bg-purple-100 border-purple-300 text-purple-900"
                                  : "bg-white border-[#E8E5DF] text-[#5B5875]"
                              }`}
                            >
                              සිංහල Auto: {supporterSinglishAuto ? "On" : "Off"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (replyText) setReplyText(transliterateSinglishToSinhala(replyText));
                              }}
                              className="px-2 py-0.5 rounded-md text-xs font-medium bg-white border border-[#E8E5DF] text-[#5B5875] hover:bg-[#EDE7F6] hover:text-[#25234A]"
                            >
                              Convert to Sinhala
                            </button>
                          </div>
                        </div>

                        {/* Canned Responses Dropdown Palette */}
                        {showCannedMenu && (
                          <div className="p-3 bg-white border border-[#D4C7E8] rounded-2xl shadow-sm space-y-2 mb-2 max-h-60 overflow-y-auto">
                            <div className="flex items-center justify-between text-xs font-bold text-[#25234A] border-b border-[#E8E5DF] pb-1">
                              <span>Choose Compassionate Response:</span>
                              <button
                                type="button"
                                onClick={() => setShowCannedMenu(false)}
                                className="text-[#5B5875] hover:text-rose-600 font-bold"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="space-y-1.5">
                              {CANNED_RESPONSES.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setReplyText((prev) => prev ? `${prev}\n\n${item.sinhalaText}` : item.sinhalaText);
                                    setShowCannedMenu(false);
                                  }}
                                  className="w-full text-left p-2.5 rounded-xl border border-[#E8E5DF]/60 bg-[#FAF9F7] hover:bg-[#EDE7F6] hover:border-[#D4C7E8] transition-colors text-xs text-[#25234A]"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-[#25234A]">{item.title}</span>
                                    <span className="text-[10px] text-[#5B5875] bg-white px-2 py-0.5 rounded-full border border-[#E8E5DF]">{item.categoryLabel}</span>
                                  </div>
                                  <div className="text-[#5B5875] text-[11px] mt-1 truncate">{item.sinhalaText}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-end gap-2">
                          <textarea
                            rows={3}
                            maxLength={3000}
                            disabled={isSendingReply}
                            aria-label="Your reply to the visitor"
                            value={replyText}
                            onChange={handleReplyChange}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                                e.preventDefault();
                                handleSendReply(e);
                              }
                            }}
                            placeholder="Type an empathetic, thoughtful response in Sinhala, English, or Singlish... Press Enter to send"
                            className="flex-1 p-3.5 rounded-2xl border border-[#E8E5DF] text-sm resize-none bg-white focus:border-[#25234A]"
                          />
                          <button
                            type="submit"
                            disabled={!replyText.trim() || isSendingReply}
                            className="p-3.5 rounded-2xl bg-[#25234A] text-white hover:bg-[#383466] disabled:opacity-40 transition-colors shrink-0 shadow-sm"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-sm text-[#5B5875] px-1">
                          <span>Encrypted at rest (AES-256-GCM)</span>
                          <span>Replying as: {currentUser.display_name}</span>
                        </div>
                      </form>
                    ) : (
                      <div className="text-center py-2 text-sm text-slate-600">
                        This conversation has been closed.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-[#5B5875] space-y-3">
                  <div className="w-14 h-14 rounded-3xl bg-[#EDE7F6] text-[#25234A] flex items-center justify-center">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-[#25234A]">Select a Conversation to View</h3>
                  <p className="text-sm max-w-sm leading-relaxed">
                    Choose any waiting or assigned ticket from the queue on the left to begin listening and communicating with the visitor.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: VOLUNTEER GUIDELINES & TRAINING MANUAL                  */}
        {/* ============================================================== */}
        {activeTab === "guidelines" && (
          <div className="max-w-4xl mx-auto w-full space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
              <span className="text-sm font-bold uppercase tracking-wider text-[#383466] bg-[#EDE7F6] px-3.5 py-1 rounded-full">
                Core Supporter Manual
              </span>
              <h2 className="text-3xl font-bold text-[#25234A]">Volunteer Principles & Safeguarding Standards</h2>
              <p className="text-sm text-[#5B5875]">
                Mandatory operational guidelines for every human supporter on Hithata Idak.
              </p>
            </div>

            <div className="space-y-6">
              {/* Module 1 */}
              <div className="p-7 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-[#25234A] font-bold text-lg">
                  <Heart className="w-5 h-5 text-rose-600" />
                  <span>1. Empathetic Listening & Nonjudgmental Presence</span>
                </div>
                <p className="text-sm text-[#5B5875] leading-relaxed">
                  Your primary responsibility is to listen—not to diagnose, advise, preach, or &ldquo;fix&rdquo;. Reflect the feelings you hear. Validate that their pain is understandable given their circumstances. Never invalidate someone by comparing their suffering to others (&ldquo;others have it worse&rdquo;).
                </p>
              </div>

              {/* Module 2 */}
              <div className="p-7 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-[#25234A] font-bold text-lg">
                  <Shield className="w-5 h-5 text-[#383466]" />
                  <span>2. Respectful Boundaries & Supporter Anonymity</span>
                </div>
                <p className="text-sm text-[#5B5875] leading-relaxed">
                  Never share your personal phone numbers, home address, personal social media profiles, or financial details with visitors. Keep interactions strictly within this platform. If a visitor requests romantic connection, personal contact, or meetings, gently reiterate platform guidelines.
                </p>
              </div>

              {/* Module 3 */}
              <div className="p-7 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-[#25234A] font-bold text-lg">
                  <PhoneCall className="w-5 h-5 text-emerald-600" />
                  <span>3. Responding to Acute Crisis & Self-Harm Escalations</span>
                </div>
                <p className="text-sm text-[#5B5875] leading-relaxed">
                  If a visitor indicates immediate suicidal intent or active self-harm:
                  <br />
                  1. Stay calm and convey that their life and feelings matter to you.
                  <br />
                  2. Provide the verified National Mental Health Helpline: <strong>1926 (Sri Lanka, 24/7 Toll-Free)</strong> or Sumithrayo (011 269 2909).
                  <br />
                  3. Click the <strong>Flag for Priority / Safety</strong> button in your chat console to alert on-duty supervisors.
                </p>
              </div>

              {/* Module 4 */}
              <div className="p-7 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-[#25234A] font-bold text-lg">
                  <Lock className="w-5 h-5 text-[#25234A]" />
                  <span>4. Confidentiality & Sri Lankan PDPA Compliance</span>
                </div>
                <p className="text-sm text-[#5B5875] leading-relaxed">
                  Everything shared by visitors is strictly confidential. You are legally and ethically prohibited from copying, taking screenshots, or discussing conversation details outside supervisory debriefs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: PRIVACY-PRESERVING ANALYTICS & IMPACT (SUPERVISOR / ADMIN) */}
        {/* ============================================================== */}
        {activeTab === "analytics" && isSupervisorOrAdmin && (
          <div className="space-y-6 animate-fadeIn">
            <AnalyticsDashboard
              analytics={analytics}
              onRefresh={() => { void fetchTabData(); }}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: INCIDENT & MISCONDUCT REPORTS                           */}
        {/* ============================================================== */}
        {activeTab === "reports" && isSupervisorOrAdmin && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#25234A]">Safety & Misconduct Reports</h2>
                <p className="text-sm text-[#5B5875]">User reports received via the public Safety & Privacy page.</p>
              </div>
              <button
                type="button"
                onClick={() => { void fetchTabData(); }}
                className="px-3.5 py-1.5 rounded-xl border border-[#E8E5DF] bg-white text-sm font-semibold text-[#25234A] flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="space-y-4">
              {incidentReports.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#5B5875]">No incident reports on file.</div>
              ) : (
                incidentReports.map((report) => <IncidentReview key={report.id} report={report} onSaved={() => { void fetchTabData(); }} />)
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: PRIVACY / DATA DELETION QUEUE                           */}
        {/* ============================================================== */}
        {activeTab === "privacy" && isSupervisorOrAdmin && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#25234A]">Privacy & Data Deletion Requests</h2>
                <p className="text-sm text-[#5B5875]">User requests for immediate cryptographic shredding under PDPA standards.</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs">
              {privacyRequests.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#5B5875]">No pending deletion requests.</div>
              ) : (
                <div className="space-y-4">
                  {privacyRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl border border-[#E8E5DF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#25234A]">{req.ticket_ref}</span>
                          <span className={`text-sm font-bold px-2 py-0.5 rounded-full uppercase ${req.status === "pending" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
                            }`}>
                            {req.status}
                          </span>
                        </div>
                        <p className="text-sm text-[#5B5875] mt-1">
                          Requested: {new Date(req.created_at).toLocaleString()} • Type: {req.request_type}
                        </p>
                      </div>

                      {req.status === "pending" && currentUser.role === "admin" && (
                        <button
                          type="button"
                          onClick={() => handleProcessDeletion(req.ticket_id)}
                          disabled={Boolean(pendingAction)}
                          className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-bold flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{pendingAction === `delete:${req.ticket_id}` ? "Deleting…" : "Permanently delete"}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: VOLUNTEER ONBOARDING APPLICATIONS                       */}
        {/* ============================================================== */}
        {activeTab === "applications" && isSupervisorOrAdmin && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-[#25234A]">Volunteer Expressions of Interest</h2>
              <p className="text-sm text-[#5B5875]">Applications submitted via the public Our Story page.</p>
            </div>

            <div className="space-y-4">
              {applications.length === 0 ? (
                <div className="p-8 rounded-3xl bg-white border border-[#E8E5DF] text-center text-sm text-[#5B5875]">
                  No volunteer expressions of interest received yet.
                </div>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="p-6 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-[#25234A]">{app.full_name}</h3>
                        <p className="text-sm text-[#5B5875]">{app.email} • Phone: {app.phone || "Not provided"}</p>
                      </div>
                      <span className="text-sm font-bold px-3 py-1 rounded-full bg-[#EDE7F6] text-[#25234A] uppercase">
                        Status: {app.status}
                      </span>
                    </div>

                    <div className="text-sm text-[#25234A] bg-[#FAF9F7] p-3 rounded-xl space-y-2 border border-[#E8E5DF]/60">
                      <div>
                        <strong>Languages:</strong> {app.languages}
                      </div>
                      <div>
                        <strong>Motivation:</strong> {app.motivation}
                      </div>
                      <div>
                        <strong>Background:</strong> {app.background}
                      </div>
                    </div>
                    <ApplicationReview application={app} onSaved={() => { void fetchTabData(); }} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: VISITOR FEEDBACK                                         */}
        {/* ============================================================== */}
        {activeTab === "feedback" && isSupervisorOrAdmin && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-2xl font-bold">Visitor Feedback</h2><p className="mt-1 text-sm text-[#5B5875]">General feedback and voluntary conversation ratings.</p></div>
              <button type="button" onClick={() => { void fetchTabData(); void fetchTickets(); }} className="rounded-xl border border-[#E8E5DF] bg-white px-4 py-2.5 text-sm font-semibold">Refresh feedback</button>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="space-y-3"><h3 className="text-lg font-bold">Messages from visitors</h3>
                {userFeedback.length === 0 ? <p className="rounded-2xl border border-[#E8E5DF] bg-white p-6 text-sm text-[#5B5875]">No general feedback received yet.</p> : userFeedback.map((feedback) => <article key={feedback.id} className="rounded-2xl border border-[#E8E5DF] bg-white p-5">
                  <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-semibold capitalize">{feedback.feedback_type.replaceAll("_", " ")}</span><span className="text-[#5B5875]">{new Date(feedback.created_at).toLocaleString()}</span></div>
                  {feedback.rating != null && <p className="mt-2 text-sm font-semibold">Rating: {feedback.rating}/5</p>}
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{feedback.message}</p>
                </article>)}
              </section>
              <section className="space-y-3"><h3 className="text-lg font-bold">Conversation feedback</h3>
                {tickets.filter((ticket) => ticket.feedback_rating != null || ticket.feedback_text).length === 0 ? <p className="rounded-2xl border border-[#E8E5DF] bg-white p-6 text-sm text-[#5B5875]">No conversation feedback received yet.</p> : tickets.filter((ticket) => ticket.feedback_rating != null || ticket.feedback_text).map((ticket) => <article key={ticket.id} className="rounded-2xl border border-[#E8E5DF] bg-white p-5">
                  <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-mono font-bold">{ticket.ticket_ref}</span>{ticket.feedback_rating != null && <span className="font-semibold">Felt heard: {ticket.feedback_rating}/5</span>}</div>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{ticket.feedback_text || "A rating was shared without a written comment."}</p>
                </article>)}
              </section>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 6: VOLUNTEER TEAM ROSTER (ADMIN ONLY)                      */}
        {/* ============================================================== */}
        {activeTab === "team" && currentUser.role === "admin" && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-[#25234A]">Volunteer Supporter Accounts</h2>
              <p className="text-sm text-[#5B5875]">Manage active supporters, supervisors, and administrative credentials.</p>
            </div>

            {/* Create New Volunteer Account */}
            <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[#25234A] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#25234A]" />
                <span>Create Approved Supporter Account</span>
              </h3>

              {newVolMsg && (
                <div className="p-3 rounded-xl bg-blue-50 text-blue-900 text-sm">
                  {newVolMsg}
                </div>
              )}

              <form onSubmit={handleCreateVolunteer} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="email"
                  aria-label="New volunteer email"
                  required
                  value={newVolData.email}
                  onChange={(e) => setNewVolData({ ...newVolData, email: e.target.value })}
                  placeholder="supporter@hithataidak.lk"
                  className="px-3.5 py-2.5 rounded-xl border border-[#E8E5DF] text-sm"
                />
                <input
                  type="text"
                  aria-label="New volunteer display name"
                  required
                  value={newVolData.displayName}
                  onChange={(e) => setNewVolData({ ...newVolData, displayName: e.target.value })}
                  placeholder="Display Name (e.g. Supporter Kasun)"
                  className="px-3.5 py-2.5 rounded-xl border border-[#E8E5DF] text-sm"
                />
                <select
                  aria-label="New volunteer role"
                  value={newVolData.role}
                  onChange={(e) => setNewVolData({ ...newVolData, role: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl border border-[#E8E5DF] text-sm bg-white"
                >
                  <option value="supporter">Supporter (Volunteer)</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrator</option>
                </select>
                <input
                  type="password"
                  aria-label="New volunteer password"
                  minLength={8}
                  required
                  value={newVolData.password}
                  onChange={(e) => setNewVolData({ ...newVolData, password: e.target.value })}
                  placeholder="Password (min 8 chars)"
                  className="px-3.5 py-2.5 rounded-xl border border-[#E8E5DF] text-sm"
                />
                <div className="sm:col-span-4 text-right">
                  <button
                    type="submit"
                    disabled={Boolean(pendingAction)}
                    className="px-6 py-2.5 rounded-xl bg-[#25234A] text-white text-sm font-bold hover:bg-[#383466]"
                  >
                    {pendingAction === "create-volunteer" ? "Creating…" : "Add Supporter to Roster"}
                  </button>
                </div>
              </form>
            </div>

            {/* Team Roster Table */}
            <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs overflow-x-auto">
              <table className="w-full text-left text-sm text-[#25234A]">
                <thead>
                  <tr className="border-b border-[#E8E5DF] text-[#5B5875] uppercase text-sm">
                    <th className="py-3 px-2">Display Name</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Role</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Joined</th>
                    <th className="py-3 px-2">Manage access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E5DF]/60">
                  {volunteers.map((v) => (
                    <tr key={v.id}>
                      <td className="py-3 px-2 font-bold">{v.display_name}</td>
                      <td className="py-3 px-2">{v.email}</td>
                      <td className="py-3 px-2 capitalize font-semibold">{v.role}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-sm font-bold ${v.is_active && v.is_approved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
                          {!v.is_active ? "Suspended" : !v.is_approved ? "Approval pending" : "Active & approved"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-[#5B5875]">{new Date(v.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-2"><VolunteerStatusControls volunteer={v} currentUserId={currentUser.id} onSaved={() => { void fetchTabData(); }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: PLATFORM SETTINGS & AUDIT LOGS                          */}
        {/* ============================================================== */}
        {activeTab === "settings" && currentUser.role === "admin" && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-[#25234A]">Platform Settings & Audit Logs</h2>
              <p className="text-sm text-[#5B5875]">Configure operating modes and inspect privacy-preserving administrative actions.</p>
            </div>

            {/* Settings Card */}
            <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-[#25234A]">Operational Configurations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <label htmlFor="service-status" className="block font-bold text-[#25234A] mb-1">Service Status Override</label>
                  <select
                    id="service-status"
                    value={platformSettings.serviceStatus}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, serviceStatus: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E8E5DF] bg-[#FAF9F7]"
                  >
                    <option value="online">Online (Dynamic Supporter Presence)</option>
                    <option value="offline">Offline (visitors can still leave a message)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="operating-hours" className="block font-bold text-[#25234A] mb-1">Operating Hours Notice</label>
                  <input
                    id="operating-hours"
                    type="text"
                    required
                    maxLength={100}
                    value={platformSettings.operatingHours}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, operatingHours: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E8E5DF] bg-[#FAF9F7]"
                  />
                </div>
                <div>
                  <label htmlFor="pilot-mode" className="mb-1 block font-bold">Pilot notice</label>
                  <select id="pilot-mode" value={platformSettings.pilotMode} onChange={(event) => setPlatformSettings({ ...platformSettings, pilotMode: event.target.value })} className="w-full rounded-xl border border-[#E8E5DF] bg-[#FAF9F7] p-2.5">
                    <option value="true">Show pilot phase notice</option><option value="false">Hide pilot phase notice</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="retention-days" className="mb-1 block font-bold">Retention policy (days)</label>
                  <input id="retention-days" type="number" min={1} max={365} required value={platformSettings.retentionDays} onChange={(event) => setPlatformSettings({ ...platformSettings, retentionDays: event.target.value })} className="w-full rounded-xl border border-[#E8E5DF] bg-[#FAF9F7] p-2.5" />
                  <p className="mt-2 text-sm text-[#5B5875]">Saves the policy for the team. Scheduled automatic deletion is not configured; use Privacy / Deletion Requests to process requests.</p>
                </div>
              </div>
              <button type="submit" disabled={Boolean(pendingAction)} className="rounded-xl bg-[#25234A] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{pendingAction === "settings" ? "Saving…" : "Save settings"}</button>
            </form>

            {/* Automated 30-Day Data Retention Shredder (PDPA) */}
            <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#25234A] flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-rose-600" />
                    <span>Automated 30-Day Data Shredder (PDPA Compliance)</span>
                  </h3>
                  <p className="text-sm text-[#5B5875] mt-1">
                    Permanently purges closed conversations older than 30 days along with associated messages. Also configured for recurring server execution via <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">/api/cron/cleanup</code>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunCleanup}
                  disabled={isCleaningData}
                  className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-sm font-bold flex items-center gap-2 shrink-0 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isCleaningData ? "Shredding Data..." : "Run 30-Day Shredder Now"}</span>
                </button>
              </div>
              {cleanupResult && (
                <div className={`p-3 rounded-xl text-sm ${cleanupResult.includes("error") ? "bg-red-50 text-red-800 border border-red-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"}`}>
                  {cleanupResult}
                </div>
              )}
            </div>

            {/* Audit Logs Table */}
            <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#25234A]">Administrative Audit Trail</h3>
                <span className="text-sm text-[#5B5875]">Zero private conversation content is ever recorded in audit trails</span>
              </div>

              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left text-sm text-[#25234A]">
                  <thead>
                    <tr className="border-b border-[#E8E5DF] text-[#5B5875] text-sm uppercase">
                      <th className="py-2.5 px-2">Action</th>
                      <th className="py-2.5 px-2">Target Type</th>
                      <th className="py-2.5 px-2">Target ID</th>
                      <th className="py-2.5 px-2">Details</th>
                      <th className="py-2.5 px-2">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E5DF]/50">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#FAF9F7]">
                        <td className="py-2 px-2 font-mono font-bold text-[#25234A]">{log.action}</td>
                        <td className="py-2 px-2 capitalize">{log.target_type}</td>
                        <td className="py-2 px-2 font-mono text-sm">{log.target_id}</td>
                        <td className="py-2 px-2 text-[#5B5875] max-w-xs truncate">{log.details_safe}</td>
                        <td className="py-2 px-2 text-[#5B5875] whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
