"use client";

import { useState, useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import {
  HeartHandshake,
  Send,
  Shield,
  KeyRound,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Trash2,
  RefreshCw,
  Heart,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { SupportTicket, ConversationMessage, SystemAvailability } from "@/lib/types";
import { conversationTopics } from "@/lib/topics";
import { getWhatsAppHref } from "@/lib/site-config";

const SESSION_KEY = "hid-chat-session-v2";
type ChatSession = { reference: string; token: string };
type ConversationResponse = { ticket: SupportTicket; messages: ConversationMessage[]; typing?: { isTyping: boolean; name: string } };

function readSession(): ChatSession | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    return value && typeof value.reference === "string" && typeof value.token === "string" ? value : null;
  } catch { return null; }
}
function saveSession(value: ChatSession | null) {
  try { if (value) sessionStorage.setItem(SESSION_KEY, JSON.stringify(value)); else sessionStorage.removeItem(SESSION_KEY); }
  catch { /* Chat still works through its HttpOnly cookie when browser storage is blocked. */ }
  window.dispatchEvent(new Event("hid-chat-session-change"));
}
function subscribeSession(callback: () => void) {
  window.addEventListener("hid-chat-session-change", callback);
  return () => window.removeEventListener("hid-chat-session-change", callback);
}
const hasBrowserSession = () => Boolean(readSession());
const hasServerSession = () => false;
class ChatRequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
async function requestJson<T>(url: string, options: RequestInit = {}, signal?: AbortSignal): Promise<T> {
  const headers = new Headers(options.headers);
  const session = readSession();
  if (session) headers.set("x-visitor-session", session.token);
  const response = await fetch(url, { ...options, headers, cache: "no-store", signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ChatRequestError(data?.error || "That didn’t go through. Please try again.", response.status);
  if (!data) throw new Error("Invalid server response");
  return data as T;
}
function errorMessage(error: unknown) {
  if (error instanceof ChatRequestError) return error.message;
  return "We couldn’t connect. Check your internet and try again.";
}
function mergeMessages(previous: ConversationMessage[], incoming: ConversationMessage[]) {
  const byId = new Map(previous.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));
  const merged = [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return merged.length === previous.length && merged.every((message, index) => message.id === previous[index].id && message.content === previous[index].content) ? previous : merged;
}

function ChatModal({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={dialogRef} aria-label={label} onCancel={onClose} className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-transparent p-4 open:flex backdrop:bg-black/40 backdrop:backdrop-blur-sm">{children}</dialog>;
}

export default function ChatClient({ initialTopic = "" }: { initialTopic?: string }) {
  // Navigation & Screen States
  const [screen, setScreen] = useState<"intake" | "active" | "resuming">("intake");

  // System Availability from real DB status
  const [availability, setAvailability] = useState<SystemAvailability>({
    status: "offline",
    activeSupportersCount: 0,
    openTicketsCount: 0,
    operatingHours: "8:00 AM - 10:00 PM IST (Sri Lanka Time)",
    pilotMode: true,
  });
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const hasStoredSession = useSyncExternalStore(subscribeSession, hasBrowserSession, hasServerSession);
  const restoring = hasStoredSession && isRestoring;

  // Intake Form
  const [preferredLanguage, setPreferredLanguage] = useState<"si" | "en">("si");
  const [topic, setTopic] = useState(initialTopic);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Resume Form
  const [resumeTicketRef, setResumeTicketRef] = useState("");
  const [resumeRecoveryCode, setResumeRecoveryCode] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [isResuming, setIsResuming] = useState(false);

  // Active Ticket & Recovery
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showKeyNotice, setShowKeyNotice] = useState(true);

  // Messaging State
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [pollVersion, setPollVersion] = useState(0);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [otherPartyTyping, setOtherPartyTyping] = useState<{ isTyping: boolean; name: string }>({
    isTyping: false,
    name: "",
  });

  // Post-Chat Feedback & Deletion Modals
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Auto-scroll ref
  const messagesRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const lastTypingAtRef = useRef(0);
  const submitLockRef = useRef(false);
  const sendLockRef = useRef(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const lastReceivedMessageIdRef = useRef<string | undefined>(undefined);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const conversationEnded = ticket?.status === "closed" || Boolean(ticket?.deletion_requested);
  const activeReference = screen === "active" && !conversationEnded ? ticket?.ticket_ref : undefined;
  const lastMessageId = messages.at(-1)?.id;
  const whatsappHref = getWhatsAppHref(ticket?.topic || topic || undefined);

  useEffect(() => {
    const controller = new AbortController();
    async function restore() {
      const session = readSession();
      if (!session) return;
      try {
        const data = await requestJson<ConversationResponse>(`/api/tickets/${encodeURIComponent(session.reference)}`, {}, controller.signal);
        if (controller.signal.aborted) return;
        setTicket(data.ticket); setMessages(data.messages); setShowKeyNotice(false); setScreen("active");
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof ChatRequestError && [401, 404].includes(error.status)) saveSession(null);
        setResumeTicketRef(session.reference);
        setErrorMsg("Your previous conversation couldn’t be reopened. Resume it with your recovery key below.");
      } finally { if (!controller.signal.aborted) setIsRestoring(false); }
    }
    void restore();
    return () => controller.abort();
  }, []);

  // 1. Fetch Availability
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      try {
        const data = await requestJson<SystemAvailability>("/api/availability", {}, controller.signal);
        if (controller.signal.aborted) return;
        setAvailability(data); setAvailabilityLoaded(true); setAvailabilityError(false);
      } catch { if (!controller.signal.aborted) { setAvailabilityError(true); setAvailabilityLoaded(false); } }
      if (!controller.signal.aborted) timer = setTimeout(load, 20000);
    }
    void load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, []);

  // 2. Poll Active Ticket & Messages when in active screen
  useEffect(() => {
    if (!activeReference) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let inFlight = false;
    async function poll() {
      if (controller.signal.aborted || inFlight) return;
      clearTimeout(timer); inFlight = true;
      try {
        const data = await requestJson<ConversationResponse>(`/api/tickets/${encodeURIComponent(activeReference!)}`, {}, controller.signal);
        if (controller.signal.aborted) return;
        const incomingId = data.messages.at(-1)?.id;
        if (!stickToBottomRef.current && incomingId && incomingId !== lastReceivedMessageIdRef.current) setHasNewMessages(true);
        lastReceivedMessageIdRef.current = incomingId;
        setTicket((previous) => previous?.ticket_ref === data.ticket.ticket_ref && previous.status === "closed" ? { ...data.ticket, status: "closed" } : data.ticket);
        setMessages((previous) => mergeMessages(previous, data.messages));
        setOtherPartyTyping(data.typing || { isTyping: false, name: "" }); setConnectionError("");
      } catch (error) {
        if (!controller.signal.aborted) setConnectionError(error instanceof ChatRequestError && error.status === 401 ? "Your session expired. Use your recovery key to resume." : "Connection interrupted. We’re trying to reconnect.");
      } finally {
        inFlight = false;
        if (!controller.signal.aborted) timer = setTimeout(poll, document.hidden ? 10000 : 3000);
      }
    }
    function reconnect() { if (!document.hidden) void poll(); }
    void poll(); window.addEventListener("online", reconnect); document.addEventListener("visibilitychange", reconnect);
    return () => { controller.abort(); clearTimeout(timer); window.removeEventListener("online", reconnect); document.removeEventListener("visibilitychange", reconnect); };
  }, [activeReference, pollVersion]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    if (stickToBottomRef.current) container.scrollTop = container.scrollHeight;
  }, [lastMessageId, otherPartyTyping.isTyping]);
  useEffect(() => () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); }, [activeReference]);

  // Handle typing indicator emission
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (!ticket || conversationEnded) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Throttle notifications so each keystroke does not create a request.
    if (Date.now() - lastTypingAtRef.current > 2000) {
      lastTypingAtRef.current = Date.now();
      void requestJson(`/api/tickets/${ticket.ticket_ref}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTyping: true }),
    }).catch(() => {});
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (ticket) {
        void requestJson(`/api/tickets/${ticket.ticket_ref}/typing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isTyping: false }),
        }).catch(() => {});
      }
    }, 3000);
  };

  // Start New Conversation
  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const data = await requestJson<{ ticket: SupportTicket; recoveryCode: string; sessionToken: string }>("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredLanguage,
          topic: topic.trim() || undefined,
        }),
      });

      saveSession({ reference: data.ticket.ticket_ref, token: data.sessionToken });
      setIsRestoring(false);
      setMessages([]); setSendError(""); setActionError(""); setFeedbackSubmitted(false); setDeleteSuccess(false);
      stickToBottomRef.current = true;
      setTicket(data.ticket);
      setRecoveryCode(data.recoveryCode);
      setShowKeyNotice(true);
      setScreen("active");
    } catch (err: unknown) {
      setErrorMsg(errorMessage(err));
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Resume Existing Conversation
  const handleResumeChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsResuming(true);
    setResumeError("");

    try {
      const data = await requestJson<{ ticket: SupportTicket; sessionToken: string }>("/api/tickets/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketRef: resumeTicketRef.trim().toUpperCase(),
          recoveryCode: resumeRecoveryCode.trim(),
        }),
      });

      saveSession({ reference: data.ticket.ticket_ref, token: data.sessionToken });
      setIsRestoring(false);
      const conversation = await requestJson<ConversationResponse>(`/api/tickets/${encodeURIComponent(data.ticket.ticket_ref)}`);
      setMessages(conversation.messages); setSendError(""); setActionError(""); setResumeRecoveryCode(""); stickToBottomRef.current = true;
      setTicket(conversation.ticket);
      setRecoveryCode(null); // Already known to user
      setShowKeyNotice(false);
      setScreen("active");
    } catch (err: unknown) {
      setResumeError(errorMessage(err));
    } finally {
      submitLockRef.current = false;
      setIsResuming(false);
    }
  };

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !ticket || sendLockRef.current || conversationEnded) return;

    const messageText = inputText.trim();
    sendLockRef.current = true;
    setSendError("");
    setIsSending(true);

    try {
      const data = await requestJson<{ message: ConversationMessage }>(`/api/tickets/${ticket.ticket_ref}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageText }),
      });

      stickToBottomRef.current = true;
      setHasNewMessages(false); lastReceivedMessageIdRef.current = data.message.id;
      setMessages((prev) => mergeMessages(prev, [data.message]));
      setInputText("");
    } catch (err) {
      setSendError(errorMessage(err) + " Your message is still here.");
    } finally {
      sendLockRef.current = false;
      setIsSending(false);
      requestAnimationFrame(() => composerRef.current?.focus({ preventScroll: true }));
    }
  };

  // Close Conversation
  const handleCloseConversation = async () => {
    if (!ticket || isClosing) return;
    const confirmClose = window.confirm("Are you sure you want to end this conversation? You will have an opportunity to leave anonymous feedback or request data deletion.");
    if (!confirmClose) return;
    setIsClosing(true); setActionError("");

    try {
      await requestJson(`/api/tickets/${ticket.ticket_ref}/close`, { method: "POST" });
      setTicket((prev) => (prev ? { ...prev, status: "closed" } : null));
      setShowFeedbackModal(true);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally { setIsClosing(false); }
  };

  // Submit Post-Chat Feedback
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || isSavingFeedback) return;
    setIsSavingFeedback(true); setActionError("");

    try {
      await requestJson(`/api/tickets/${ticket.ticket_ref}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: feedbackRating, text: feedbackText }),
      });
      setFeedbackSubmitted(true);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally { setIsSavingFeedback(false); }
  };

  // Request Data Deletion
  const handleRequestDeletion = async () => {
    if (!ticket || isDeleting) return;
    setIsDeleting(true);
    setActionError("");

    try {
      await requestJson(`/api/tickets/${ticket.ticket_ref}/delete-request`, { method: "POST" });
      setDeleteSuccess(true); saveSession(null);
      setTicket((prev) => (prev ? { ...prev, deletion_requested: 1 } : null));
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const copyRecoveryKey = async () => {
    if (!recoveryCode || !ticket) return;
    try {
      await navigator.clipboard.writeText(`Ticket: ${ticket.ticket_ref}\nRecovery key: ${recoveryCode}`);
      setCopiedKey(true); setTimeout(() => setCopiedKey(false), 3000);
    } catch { setSendError("Copy isn’t available here. Select and save your key manually."); }
  };

  // Conversation topics for optional preference selection
  const topicOptions = conversationTopics;

  return (
    <div className="flex-1 flex flex-col bg-[#FAF9F7] py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col">
        {restoring && <div role="status" className="flex min-h-60 items-center justify-center gap-3 text-sm text-[#5B5875]"><RefreshCw className="size-5 animate-spin" />Opening your private space…</div>}
        {/* ============================================================== */}
        {/* SCREEN 1: INTAKE SCREEN                                        */}
        {/* ============================================================== */}
        {!restoring && screen === "intake" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header Greeting */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EDE7F6] border border-[#D4C7E8] text-xs font-semibold text-[#25234A]">
                <HeartHandshake className="w-4 h-4 text-[#25234A]" />
                <span>Private & Anonymous Human Support</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#25234A] tracking-tight">
                You can start wherever you are.
              </h1>
              <p className="text-base sm:text-lg text-[#5B5875] max-w-xl mx-auto leading-relaxed">
                Pick what’s on your mind, or tell us in your own words. We’re here to listen, at your pace.
              </p>
            </div>

            {/* Availability Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8E5DF] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EDE7F6] flex items-center justify-center text-[#25234A] shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-[#5B5875] font-semibold">
                      Current Support Status
                    </span>
                    {!availabilityLoaded && <span className="text-xs text-[#5B5875]">{availabilityError ? "Availability unavailable" : "Checking availability…"}</span>}
                    {availabilityLoaded && availability.status === "available" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Supporters Available
                      </span>
                    )}
                    {availabilityLoaded && availability.status === "busy" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        All Supporters Busy
                      </span>
                    )}
                    {availabilityLoaded && availability.status === "offline" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Currently Offline
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5B5875] mt-0.5">
                    {availabilityLoaded ? `Operating Hours: ${availability.operatingHours}` : "You can leave a message. Replies depend on volunteer availability."}
                  </p>
                </div>
              </div>

              {availabilityLoaded && availability.status === "offline" && (
                <div className="text-right">
                  <span className="text-xs text-[#9C4B64] font-medium block">Outside Hours Notice:</span>
                  <a href="tel:1926" className="text-xs font-bold text-[#25234A] underline hover:text-[#9C4B64]">
                    Call 1926 for 24/7 Crisis Help
                  </a>
                </div>
              )}
            </div>

            {/* Main Intake Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E5DF] shadow-md space-y-6">
              {errorMsg && (
                <div role="alert" className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleStartChat} className="space-y-6">
                {/* Language Selection */}
                <div>
                  <label className="block text-sm font-bold text-[#25234A] mb-2">
                    1. Select Your Preferred Conversation Language
                  </label>
                  <p className="text-xs text-[#5B5875] mb-3">
                    Our human supporters warmly understand Sinhala, English, and Singlish.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPreferredLanguage("si")}
                      className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                        preferredLanguage === "si"
                          ? "border-[#25234A] bg-[#EDE7F6]/60 text-[#25234A] font-bold shadow-xs"
                          : "border-[#E8E5DF] hover:border-[#D4C7E8] text-[#5B5875]"
                      }`}
                    >
                      <span className="text-base font-sinhala font-semibold">සිංහල (Sinhala)</span>
                      <span className="text-xs text-[#5B5875] mt-1">සිංහල සහ සිංග්ලිෂ් භාෂාවෙන් පිළිතුරු ලැබෙනු ඇත.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreferredLanguage("en")}
                      className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                        preferredLanguage === "en"
                          ? "border-[#25234A] bg-[#EDE7F6]/60 text-[#25234A] font-bold shadow-xs"
                          : "border-[#E8E5DF] hover:border-[#D4C7E8] text-[#5B5875]"
                      }`}
                    >
                      <span className="text-base font-semibold">English</span>
                      <span className="text-xs text-[#5B5875] mt-1">Conversations conducted in clear English.</span>
                    </button>
                  </div>
                </div>

                {/* Conversation Preferences (Optional) */}
                <div>
                  <label className="block text-sm font-bold text-[#25234A] mb-2">
                    2. What’s on your mind? <span className="text-xs font-normal text-[#5B5875]">(Optional)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {topicOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={topic === opt.title}
                        onClick={() => setTopic(topic === opt.title ? "" : opt.title)}
                        className={`p-3 rounded-xl border text-xs sm:text-sm text-left transition-all ${
                          topic === opt.title
                            ? "border-[#25234A] bg-[#EDE7F6] text-[#25234A] font-semibold"
                            : "border-[#E8E5DF] hover:bg-[#FAF9F7] text-[#5B5875]"
                        }`}
                      >
                        {opt.shortTitle}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="chat-topic" className="mb-2 block text-sm font-semibold text-[#25234A]">Or tell us in your own words</label>
                  <textarea id="chat-topic" rows={2} maxLength={200} value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="I’ve had a difficult day, and I’d like to talk…" className="w-full resize-y rounded-xl border border-[#E8E5DF] bg-[#FAF9F7] p-3.5 text-sm focus:border-[#9a84b8]" />
                  <p className="mt-1 text-right text-[10px] text-[#5B5875]">{topic.length}/200 · You can also skip this.</p>
                </div>

                {/* Privacy Assurance Notice */}
                <div className="p-4 rounded-2xl bg-[#FAF9F7] border border-[#E8E5DF] text-xs text-[#5B5875] space-y-1.5 leading-relaxed">
                  <div className="flex items-center gap-1.5 text-[#25234A] font-semibold">
                    <Shield className="w-4 h-4 text-[#383466]" />
                    <span>Privacy Safeguards</span>
                  </div>
                  <p>
                    • No name, email, phone number, or account required.
                  </p>
                  <p>
                    • Your conversation messages are encrypted while stored.
                  </p>
                  <p>
                    • A unique ticket reference and private recovery credential will be generated so you can resume or permanently delete your conversation at any time.
                  </p>
                </div>

                {/* Start Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 rounded-2xl text-base font-bold text-white bg-[#25234A] hover:bg-[#383466] shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Creating Private Conversation...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5" />
                        <span>Start Conversation</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="rounded-2xl border border-[#dce9df] bg-[#f4f9f5] p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-[#3B6B4A]"><MessageCircle className="size-4" />Prefer WhatsApp?</p>
                <p className="mt-2 text-xs leading-6 text-[#5B5875]">{whatsappHref ? "Open a WhatsApp chat, then use its call button if you’d prefer to talk. WhatsApp shares your phone number with our team. Your website messages stay here and are not transferred automatically." : "WhatsApp support is being set up. You can use our private website chat now."}</p>
                {whatsappHref && <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[#3B6B4A]">Chat or call on WhatsApp<ExternalLink className="size-3" /></a>}
              </div>

              {/* Resume Existing Conversation Link */}
              <div className="pt-4 border-t border-[#E8E5DF] text-center">
                <button
                  type="button"
                  onClick={() => setScreen("resuming")}
                  className="text-xs font-semibold text-[#25234A] hover:text-[#383466] underline inline-flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Already have a Ticket Reference & Recovery Key? Resume conversation</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 2: RESUME CONVERSATION MODAL                            */}
        {/* ============================================================== */}
        {!restoring && screen === "resuming" && (
          <div className="max-w-xl mx-auto w-full space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE7F6] text-[#25234A] mx-auto flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#25234A]">Resume Your Conversation</h2>
              <p className="text-xs sm:text-sm text-[#5B5875]">
                Enter your Ticket Reference and the private Recovery Key generated when you started.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E5DF] shadow-md space-y-5">
              {resumeError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{resumeError}</span>
                </div>
              )}

              <form onSubmit={handleResumeChat} className="space-y-4">
                <div>
                  <label htmlFor="resume-reference" className="block text-xs font-bold uppercase tracking-wider text-[#25234A] mb-1.5">
                    Ticket Reference (e.g. HID-7F2K9M)
                  </label>
                  <input
                    id="resume-reference"
                    type="text"
                    required
                    maxLength={30}
                    value={resumeTicketRef}
                    onChange={(e) => setResumeTicketRef(e.target.value)}
                    placeholder="HID-XXXXXX"
                    className="w-full px-4 py-3 rounded-xl border border-[#E8E5DF] focus:border-[#25234A] focus:ring-1 focus:ring-[#25234A] text-sm uppercase font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="resume-key" className="block text-xs font-bold uppercase tracking-wider text-[#25234A] mb-1.5">
                    Private Recovery Key (e.g. REC-XXXX-XXXX-XXXX)
                  </label>
                  <input
                    id="resume-key"
                    type="password"
                    required
                    minLength={8}
                    maxLength={64}
                    autoComplete="off"
                    spellCheck={false}
                    value={resumeRecoveryCode}
                    onChange={(e) => setResumeRecoveryCode(e.target.value)}
                    placeholder="REC-XXXX-XXXX-XXXX"
                    className="w-full px-4 py-3 rounded-xl border border-[#E8E5DF] focus:border-[#25234A] focus:ring-1 focus:ring-[#25234A] text-sm font-mono"
                  />
                  <p className="text-[11px] text-[#5B5875] mt-1.5">
                    * For your security, a ticket reference alone NEVER grants access to private conversation messages.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isResuming}
                    className="flex-1 py-3.5 px-6 rounded-xl text-sm font-bold text-white bg-[#25234A] hover:bg-[#383466] shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isResuming ? "Verifying..." : "Resume Conversation"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setScreen("intake")}
                    className="py-3.5 px-5 rounded-xl text-sm font-semibold text-[#5B5875] hover:bg-[#FAF9F7] border border-[#E8E5DF]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCREEN 3: ACTIVE CONVERSATION                                  */}
        {/* ============================================================== */}
        {!restoring && screen === "active" && ticket && (
          <div className="flex h-[calc(100dvh-180px)] min-h-[540px] max-h-[900px] flex-col bg-white rounded-3xl border border-[#E8E5DF] shadow-md overflow-hidden animate-fadeIn">
            {/* Ticket Header & Status Bar */}
            <div className="p-4 sm:px-6 bg-[#FAF9F7] border-b border-[#E8E5DF] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EDE7F6] border border-[#D4C7E8] flex items-center justify-center text-[#25234A] font-bold shrink-0">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#25234A]">Hithata Idak</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-[#EDE7F6] text-[#25234A] font-mono font-semibold">
                      {ticket.ticket_ref}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white border border-[#E8E5DF] text-[#5B5875] capitalize">
                      {ticket.preferred_language === "si" ? "සිංහල" : "English"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-[#5B5875]">
                    <span>Supporter: </span>
                    <span className="font-semibold text-[#25234A]">
                      {ticket.assigned_volunteer_name || "Waiting for a volunteer"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge & Control Buttons */}
              <div className="flex items-center gap-2">
                {whatsappHref && <a href={whatsappHref} target="_blank" rel="noopener noreferrer" title="Chat in WhatsApp, then use its call button. Your phone number is shared; website messages stay here." className="inline-flex items-center gap-1 rounded-xl border border-[#dce9df] bg-[#f4f9f5] px-2.5 py-1.5 text-xs font-semibold text-[#3B6B4A]"><MessageCircle className="size-3.5" /><span>WhatsApp</span><ExternalLink className="size-3" /></a>}
                {/* Status Indicator */}
                <div className="text-xs font-semibold px-3 py-1 rounded-full border bg-white shadow-2xs">
                  {ticket.status === "waiting" && <span className="text-amber-700">Waiting for Supporter</span>}
                  {ticket.status === "assigned" && <span className="text-blue-700">Supporter Joined</span>}
                  {ticket.status === "active" && <span className="text-emerald-700">Conversation Active</span>}
                  {ticket.status === "awaiting_reply" && <span className="text-purple-700">Your Supporter Replied</span>}
                  {ticket.deletion_requested ? <span className="text-slate-600">Deletion Requested</span> : ticket.status === "closed" && <span className="text-slate-600">Conversation Closed</span>}
                </div>

                {/* Close Button */}
                {!conversationEnded ? (
                  <button
                    type="button"
                    onClick={handleCloseConversation}
                    disabled={isClosing}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                  >
                    {isClosing ? "Ending…" : "End Chat"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Data</span>
                  </button>
                )}
              </div>
            </div>

            {/* One-Time Recovery Key Alert Banner */}
            {recoveryCode && showKeyNotice && (
              <div className="p-4 bg-[#EDE7F6] border-b border-[#D4C7E8] text-xs text-[#25234A]">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <KeyRound className="w-4 h-4 text-[#25234A]" />
                      <span>Save Your Private Recovery Key (Shown Once)</span>
                    </div>
                    <p className="text-[#5B5875]">
                      Save this key and your Ticket Reference ({ticket.ticket_ref}) somewhere private to return on another device. This tab can reopen your conversation after a refresh.
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <code className="px-3 py-1 rounded-md bg-white border border-[#D4C7E8] font-mono font-bold text-xs select-all">
                        {recoveryCode}
                      </code>
                      <button
                        type="button"
                        onClick={copyRecoveryKey}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#25234A] text-white hover:bg-[#383466] font-medium"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey ? "Copied" : "Copy Key"}</span>
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowKeyNotice(false)}
                    className="text-xs text-[#5B5875] hover:text-[#25234A] p-1 font-bold"
                    aria-label="Dismiss key banner"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Closed Notice Bar */}
            {connectionError && <div role="status" className="flex shrink-0 flex-wrap items-center justify-between gap-2 bg-amber-50 px-4 py-2 text-xs text-amber-800"><span>{connectionError}</span><button type="button" onClick={() => setPollVersion((value) => value + 1)} className="font-bold underline">Retry now</button><button type="button" onClick={() => { setResumeTicketRef(ticket.ticket_ref); setScreen("resuming"); }} className="font-bold underline">Use recovery key</button></div>}
            {actionError && !showFeedbackModal && !showDeleteModal && <p role="alert" className="shrink-0 bg-rose-50 px-4 py-2 text-xs text-rose-800">{actionError}</p>}
            {ticket.status === "closed" && (
              <div className="p-3 bg-slate-100 border-b border-slate-200 text-center text-xs text-slate-700 flex items-center justify-center gap-2">
                <span>This conversation has been closed.</span>
                {!feedbackSubmitted && (
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(true)}
                    className="font-bold underline text-[#25234A] hover:text-[#383466]"
                  >
                    Leave Anonymous Feedback
                  </button>
                )}
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="font-bold underline text-red-700 hover:text-red-900"
                >
                  Request Permanent Data Deletion
                </button>
              </div>
            )}

            {/* Message Stream */}
            <div className="relative min-h-0 flex-1">
            <div ref={messagesRef} role="log" aria-label="Conversation messages" aria-live="polite" aria-relevant="additions" onScroll={(event) => { const node = event.currentTarget; stickToBottomRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80; if (stickToBottomRef.current) setHasNewMessages(false); }} className="h-full p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4" style={{ scrollBehavior: "auto" }}>
              {messages.map((msg) => {
                const isVisitor = msg.sender_role === "visitor";
                const isSystem = msg.sender_role === "system";

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="max-w-md px-4 py-2 rounded-2xl bg-[#EDE7F6]/60 border border-[#D4C7E8] text-xs text-[#5B5875] text-center leading-relaxed">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isVisitor ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-[11px] text-[#5B5875] px-1">
                      <span className="font-semibold text-[#25234A]">
                        {isVisitor ? "You" : msg.sender_name}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] shadow-2xs ${
                        isVisitor
                          ? "bg-[#25234A] text-white rounded-br-xs"
                          : "bg-[#EDE7F6] text-[#25234A] rounded-bl-xs border border-[#D4C7E8]/70"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {/* Real-time Typing Indicator */}
              {otherPartyTyping.isTyping && (
                <div className="flex items-center gap-2 text-xs text-[#5B5875] italic py-1 px-2 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-[#5B5875]" />
                  <span>{otherPartyTyping.name || "Supporter"} is typing...</span>
                </div>
              )}

            </div>
            {hasNewMessages && <button type="button" onClick={() => { stickToBottomRef.current = true; if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight; setHasNewMessages(false); }} className="absolute bottom-3 right-4 flex items-center gap-2 rounded-full border border-[#D4C7E8] bg-white px-3 py-2 text-xs font-semibold shadow-md">Latest messages ↓</button>}
            </div>

            {/* Input Bar */}
            <div className="shrink-0 p-3 sm:p-4 bg-[#FAF9F7] border-t border-[#E8E5DF]">
              {!conversationEnded ? (
                <form onSubmit={handleSendMessage} className="space-y-2">
                  {sendError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{sendError}</p>}
                  <div className="relative flex items-end gap-2">
                    <label htmlFor="chat-message" className="sr-only">Your message</label>
                    <textarea
                      ref={composerRef}
                      id="chat-message"
                      rows={2}
                      maxLength={3000}
                      disabled={isSending}
                      value={inputText}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(pointer: fine)").matches) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Write in Sinhala, English, or Singlish…"
                      className="min-w-0 flex-1 p-3.5 rounded-2xl border border-[#E8E5DF] focus:border-[#25234A] focus:ring-1 focus:ring-[#25234A] text-base sm:text-sm resize-none bg-white"
                    />

                    <button
                      type="submit"
                      disabled={!inputText.trim() || isSending}
                      className="p-3.5 rounded-2xl bg-[#25234A] text-white hover:bg-[#383466] disabled:opacity-40 transition-colors shrink-0 shadow-sm"
                      aria-label="Send message"
                    >
                      {isSending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#5B5875] px-1">
                    <span>Supports Sinhala (යුනිකෝඩ්), English, and Singlish.</span>
                    <span>{inputText.length > 2700 ? `${inputText.length}/3000` : "Private conversation"}</span>
                  </div>
                </form>
              ) : (
                <div className="text-center py-2 text-xs text-[#5B5875]">
                  This conversation is closed. You can{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setTicket(null);
                      saveSession(null); setMessages([]); setInputText("");
                      setScreen("intake");
                    }}
                    className="font-bold underline text-[#25234A]"
                  >
                    start a new conversation
                  </button>{" "}
                  anytime.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 1: POST-CHAT FEEDBACK                                    */}
        {/* ============================================================== */}
        {showFeedbackModal && (
          <ChatModal label="Conversation feedback" onClose={() => setShowFeedbackModal(false)}>
            <div className="max-h-[90dvh] overflow-y-auto max-w-md w-full bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-[#E8E5DF] space-y-4 animate-scaleUp">
              {actionError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800">{actionError}</p>}
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-2xl bg-[#EDE7F6] text-[#25234A] mx-auto flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#25234A]">How Was Your Experience?</h3>
                <p className="text-xs text-[#5B5875]">
                  Feedback is voluntary and completely anonymous. It helps us support others better.
                </p>
              </div>

              {!feedbackSubmitted ? (
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5B5875] mb-2 text-center">
                      Did you feel heard and respected?
                    </label>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className={`w-10 h-10 rounded-xl text-sm font-bold flex items-center justify-center transition-colors ${
                            feedbackRating >= star
                              ? "bg-[#25234A] text-white"
                              : "bg-[#FAF9F7] text-[#5B5875] border border-[#E8E5DF]"
                          }`}
                        >
                          {star}★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="chat-feedback" className="block text-xs font-semibold text-[#5B5875] mb-1.5">
                      Any thoughts or gentle suggestions? (Optional)
                    </label>
                    <textarea
                      id="chat-feedback"
                      rows={3}
                      maxLength={1000}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full p-3 rounded-xl border border-[#E8E5DF] text-xs resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSavingFeedback}
                      className="flex-1 py-2.5 rounded-xl bg-[#25234A] text-white text-xs font-bold"
                    >
                      {isSavingFeedback ? "Saving…" : "Submit Feedback"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFeedbackModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-[#E8E5DF] text-xs font-medium text-[#5B5875]"
                    >
                      Skip
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm font-semibold text-emerald-800">
                    Thank you for sharing your feedback with us.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-5 py-2 rounded-xl bg-[#25234A] text-white text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </ChatModal>
        )}

        {/* ============================================================== */}
        {/* MODAL 2: PERMANENT DATA DELETION                               */}
        {/* ============================================================== */}
        {showDeleteModal && (
          <ChatModal label="Request conversation deletion" onClose={() => setShowDeleteModal(false)}>
            <div className="max-h-[90dvh] overflow-y-auto max-w-md w-full bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-[#E8E5DF] space-y-4 animate-scaleUp">
              {actionError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800">{actionError}</p>}
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 mx-auto flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#25234A]">Request Data Deletion</h3>
                <p className="text-xs text-[#5B5875]">
                  Ask the privacy team to permanently remove your conversation and its recovery credentials.
                </p>
              </div>

              {!deleteSuccess ? (
                <div className="space-y-4">
                  <p className="text-xs text-[#5B5875] leading-relaxed">
                    Your request will be queued for the privacy team. After they process it, the messages and recovery credentials cannot be recovered.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRequestDeletion}
                      disabled={isDeleting}
                      className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold"
                    >
                      {isDeleting ? "Processing..." : "Request Permanent Deletion"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-[#E8E5DF] text-xs font-medium text-[#5B5875]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-xs font-medium text-emerald-800 leading-relaxed">
                    Your deletion request has been queued. The privacy team will permanently remove your messages and access credentials when they process it.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setTicket(null);
                      saveSession(null); setMessages([]); setInputText("");
                      setScreen("intake");
                    }}
                    className="px-5 py-2 rounded-xl bg-[#25234A] text-white text-xs font-semibold"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </ChatModal>
        )}
      </div>
    </div>
  );
}

