"use client";

import { BarChart3, Star, HeartHandshake, Clock, ShieldCheck, Users, FileText } from "lucide-react";
import { PlatformAnalytics } from "@/lib/store";

interface AnalyticsDashboardProps {
  analytics: PlatformAnalytics | null;
  onRefresh?: () => void;
}

export function AnalyticsDashboard({ analytics, onRefresh }: AnalyticsDashboardProps) {
  if (!analytics) {
    return (
      <div className="p-8 text-center text-[#5B5875] bg-white rounded-3xl border border-[#E8E5DF] space-y-3">
        <BarChart3 className="w-8 h-8 mx-auto text-[#25234A] animate-pulse" />
        <p className="text-base font-semibold">Loading privacy-preserving analytics...</p>
      </div>
    );
  }

  const maxHourCount = Math.max(...analytics.peakHoursDistribution.map((h) => h.count), 1);
  const maxTopicCount = Math.max(...analytics.topicDistribution.map((t) => t.count), 1);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#25234A] to-[#383466] text-white flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#B8D8C2]" />
            <h2 className="text-xl font-bold">Platform Impact & Usage Analytics</h2>
          </div>
          <p className="text-sm text-[#EDE7F6]/80">
            Strictly anonymized, aggregate metrics. No personal data, visitor names, or conversation texts are ever stored or analyzed.
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
          >
            Refresh Metrics
          </button>
        )}
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E8E5DF] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#5B5875] text-xs font-bold uppercase tracking-wider">
            <span>Total Conversations</span>
            <HeartHandshake className="w-4 h-4 text-[#25234A]" />
          </div>
          <div className="text-3xl font-bold text-[#25234A]">{analytics.totalTickets}</div>
          <p className="text-xs text-[#5B5875]">Lifetime visitor support sessions</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8E5DF] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#5B5875] text-xs font-bold uppercase tracking-wider">
            <span>Active / In Queue</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-emerald-700">
            {analytics.activeTickets + analytics.waitingTickets}
          </div>
          <p className="text-xs text-[#5B5875]">
            {analytics.waitingTickets} waiting · {analytics.activeTickets} connected
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8E5DF] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#5B5875] text-xs font-bold uppercase tracking-wider">
            <span>Feedback Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-3xl font-bold text-amber-600 flex items-baseline gap-1">
            <span>{analytics.feedbackStats.averageRating}</span>
            <span className="text-base font-normal text-[#5B5875]">/ 5</span>
          </div>
          <p className="text-xs text-[#5B5875]">{analytics.feedbackStats.totalRatings} voluntary ratings</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8E5DF] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#5B5875] text-xs font-bold uppercase tracking-wider">
            <span>Active Volunteers</span>
            <Users className="w-4 h-4 text-[#25234A]" />
          </div>
          <div className="text-3xl font-bold text-[#25234A]">{analytics.activeVolunteers}</div>
          <p className="text-xs text-[#5B5875]">
            {analytics.totalVolunteers} rostered · {analytics.totalApplications} applied
          </p>
        </div>
      </div>

      {/* Two Column Section: Topics Distribution & Peak Support Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Breakdown */}
        <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#25234A] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#25234A]" />
              <span>Conversation Topics Breakdown</span>
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#EDE7F6] text-[#25234A]">
              Top Concerns
            </span>
          </div>

          <div className="space-y-3">
            {analytics.topicDistribution.length > 0 ? (
              analytics.topicDistribution.map((item) => {
                const percentage = Math.round((item.count / (analytics.totalTickets || 1)) * 100);
                return (
                  <div key={item.topic} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#25234A]">
                      <span className="truncate max-w-[280px]">{item.topic}</span>
                      <span className="text-[#5B5875]">{item.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#FAF9F7] overflow-hidden border border-[#E8E5DF]">
                      <div
                        className="h-full rounded-full bg-[#25234A] transition-all duration-500"
                        style={{ width: `${Math.max((item.count / maxTopicCount) * 100, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-[#5B5875] italic">No topics recorded yet.</p>
            )}
          </div>

          <div className="pt-2 border-t border-[#E8E5DF] flex items-center justify-between text-xs text-[#5B5875]">
            <span>Language preferences:</span>
            <span className="font-semibold text-[#25234A]">
              සිංහල {analytics.languageDistribution.si} · English {analytics.languageDistribution.en}
            </span>
          </div>
        </div>

        {/* Peak Support Hours Chart */}
        <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#25234A] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#25234A]" />
              <span>Peak Support Hours (Sri Lanka Time IST)</span>
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#EDE7F6] text-[#25234A]">
              24-Hour Cycle
            </span>
          </div>

          <p className="text-xs text-[#5B5875]">
            Helps volunteer coordinators schedule volunteer shifts when people need someone to listen the most.
          </p>

          <div className="pt-4 flex items-end justify-between gap-1 h-44 border-b border-[#E8E5DF] pb-2">
            {analytics.peakHoursDistribution.map((slot) => {
              const heightPercent = slot.count > 0 ? Math.max((slot.count / maxHourCount) * 100, 10) : 4;
              const isEvening = slot.hour >= 18 && slot.hour <= 23;
              return (
                <div key={slot.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      slot.count > 0
                        ? isEvening
                          ? "bg-purple-600 hover:bg-purple-700"
                          : "bg-[#25234A] hover:bg-[#383466]"
                        : "bg-slate-100"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                    title={`${slot.label}: ${slot.count} conversations`}
                  />
                  {slot.hour % 4 === 0 && (
                    <span className="text-[10px] text-[#5B5875] whitespace-nowrap mt-1">
                      {slot.label.replace(" ", "")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-[#5B5875]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#25234A]" />
              <span>Daytime (8 AM - 6 PM)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-purple-600" />
              <span>Evening peak (6 PM - 12 AM)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Star Rating Distribution Card */}
      <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-base font-bold text-[#25234A]">Visitor Experience & Feedback Ratings</h4>
          <p className="text-xs text-[#5B5875]">
            Visitors have the option to leave a voluntary star rating upon closing their conversation.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="flex flex-col items-center gap-1">
              <div className="flex items-center text-amber-500">
                <span className="text-xs font-bold mr-0.5">{stars}</span>
                <Star className="w-3.5 h-3.5 fill-amber-500" />
              </div>
              <span className="text-xs font-bold text-[#25234A]">
                {analytics.feedbackStats.distribution[stars] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

