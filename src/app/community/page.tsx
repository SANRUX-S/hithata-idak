"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Heart,
  Users2,
  Sparkles,
  PlusCircle,
  Flag,
  Share2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Send,
  X,
  Compass,
  ArrowRight,
  Filter,
} from "lucide-react";
import { CommunityPost, CommunityPostWithReplies, CommunityCategory } from "@/lib/types";
import { transliterateSinglishToSinhala } from "@/lib/singlish";

const CATEGORIES: { id: CommunityCategory | "all"; label: string; labelSi: string }[] = [
  { id: "all", label: "All Posts", labelSi: "සියල්ල" },
  { id: "feelings", label: "Feelings & Emotions", labelSi: "හිතේ හැඟීම්" },
  { id: "anxiety", label: "Stress & Anxiety", labelSi: "කාංසාව සහ ආතතිය" },
  { id: "relationships", label: "Family & Relationships", labelSi: "පවුල සහ සබඳතා" },
  { id: "academic", label: "Study & Career", labelSi: "ඉගෙනීම සහ රැකියාව" },
  { id: "questions", label: "Ask for Advice", labelSi: "අදහස් විමසීම" },
  { id: "hope", label: "Healing & Small Wins", labelSi: "සුවපත් වීම සහ බලාපොරොත්තුව" },
];

const RANDOM_ALIASES = [
  "Anonymous Butterfly",
  "Gentle Wave",
  "Silent Lotus",
  "Morning Sun",
  "Quiet Tree",
  "Peaceful Seeker",
  "කරුණාවන්ත හිතවතෙක්",
  "සන්සුන් සිතක්",
  "නිහඬ මිතුරෙක්",
];

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Create Post Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<CommunityCategory>("feelings");
  const [newAuthor, setNewAuthor] = useState("");
  const [singlishAuto, setSinglishAuto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Post Thread View Modal State
  const [activePost, setActivePost] = useState<CommunityPostWithReplies | null>(null);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("");
  const [replySinglishAuto, setReplySinglishAuto] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyError, setReplyError] = useState("");

  // Report Modal
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportNotice, setReportNotice] = useState("");

  // Fetch Community Posts
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/community/posts?category=${encodeURIComponent(selectedCategory)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Unable to load community discussions");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load discussions");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  // Open Thread Details
  const handleOpenThread = async (postId: string) => {
    setIsLoadingThread(true);
    setReplyError("");
    try {
      const res = await fetch(`/api/community/posts/${postId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Could not open this discussion");
      const data = await res.json();
      setActivePost(data.post);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error opening thread");
    } finally {
      setIsLoadingThread(false);
    }
  };

  // Submit New Community Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const authorToUse = newAuthor.trim() || RANDOM_ALIASES[Math.floor(Math.random() * RANDOM_ALIASES.length)];
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          authorAlias: authorToUse,
          category: newCategory,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish post");

      setShowCreateModal(false);
      setNewTitle("");
      setNewContent("");
      setNewAuthor("");
      void fetchPosts();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to publish post");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send Supportive Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost || !replyText.trim() || isSendingReply) return;

    setIsSendingReply(true);
    setReplyError("");

    try {
      const authorToUse = replyAuthor.trim() || RANDOM_ALIASES[Math.floor(Math.random() * RANDOM_ALIASES.length)];
      const res = await fetch(`/api/community/posts/${activePost.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyText,
          authorAlias: authorToUse,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post reply");

      setReplyText("");
      // Refresh thread
      handleOpenThread(activePost.id);
      void fetchPosts();
    } catch (err: unknown) {
      setReplyError(err instanceof Error ? err.message : "Failed to post reply");
    } finally {
      setIsSendingReply(false);
    }
  };

  // React to Post
  const handleReact = async (postId: string, reactionType: "warmth" | "alone" | "insight") => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  reactions_warmth: data.reactions.reactions_warmth,
                  reactions_alone: data.reactions.reactions_alone,
                  reactions_insight: data.reactions.reactions_insight,
                }
              : p
          )
        );
        if (activePost && activePost.id === postId) {
          setActivePost((prev) =>
            prev
              ? {
                  ...prev,
                  reactions_warmth: data.reactions.reactions_warmth,
                  reactions_alone: data.reactions.reactions_alone,
                  reactions_insight: data.reactions.reactions_insight,
                }
              : null
          );
        }
      }
    } catch {
      // Fail silently for instant feel
    }
  };

  // Submit Report
  const handleSubmitReport = async () => {
    if (!reportingPostId) return;
    try {
      await fetch(`/api/community/posts/${reportingPostId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason || "Inappropriate / Harmful content reported by user" }),
      });
      setReportNotice("Thank you. Our moderation team has received the report and will review immediately.");
      setTimeout(() => {
        setReportingPostId(null);
        setReportNotice("");
        setReportReason("");
      }, 2000);
    } catch {
      setReportNotice("Error reporting post. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Hero */}
        <div className="bg-gradient-to-br from-white via-[#EDE7F6]/40 to-white p-8 sm:p-10 rounded-3xl border border-[#E8E5DF] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#383466] bg-[#EDE7F6] px-3.5 py-1 rounded-full">
                Safe Peer Support Space
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#25234A] tracking-tight">
                හිතට ඉඩක් Community (සමූහය)
              </h1>
              <p className="text-sm sm:text-base text-[#5B5875] max-w-2xl leading-relaxed">
                ඔබේ සිතේ ඇති ප්‍රශ්න, හැඟීම් නිර්නාමිකව බෙදාගන්න. අන්‍යයන්ට කාරුණිකව සවන් දෙන්න, සහය වන්න සහ අදහස් විමසන්න.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setNewAuthor(RANDOM_ALIASES[Math.floor(Math.random() * RANDOM_ALIASES.length)]);
                setShowCreateModal(true);
              }}
              className="px-6 py-3.5 rounded-2xl bg-[#25234A] hover:bg-[#383466] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>නව සටහනක් ලියන්න (Share a Post)</span>
            </button>
          </div>

          {/* Safety & Moderation Notice */}
          <div className="p-4 rounded-2xl bg-white border border-[#D4C7E8] flex items-start gap-3 text-xs text-[#5B5875]">
            <Shield className="w-4 h-4 text-[#383466] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-[#25234A]">සුවදායක සහ ආරක්ෂිත පරිසරයක්:</span>
              <p>
                අපගේ සමූහය තුළ නින්දා අපහාස, වැරදි හැසිරීම්, හානිකර දේ හෝ ප්‍රචණ්ඩත්වය කිසිසේත්ම ඉවසන්නේ නැත. සියලු සටහන් ස්වයංක්‍රීයව සහ අපගේ volunteers ලා විසින් නිරන්තරයෙන් නිරීක්ෂණය කරනු ලැබේ. කිසියම් වැරදි සටහනක් දුටුවහොත් ක්ෂණිකව Report කරන්න.
              </p>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-[#25234A] text-white shadow-xs"
                  : "bg-white text-[#5B5875] border border-[#E8E5DF] hover:bg-[#EDE7F6]"
              }`}
            >
              <span>{cat.label}</span>
              <span className="opacity-75 font-normal ml-1">({cat.labelSi})</span>
            </button>
          ))}
        </div>

        {/* Feed List */}
        {isLoading ? (
          <div className="py-16 text-center text-sm text-[#5B5875] space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-[#25234A] border-t-transparent animate-spin mx-auto" />
            <p>Loading community discussions...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-6 rounded-2xl bg-red-50 text-red-800 text-center text-sm border border-red-200">
            {errorMsg}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white border border-[#E8E5DF] text-center space-y-3">
            <MessageSquare className="w-8 h-8 text-[#5B5875] mx-auto opacity-40" />
            <h3 className="text-base font-bold text-[#25234A]">මෙම අංශයේ සටහන් තවම නැත</h3>
            <p className="text-sm text-[#5B5875]">පළමු සටහන ලියා ඔබේ අදහස් හෝ ප්‍රශ්න බෙදාගන්න.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className={`p-6 rounded-3xl bg-white border transition-all shadow-2xs hover:shadow-xs space-y-3.5 ${
                  post.is_pinned ? "border-purple-300 bg-purple-50/20" : "border-[#E8E5DF] hover:border-[#D4C7E8]"
                }`}
              >
                {/* Post Top Meta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-[#EDE7F6] text-[#25234A] text-xs font-bold flex items-center justify-center">
                      {post.author_alias.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-[#25234A] block">{post.author_alias}</span>
                      <span className="text-[11px] text-[#5B5875]">
                        {new Date(post.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF9F7] border border-[#E8E5DF] text-[#383466] capitalize">
                      {post.category}
                    </span>
                    {Boolean(post.is_pinned) && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        Pinned Note
                      </span>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenThread(post.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleOpenThread(post.id);
                  }}
                  className="cursor-pointer space-y-1.5 text-left group"
                >
                  <h3 className="text-lg font-bold text-[#25234A] group-hover:text-[#383466] transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-sm text-[#5B5875] leading-relaxed whitespace-pre-wrap line-clamp-3">
                    {post.content}
                  </p>
                </div>

                {/* Bottom Reactions & Reply Bar */}
                <div className="pt-3 border-t border-[#E8E5DF]/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleReact(post.id, "warmth")}
                      className="px-2.5 py-1 rounded-xl border border-[#E8E5DF] hover:bg-rose-50 hover:border-rose-200 text-[#5B5875] hover:text-rose-700 flex items-center gap-1.5 transition-colors"
                      title="Send Warmth & Love"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-100" />
                      <span>{post.reactions_warmth}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReact(post.id, "alone")}
                      className="px-2.5 py-1 rounded-xl border border-[#E8E5DF] hover:bg-indigo-50 hover:border-indigo-200 text-[#5B5875] hover:text-[#25234A] flex items-center gap-1.5 transition-colors"
                      title="You Are Not Alone"
                    >
                      <span>🫂</span>
                      <span>{post.reactions_alone}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReact(post.id, "insight")}
                      className="px-2.5 py-1 rounded-xl border border-[#E8E5DF] hover:bg-amber-50 hover:border-amber-200 text-[#5B5875] hover:text-amber-800 flex items-center gap-1.5 transition-colors"
                      title="Helpful Insight"
                    >
                      <span>💡</span>
                      <span>{post.reactions_insight}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenThread(post.id)}
                      className="font-bold text-[#25234A] hover:text-[#383466] flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>පිළිතුරු {post.reply_count || 0} (View Thread)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReportingPostId(post.id)}
                      className="text-[#5B5875] hover:text-rose-600 p-1"
                      title="Report Inappropriate Content"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* CREATE POST MODAL */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25234A]/60 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#D4C7E8] overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 bg-gradient-to-r from-[#EDE7F6] to-white border-b border-[#E8E5DF] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-base font-bold text-[#25234A]">නව සටහනක් ලියන්න (Share to Community)</h3>
                </div>
                <button type="button" onClick={() => setShowCreateModal(false)} className="text-[#5B5875] hover:text-[#25234A]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="p-6 space-y-4 overflow-y-auto flex-1">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#25234A] mb-1">මාතෘකාව (Title) *</label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    maxLength={150}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="ඔබේ සටහනේ කෙටි මාතෘකාව..."
                    className="w-full p-3 rounded-xl border border-[#E8E5DF] text-sm focus:border-[#25234A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#25234A] mb-1">අංශය (Category)</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as CommunityCategory)}
                      className="w-full p-2.5 rounded-xl border border-[#E8E5DF] text-xs bg-white"
                    >
                      {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label} ({c.labelSi})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#25234A] mb-1">ඔබේ නම / Alias (රහස්‍යයි)</label>
                    <input
                      type="text"
                      maxLength={40}
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="e.g. Anonymous Friend"
                      className="w-full p-2.5 rounded-xl border border-[#E8E5DF] text-xs"
                    />
                  </div>
                </div>

                {/* Singlish Helper Toolbar */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-bold text-[#25234A]">ඔබේ සිතේ ඇති දේ ලියන්න (Content) *</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSinglishAuto(!singlishAuto)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                        singlishAuto ? "bg-purple-100 text-purple-900 border-purple-300" : "bg-white text-[#5B5875]"
                      }`}
                    >
                      සිංහල Auto: {singlishAuto ? "On" : "Off"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (newContent) setNewContent(transliterateSinglishToSinhala(newContent));
                      }}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white border border-[#E8E5DF] text-[#5B5875] hover:bg-[#EDE7F6]"
                    >
                      Convert to Sinhala
                    </button>
                  </div>
                </div>

                <textarea
                  rows={5}
                  required
                  minLength={10}
                  maxLength={3000}
                  value={newContent}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewContent(singlishAuto ? transliterateSinglishToSinhala(val) : val);
                  }}
                  placeholder="ඔබට දැනෙන හැඟීම්, ඔබ මුහුණ දෙන අභියෝග හෝ අන්‍යයන්ගෙන් විමසීමට ඇති දේ නිදහසේ මෙහි ලියන්න..."
                  className="w-full p-3.5 rounded-xl border border-[#E8E5DF] text-sm resize-none focus:border-[#25234A]"
                />

                <div className="p-3 bg-[#FAF9F7] rounded-xl border border-[#E8E5DF] text-[11px] text-[#5B5875]">
                  🔒 ඔබගේ පුද්ගලික තොරතුරු (දුරකථන අංක, ලිපින) මෙහි බෙදාගැනීමෙන් වළකින්න.
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5B5875] hover:bg-[#FAF9F7]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-[#25234A] hover:bg-[#383466] text-white text-xs font-bold disabled:opacity-50"
                  >
                    {isSubmitting ? "Publishing..." : "පළ කරන්න (Publish Post)"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* THREAD DETAILS & REPLIES DRAWER */}
        {activePost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25234A]/60 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#D4C7E8] overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="px-6 py-4 bg-[#FAF9F7] border-b border-[#E8E5DF] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white border border-[#E8E5DF] text-[#383466] capitalize">
                    {activePost.category}
                  </span>
                  <span className="text-xs text-[#5B5875]">By {activePost.author_alias}</span>
                </div>
                <button type="button" onClick={() => setActivePost(null)} className="text-[#5B5875] hover:text-[#25234A]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Main Post */}
                <div className="space-y-3 pb-5 border-b border-[#E8E5DF]">
                  <h2 className="text-xl font-bold text-[#25234A] leading-snug">{activePost.title}</h2>
                  <p className="text-sm text-[#25234A] leading-relaxed whitespace-pre-wrap">{activePost.content}</p>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleReact(activePost.id, "warmth")}
                      className="px-3 py-1 rounded-xl border border-[#E8E5DF] text-xs text-[#5B5875] hover:bg-rose-50 hover:text-rose-700 flex items-center gap-1.5"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-100" />
                      <span>{activePost.reactions_warmth}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReact(activePost.id, "alone")}
                      className="px-3 py-1 rounded-xl border border-[#E8E5DF] text-xs text-[#5B5875] hover:bg-indigo-50 hover:text-[#25234A] flex items-center gap-1.5"
                    >
                      <span>🫂</span>
                      <span>{activePost.reactions_alone}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReact(activePost.id, "insight")}
                      className="px-3 py-1 rounded-xl border border-[#E8E5DF] text-xs text-[#5B5875] hover:bg-amber-50 hover:text-amber-800 flex items-center gap-1.5"
                    >
                      <span>💡</span>
                      <span>{activePost.reactions_insight}</span>
                    </button>
                  </div>
                </div>

                {/* Replies Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#383466]">
                    සහයෝගී පිළිතුරු ({activePost.replies.length})
                  </h4>

                  {activePost.replies.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#5B5875]">
                      තවම පිළිතුරු නැත. ඔබගේ කාරුණික වචන කිහිපයකින් මේ හිතවතාට ශක්තියක් වන්න.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activePost.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                            reply.is_supporter
                              ? "bg-[#EDE7F6]/60 border-[#D4C7E8]"
                              : "bg-[#FAF9F7] border-[#E8E5DF]"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[#5B5875]">
                            <span className="font-bold text-[#25234A]">
                              {reply.author_alias}
                              {Boolean(reply.is_supporter) && (
                                <span className="ml-1.5 text-[10px] bg-[#25234A] text-white px-2 py-0.5 rounded-full">
                                  Trained Supporter
                                </span>
                              )}
                            </span>
                            <span>{new Date(reply.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <p className="text-[#25234A] text-sm leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-4 bg-[#FAF9F7] border-t border-[#E8E5DF] space-y-2">
                {replyError && (
                  <div className="p-2.5 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200">
                    {replyError}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs px-1">
                  <input
                    type="text"
                    maxLength={30}
                    value={replyAuthor}
                    onChange={(e) => setReplyAuthor(e.target.value)}
                    placeholder="Your pseudonym (optional)"
                    className="px-2.5 py-1 rounded-lg border border-[#E8E5DF] bg-white text-xs max-w-[200px]"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setReplySinglishAuto(!replySinglishAuto)}
                      className={`px-2 py-0.5 rounded text-[10px] border ${
                        replySinglishAuto ? "bg-purple-100 text-purple-900 border-purple-300" : "bg-white text-[#5B5875]"
                      }`}
                    >
                      සිංහල Auto: {replySinglishAuto ? "On" : "Off"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (replyText) setReplyText(transliterateSinglishToSinhala(replyText));
                      }}
                      className="px-2 py-0.5 rounded text-[10px] bg-white border border-[#E8E5DF] text-[#5B5875]"
                    >
                      Convert
                    </button>
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <textarea
                    rows={2}
                    required
                    maxLength={1500}
                    value={replyText}
                    onChange={(e) => {
                      const val = e.target.value;
                      setReplyText(replySinglishAuto ? transliterateSinglishToSinhala(val) : val);
                    }}
                    placeholder="කාරුණික, සහයෝගී පිළිතුරක් ලියන්න (Press Send)..."
                    className="flex-1 p-3 rounded-2xl border border-[#E8E5DF] text-xs bg-white focus:border-[#25234A] resize-none"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSendingReply}
                    className="p-3 rounded-2xl bg-[#25234A] text-white hover:bg-[#383466] disabled:opacity-40 transition-colors shrink-0 shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* REPORT INAPPROPRIATE CONTENT MODAL */}
        {reportingPostId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25234A]/60 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#D4C7E8] space-y-4">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <Flag className="w-4 h-4" />
                <span>Report Inappropriate Content (සටහන වාර්තා කරන්න)</span>
              </div>
              <p className="text-xs text-[#5B5875]">
                අපගේ සුවදායක ප්‍රජා මාර්ගෝපදේශ උල්ලංඝනය වන සටහන් (නින්දා, හානිකර දේ, ප්‍රචණ්ඩත්වය) වාර්තා කරන්න. අපගේ volunteers ලා එය වහාම ඉවත් කිරීමට පියවර ගනු ඇත.
              </p>
              {reportNotice ? (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
                  {reportNotice}
                </div>
              ) : (
                <>
                  <textarea
                    rows={3}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="හේතුව සඳහන් කරන්න (e.g. Abusive language, harassment, spam)..."
                    className="w-full p-3 rounded-xl border border-[#E8E5DF] text-xs resize-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReportingPostId(null)}
                      className="px-4 py-2 rounded-xl text-xs text-[#5B5875]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitReport}
                      className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
                    >
                      Submit Report
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
