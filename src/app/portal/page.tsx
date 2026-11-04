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
} from "lucide-react";
import {
  Volunteer,
  SupportTicket,
  ConversationMessage,
  PrivacyRequest,
  IncidentReport,
  VolunteerApplication,
  AdminAuditEvent,
} from "@/lib/types";

function requestSignal(signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(12000);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
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
  const nearBottomRef = useRef(true);
  const queueLoadingRef = useRef<AbortSignal | null>(null);
  const ticketLoadingRef = useRef<AbortSignal | null>(null);
  const sendingReplyRef = useRef(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Authenticate Supporter Session
  const checkAuth = useCallback((signal?: AbortSignal) => {
    return fetch("/api/portal/auth/me", { cache: "no-store", signal: requestSignal(signal) }).then(async (res) => {
      if (signal?.aborted) return;
      if (res.status === 401) {
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
    return fetch("/api/portal/tickets", { cache: "no-store", signal: loadingSignal }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (!signal?.aborted) setTickets(data.tickets);
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
    return fetch(`/api/portal/tickets/${selectedTicketRef}`, { cache: "no-store", signal: loadingSignal }).then(async (res) => {
      if (signal?.aborted || selectedTicketRefRef.current !== selectedTicketRef) return;
      if (res.ok) {
        const data = await res.json();
        if (signal?.aborted || selectedTicketRefRef.current !== selectedTicketRef) return;
        setActiveTicket(data.ticket);
        setActiveMessages((previous) => data.messages.length >= previous.length ? data.messages : previous);
        setVisitorTyping(data.typing || { isTyping: false, name: "" });
        setChatError("");
      } else {
        setChatError("This conversation could not be loaded. Check your access or choose another conversation.");
      }
    }).catch((error: unknown) => {
      if (!signal?.aborted && selectedTicketRefRef.current === selectedTicketRef) {
        console.error("Poll active ticket error", error);
        setChatError("Connection interrupted. Retrying automatically; your draft is safe.");
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
    const options = { cache: "no-store" as const, signal: requestSignal(signal) };
    const load = <T,>(path: string, apply: (data: T) => void) => fetch(path, options)
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load this section. Please refresh.");
        const data = await response.json() as T;
        if (!signal?.aborted) apply(data);
      }).catch((error: unknown) => {
        if (!signal?.aborted) setChatError(error instanceof Error ? error.message : "Unable to load this section.");
      });
    if (activeTab === "privacy") return load<{ requests: PrivacyRequest[] }>("/api/portal/admin/privacy-requests", (data) => setPrivacyRequests(data.requests));
    if (activeTab === "reports") return load<{ reports: IncidentReport[] }>("/api/portal/admin/incident-reports", (data) => setIncidentReports(data.reports));
    if (activeTab === "team") return load<{ volunteers: Volunteer[] }>("/api/portal/admin/volunteers", (data) => setVolunteers(data.volunteers));
    if (activeTab === "applications") return load<{ applications: VolunteerApplication[] }>("/api/portal/admin/applications", (data) => setApplications(data.applications));
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
    setMyAvailability(newStatus);
    try {
      await fetch("/api/portal/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Availability update error", err);
    }
  };

  // Logout
  const handleLogout = async () => {
    await fetch("/api/portal/auth/logout", { method: "POST" });
    router.push("/portal/login");
  };

  // Supporter Typing Ping
  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(e.target.value);
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

  // Assign Ticket to Self
  const handleAssignToMe = async () => {
    if (!activeTicket) return;
    try {
      await fetch(`/api/portal/tickets/${activeTicket.ticket_ref}/assign`, { method: "POST" });
      pollActiveTicket();
      fetchTickets();
    } catch (err) {
      console.error("Assign error", err);
    }
  };

  // Unassign Ticket (Return to Queue)
  const handleReturnToQueue = async () => {
    if (!activeTicket) return;
    try {
      await fetch(`/api/portal/tickets/${activeTicket.ticket_ref}/unassign`, { method: "POST" });
      pollActiveTicket();
      fetchTickets();
    } catch (err) {
      console.error("Unassign error", err);
    }
  };

  // Close Ticket
  const handleCloseTicket = async () => {
    if (!activeTicket) return;
    const confirm = window.confirm("Are you sure you want to close this conversation?");
    if (!confirm) return;

    try {
      await fetch(`/api/portal/tickets/${activeTicket.ticket_ref}/close`, { method: "POST" });
      pollActiveTicket();
      fetchTickets();
    } catch (err) {
      console.error("Close error", err);
    }
  };

  // Flag Ticket
  const handleTogglePriority = async () => {
    if (!activeTicket) return;
    const newPriority = !activeTicket.is_priority_review;
    try {
      await fetch(`/api/portal/tickets/${activeTicket.ticket_ref}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPriority: newPriority }),
      });
      pollActiveTicket();
      fetchTickets();
    } catch (err) {
      console.error("Priority toggle error", err);
    }
  };

  const handleToggleSafety = async () => {
    if (!activeTicket) return;
    const newSafety = !activeTicket.is_safety_flagged;
    const notes = prompt("Enter safety assessment or supervisor handover notes:") || undefined;
    try {
      await fetch(`/api/portal/tickets/${activeTicket.ticket_ref}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSafetyFlagged: newSafety, notes }),
      });
      pollActiveTicket();
      fetchTickets();
    } catch (err) {
      console.error("Safety flag error", err);
    }
  };

  // Process Privacy Deletion
  const handleProcessDeletion = async (ticketId: string) => {
    const confirm = window.confirm("Execute permanent cryptographic shredding of all messages and recovery credentials for this conversation?");
    if (!confirm) return;

    try {
      const res = await fetch(`/api/portal/admin/privacy-requests/${ticketId}/process`, { method: "POST" });
      if (res.ok) {
        alert("Conversation messages and credentials permanently shredded.");
        fetchTabData();
        fetchTickets();
      }
    } catch (err) {
      console.error("Shredding error", err);
    }
  };

  // Create Volunteer Account
  const handleCreateVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewVolMsg("");
    try {
      const res = await fetch("/api/portal/admin/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVolData),
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
    }
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
    <div className="flex-1 flex flex-col bg-[#FAF9F7]">
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
                <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#534D88] text-[#B8D8C2]">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-[#FAF9F7]/70">Supporter ID: {currentUser.id}</p>
            </div>
          </div>

          {/* Availability Control & Actions */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Availability Pill Selector */}
            <div className="flex items-center p-1 rounded-xl bg-[#1A1838] border border-[#383466] text-xs">
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

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl bg-[#383466] hover:bg-rose-900/60 text-white text-xs font-semibold border border-[#534D88] flex items-center gap-1.5"
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
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 ${activeTab === "queue"
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
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 ${activeTab === "guidelines"
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
                onClick={() => setActiveTab("reports")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 ${activeTab === "reports"
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
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 ${activeTab === "privacy"
                    ? "bg-[#25234A] text-white shadow-xs"
                    : "text-[#5B5875] hover:bg-[#FAF9F7]"
                  }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Privacy / Deletion Requests</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("applications")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 ${activeTab === "applications"
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
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 ${activeTab === "team"
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
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 ${activeTab === "settings"
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
        {/* ============================================================== */}
        {/* TAB 1: CONVERSATIONS QUEUE & CHAT CONSOLE                      */}
        {/* ============================================================== */}
        {activeTab === "queue" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
            {/* Left Column: Tickets Queue List (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Filter Pills */}
              <div className="p-1.5 rounded-2xl bg-white border border-[#E8E5DF] flex items-center justify-between text-xs font-semibold">
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
                  <div className="p-8 rounded-3xl bg-white border border-[#E8E5DF] text-center text-xs text-[#5B5875]">
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
                          <span className="text-xs font-mono font-bold text-[#25234A]">
                            {t.ticket_ref}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === "waiting"
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

                        <div className="text-xs font-semibold text-[#25234A] truncate">
                          {t.topic || "Open Conversation"}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#5B5875] mt-2">
                          <span className="capitalize">Lang: {t.preferred_language === "si" ? "Sinhala" : "English"}</span>
                          <span>
                            {t.assigned_volunteer_name ? `With: ${t.assigned_volunteer_name}` : "Unassigned"}
                          </span>
                        </div>

                        {Boolean(t.is_priority_review || t.is_safety_flagged) && (
                          <div className="mt-2 flex items-center gap-1.5">
                            {Boolean(t.is_priority_review) && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                Priority Review
                              </span>
                            )}
                            {Boolean(t.is_safety_flagged) && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-100 text-red-800">
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
              {chatError && <p role="alert" className="m-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{chatError}</p>}
              {selectedTicketRef && activeTicket ? (
                <>
                  {/* Console Header */}
                  <div className="p-4 sm:px-6 bg-[#FAF9F7] border-b border-[#E8E5DF] flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-[#25234A] font-mono">
                          {activeTicket.ticket_ref}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-[#EDE7F6] text-[#25234A] font-medium">
                          {activeTicket.preferred_language === "si" ? "සිංහල" : "English"}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-white border border-[#E8E5DF] text-[#5B5875]">
                          {activeTicket.topic || "General"}
                        </span>
                      </div>
                      <p className="text-xs text-[#5B5875] mt-0.5">
                        Assigned to: {activeTicket.assigned_volunteer_name || "Queue"}
                      </p>
                    </div>

                    {/* Console Actions */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {activeTicket.assigned_volunteer_id !== currentUser.id ? (
                        <button
                          type="button"
                          onClick={handleAssignToMe}
                          className="px-3 py-1.5 rounded-xl font-bold bg-[#25234A] text-white hover:bg-[#383466]"
                        >
                          Assign to Me
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleReturnToQueue}
                          className="px-3 py-1.5 rounded-xl font-medium bg-[#EDE7F6] text-[#25234A] hover:bg-[#D4C7E8]"
                        >
                          Return to Queue
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleTogglePriority}
                        className={`p-2 rounded-xl border ${activeTicket.is_priority_review ? "bg-amber-100 border-amber-300 text-amber-900" : "bg-white text-[#5B5875]"
                          }`}
                        title="Flag for Priority / Supervisor Review"
                      >
                        <Flag className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleSafety}
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
                          className="px-3 py-1.5 rounded-xl font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                        >
                          Close Chat
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Optional Empathetic Prompts Drawer */}
                  {showGuidanceDrawer && (
                    <div className="p-4 bg-[#EDE7F6]/60 border-b border-[#D4C7E8] text-xs space-y-2">
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
                            <div className="max-w-md px-3.5 py-1.5 rounded-full bg-[#EDE7F6]/80 text-[11px] text-[#5B5875] text-center border border-[#D4C7E8]">
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
                          <div className="flex items-center gap-2 mb-1 text-[11px] text-[#5B5875] px-1">
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
                      <div className="flex items-center gap-2 text-xs text-[#5B5875] italic py-1 px-2 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span>Visitor is typing a response...</span>
                      </div>
                    )}

                  </div>

                  {/* Supporter Reply Composer */}
                  <div className="p-4 bg-[#FAF9F7] border-t border-[#E8E5DF]">
                    {activeTicket.status !== "closed" ? (
                      <form onSubmit={handleSendReply} className="space-y-2">
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
                        <div className="flex items-center justify-between text-[11px] text-[#5B5875] px-1">
                          <span>Encrypted at rest (AES-256-GCM)</span>
                          <span>Replying as: {currentUser.display_name}</span>
                        </div>
                      </form>
                    ) : (
                      <div className="text-center py-2 text-xs text-slate-600">
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
                  <p className="text-xs max-w-sm leading-relaxed">
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
              <span className="text-xs font-bold uppercase tracking-wider text-[#383466] bg-[#EDE7F6] px-3.5 py-1 rounded-full">
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
                <p className="text-xs sm:text-sm text-[#5B5875] leading-relaxed">
                  Your primary responsibility is to listen—not to diagnose, advise, preach, or &ldquo;fix&rdquo;. Reflect the feelings you hear. Validate that their pain is understandable given their circumstances. Never invalidate someone by comparing their suffering to others (&ldquo;others have it worse&rdquo;).
                </p>
              </div>

              {/* Module 2 */}
              <div className="p-7 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-[#25234A] font-bold text-lg">
                  <Shield className="w-5 h-5 text-[#383466]" />
                  <span>2. Respectful Boundaries & Supporter Anonymity</span>
                </div>
                <p className="text-xs sm:text-sm text-[#5B5875] leading-relaxed">
                  Never share your personal phone numbers, home address, personal social media profiles, or financial details with visitors. Keep interactions strictly within this platform. If a visitor requests romantic connection, personal contact, or meetings, gently reiterate platform guidelines.
                </p>
              </div>

              {/* Module 3 */}
              <div className="p-7 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-[#25234A] font-bold text-lg">
                  <PhoneCall className="w-5 h-5 text-emerald-600" />
                  <span>3. Responding to Acute Crisis & Self-Harm Escalations</span>
                </div>
                <p className="text-xs sm:text-sm text-[#5B5875] leading-relaxed">
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
                <p className="text-xs sm:text-sm text-[#5B5875] leading-relaxed">
                  Everything shared by visitors is strictly confidential. You are legally and ethically prohibited from copying, taking screenshots, or discussing conversation details outside supervisory debriefs.
                </p>
              </div>
            </div>
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
                <p className="text-xs text-[#5B5875]">User reports received via the public Safety & Privacy page.</p>
              </div>
              <button
                type="button"
                onClick={() => { void fetchTabData(); }}
                className="px-3.5 py-1.5 rounded-xl border border-[#E8E5DF] bg-white text-xs font-semibold text-[#25234A] flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs overflow-x-auto">
              {incidentReports.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#5B5875]">No incident reports on file.</div>
              ) : (
                <table className="w-full text-left text-xs text-[#25234A]">
                  <thead>
                    <tr className="border-b border-[#E8E5DF] text-[#5B5875] uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-2">Type</th>
                      <th className="py-3 px-2">Ticket Ref</th>
                      <th className="py-3 px-2">Description</th>
                      <th className="py-3 px-2">Email</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E5DF]/60">
                    {incidentReports.map((r) => (
                      <tr key={r.id} className="hover:bg-[#FAF9F7]">
                        <td className="py-3 px-2 font-bold capitalize">{r.report_type.replace("_", " ")}</td>
                        <td className="py-3 px-2 font-mono font-bold">{r.ticket_ref || "N/A"}</td>
                        <td className="py-3 px-2 max-w-xs truncate">{r.description}</td>
                        <td className="py-3 px-2">{r.contact_email || "Anonymous"}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${r.status === "open" ? "bg-red-100 text-red-900" : r.status === "under_review" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
                            }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-[#5B5875]">{new Date(r.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                <p className="text-xs text-[#5B5875]">User requests for immediate cryptographic shredding under PDPA standards.</p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs">
              {privacyRequests.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#5B5875]">No pending deletion requests.</div>
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
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${req.status === "pending" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
                            }`}>
                            {req.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#5B5875] mt-1">
                          Requested: {new Date(req.created_at).toLocaleString()} • Type: {req.request_type}
                        </p>
                      </div>

                      {req.status === "pending" && currentUser.role === "admin" && (
                        <button
                          type="button"
                          onClick={() => handleProcessDeletion(req.ticket_id)}
                          className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Execute Shredding</span>
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
              <p className="text-xs text-[#5B5875]">Applications submitted via the public Our Story page.</p>
            </div>

            <div className="space-y-4">
              {applications.length === 0 ? (
                <div className="p-8 rounded-3xl bg-white border border-[#E8E5DF] text-center text-xs text-[#5B5875]">
                  No volunteer expressions of interest received yet.
                </div>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="p-6 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-[#25234A]">{app.full_name}</h3>
                        <p className="text-xs text-[#5B5875]">{app.email} • Phone: {app.phone || "Not provided"}</p>
                      </div>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EDE7F6] text-[#25234A] uppercase">
                        Status: {app.status}
                      </span>
                    </div>

                    <div className="text-xs text-[#25234A] bg-[#FAF9F7] p-3 rounded-xl space-y-2 border border-[#E8E5DF]/60">
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
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: VOLUNTEER TEAM ROSTER (ADMIN ONLY)                      */}
        {/* ============================================================== */}
        {activeTab === "team" && currentUser.role === "admin" && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-[#25234A]">Volunteer Supporter Accounts</h2>
              <p className="text-xs text-[#5B5875]">Manage active supporters, supervisors, and administrative credentials.</p>
            </div>

            {/* Create New Volunteer Account */}
            <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[#25234A] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#25234A]" />
                <span>Create Approved Supporter Account</span>
              </h3>

              {newVolMsg && (
                <div className="p-3 rounded-xl bg-blue-50 text-blue-900 text-xs">
                  {newVolMsg}
                </div>
              )}

              <form onSubmit={handleCreateVolunteer} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="email"
                  required
                  value={newVolData.email}
                  onChange={(e) => setNewVolData({ ...newVolData, email: e.target.value })}
                  placeholder="supporter@hithataidak.lk"
                  className="px-3.5 py-2.5 rounded-xl border border-[#E8E5DF] text-xs sm:text-sm"
                />
                <input
                  type="text"
                  required
                  value={newVolData.displayName}
                  onChange={(e) => setNewVolData({ ...newVolData, displayName: e.target.value })}
                  placeholder="Display Name (e.g. Supporter Kasun)"
                  className="px-3.5 py-2.5 rounded-xl border border-[#E8E5DF] text-xs sm:text-sm"
                />
                <select
                  value={newVolData.role}
                  onChange={(e) => setNewVolData({ ...newVolData, role: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl border border-[#E8E5DF] text-xs sm:text-sm bg-white"
                >
                  <option value="supporter">Supporter (Volunteer)</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrator</option>
                </select>
                <input
                  type="password"
                  required
                  value={newVolData.password}
                  onChange={(e) => setNewVolData({ ...newVolData, password: e.target.value })}
                  placeholder="Password (min 8 chars)"
                  className="px-3.5 py-2.5 rounded-xl border border-[#E8E5DF] text-xs sm:text-sm"
                />
                <div className="sm:col-span-4 text-right">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#25234A] text-white text-xs font-bold hover:bg-[#383466]"
                  >
                    Add Supporter to Roster
                  </button>
                </div>
              </form>
            </div>

            {/* Team Roster Table */}
            <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs overflow-x-auto">
              <table className="w-full text-left text-xs text-[#25234A]">
                <thead>
                  <tr className="border-b border-[#E8E5DF] text-[#5B5875] uppercase text-[11px]">
                    <th className="py-3 px-2">Display Name</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Role</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E5DF]/60">
                  {volunteers.map((v) => (
                    <tr key={v.id}>
                      <td className="py-3 px-2 font-bold">{v.display_name}</td>
                      <td className="py-3 px-2">{v.email}</td>
                      <td className="py-3 px-2 capitalize font-semibold">{v.role}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active & Approved
                        </span>
                      </td>
                      <td className="py-3 px-2 text-[#5B5875]">{new Date(v.created_at).toLocaleDateString()}</td>
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
              <p className="text-xs text-[#5B5875]">Configure operating modes and inspect privacy-preserving administrative actions.</p>
            </div>

            {/* Settings Card */}
            <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[#25234A]">Operational Configurations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-[#25234A] mb-1">Service Status Override</label>
                  <select
                    value={platformSettings.serviceStatus}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setPlatformSettings({ ...platformSettings, serviceStatus: val });
                      await fetch("/api/portal/admin/settings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ serviceStatus: val }),
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border border-[#E8E5DF] bg-[#FAF9F7]"
                  >
                    <option value="online">Online (Dynamic Supporter Presence)</option>
                    <option value="offline">Offline (Emergency Banner Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#25234A] mb-1">Operating Hours Notice</label>
                  <input
                    type="text"
                    value={platformSettings.operatingHours}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, operatingHours: e.target.value })}
                    onBlur={async () => {
                      await fetch("/api/portal/admin/settings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ operatingHours: platformSettings.operatingHours }),
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border border-[#E8E5DF] bg-[#FAF9F7]"
                  />
                </div>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#25234A]">Administrative Audit Trail</h3>
                <span className="text-[11px] text-[#5B5875]">Zero private conversation content is ever recorded in audit trails</span>
              </div>

              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left text-xs text-[#25234A]">
                  <thead>
                    <tr className="border-b border-[#E8E5DF] text-[#5B5875] text-[11px] uppercase">
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
                        <td className="py-2 px-2 font-mono text-[11px]">{log.target_id}</td>
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
