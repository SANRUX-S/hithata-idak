"use client";

import { useState, useEffect, useRef } from "react";
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Eye, Hand, Ear, Wind, Heart, CheckCircle2 } from "lucide-react";
import { soundManager } from "@/lib/sound";

interface GroundingToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GroundingToolsModal({ isOpen, onClose }: GroundingToolsModalProps) {
  const [activeTab, setActiveTab] = useState<"breathing" | "sensory">("breathing");

  // 4-7-8 Breathing state
  const [breathPhase, setBreathPhase] = useState<"ready" | "inhale" | "hold" | "exhale">("ready");
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(4);
  const [isBreathingRunning, setIsBreathingRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [chimeEnabled, setChimeEnabled] = useState(true);

  // 5-4-3-2-1 Sensory Reset state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Breathing timer ref
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
    };
  }, []);

  // Breathing Logic (Inhale 4s -> Hold 7s -> Exhale 8s)
  useEffect(() => {
    if (!isBreathingRunning) {
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
      return;
    }

    if (breathPhase === "ready") {
      setBreathPhase("inhale");
      setPhaseSecondsLeft(4);
      if (chimeEnabled) soundManager.playBowlChime();
    }

    breathingTimerRef.current = setInterval(() => {
      setPhaseSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        // Transition phases
        if (breathPhase === "inhale") {
          setBreathPhase("hold");
          if (chimeEnabled) soundManager.playBowlChime();
          return 7;
        } else if (breathPhase === "hold") {
          setBreathPhase("exhale");
          if (chimeEnabled) soundManager.playBowlChime();
          return 8;
        } else if (breathPhase === "exhale") {
          setCycleCount((c) => c + 1);
          setBreathPhase("inhale");
          if (chimeEnabled) soundManager.playBowlChime();
          return 4;
        }
        return 4;
      });
    }, 1000);

    return () => {
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
    };
  }, [isBreathingRunning, breathPhase, chimeEnabled]);

  const toggleSensoryItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sensorySteps = [
    {
      id: "step_5",
      count: "5",
      icon: Eye,
      title: "5 දේවල් බලන්න (5 Things you can SEE)",
      subtitle: "ඔබ අවට පරිසරයේ ඇති වස්තූන් 5ක් දෙස සන්සුන්ව බලන්න.",
      examples: "ආලෝකය, බිත්තියේ පැහැය, මේසය, පොතක්, ඔබේ අත් දෙක",
      items: ["වස්තුව 1", "වස්තුව 2", "වස්තුව 3", "වස්තුව 4", "වස්තුව 5"],
    },
    {
      id: "step_4",
      count: "4",
      icon: Hand,
      title: "4 දේවල් ස්පර්ශ කරන්න (4 Things you can TOUCH)",
      subtitle: "ඔබේ ශරීරයට හෝ අතට දැනෙන ස්පර්ශයන් 4ක් අවධානයට ගන්න.",
      examples: "ඔබ වාඩි වී සිටින පුටුව, ඇඳුමේ රෙද්ද, මේසයේ මතුපිට, පොළොව",
      items: ["ස්පර්ශය 1", "ස්පර්ශය 2", "ස්පර්ශය 3", "ස්පර්ශය 4"],
    },
    {
      id: "step_3",
      count: "3",
      icon: Ear,
      title: "3 ශබ්ද අසන්න (3 Things you can HEAR)",
      subtitle: "ඔබේ කනට ඇසෙන බාහිර ශබ්ද 3ක් කෙරෙහි සවන් දෙන්න.",
      examples: "පංකාවේ/AC එකේ හඬ, පිටතින් ඇසෙන පක්ෂි/වාහන හඬ, ඔබේම හුස්ම",
      items: ["ශබ්දය 1", "ශබ්දය 2", "ශබ්දය 3"],
    },
    {
      id: "step_2",
      count: "2",
      icon: Wind,
      title: "2 සුවඳක් හඳුනාගන්න (2 Things you can SMELL)",
      subtitle: "ඔබ අවට වාතයේ ඇති ස්වභාවික සුවඳ 2ක් කෙරෙහි අවධානය යොමු කරන්න.",
      examples: "නැවුම් වාතය, තේ/කෝපි සුවඳ, ඇඳුමේ සුවඳ",
      items: ["සුවඳ 1", "සුවඳ 2"],
    },
    {
      id: "step_1",
      count: "1",
      icon: Heart,
      title: "1 සත්‍යයක් සිහිපත් කරන්න (1 TRUTH about yourself)",
      subtitle: "මේ මොහොතේ ඔබේ සිතට ශක්තියක් වන සත්‍යයක් සිතන්න.",
      examples: "මම මේ මොහොතේ ආරක්ෂිතයි • මේ දුෂ්කර හැඟීම තාවකාලිකයි • මම මීට කලින් දුෂ්කර දින ජයගෙන තිබෙනවා",
      items: ["මම ආරක්ෂිතයි සහ මගේ හැඟීම් තාවකාලිකයි."],
    },
  ];

  const totalSensoryItems = sensorySteps.reduce((acc, step) => acc + step.items.length, 0);
  const checkedSensoryCount = Object.values(checkedItems).filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25234A]/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#D4C7E8] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#EDE7F6] via-white to-[#EDE7F6] border-b border-[#E8E5DF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#25234A] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#25234A]">ක්ෂණික මනෝ සුව අභ්‍යාස (Calming Tools)</h2>
              <p className="text-xs text-[#5B5875]">සන්සුන් වීමට, හුස්ම ගැනීමට සහ ඔබේ හැඟීම් කළමනාකරණයට</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#5B5875] hover:text-[#25234A] hover:bg-white/80 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E8E5DF] bg-[#FAF9F7] px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("breathing")}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "breathing"
                ? "border-[#25234A] text-[#25234A]"
                : "border-transparent text-[#5B5875] hover:text-[#25234A]"
            }`}
          >
            <Wind className="w-4 h-4" />
            <span>4-7-8 Guided Breathing</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sensory")}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "sensory"
                ? "border-[#25234A] text-[#25234A]"
                : "border-transparent text-[#5B5875] hover:text-[#25234A]"
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>5-4-3-2-1 Sensory Grounding ({checkedSensoryCount}/{totalSensoryItems})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: 4-7-8 BREATHING */}
          {activeTab === "breathing" && (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#383466] bg-[#EDE7F6] px-3 py-1 rounded-full">
                  Vagus Nerve Calming Method
                </span>
                <h3 className="text-xl font-bold text-[#25234A]">4-7-8 සන්සුන් හුස්ම ගැනීමේ රිද්මය</h3>
                <p className="text-xs text-[#5B5875] max-w-md mx-auto">
                  නාසයෙන් තත්පර 4ක් හුස්ම ගන්න, තත්පර 7ක් රඳවාගෙන සිටින්න, සහ මුඛයෙන් තත්පර 8ක් සෙමින් පිටකරන්න.
                </p>
              </div>

              {/* Animated Breathing Orb */}
              <div className="relative flex items-center justify-center my-4 w-60 h-60">
                {/* Outer Ripple */}
                <div
                  className={`absolute rounded-full transition-all duration-1000 ${
                    breathPhase === "inhale"
                      ? "w-56 h-56 bg-indigo-200/50 scale-105"
                      : breathPhase === "hold"
                      ? "w-56 h-56 bg-teal-200/50 scale-100 animate-pulse"
                      : breathPhase === "exhale"
                      ? "w-36 h-36 bg-amber-200/40 scale-90"
                      : "w-40 h-40 bg-[#EDE7F6]"
                  }`}
                />

                {/* Inner Breathing Sphere */}
                <div
                  className={`relative z-10 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-1000 text-white ${
                    breathPhase === "inhale"
                      ? "w-48 h-48 bg-gradient-to-tr from-[#383466] to-[#675f9e] scale-105"
                      : breathPhase === "hold"
                      ? "w-48 h-48 bg-gradient-to-tr from-teal-700 to-teal-500 scale-100"
                      : breathPhase === "exhale"
                      ? "w-32 h-32 bg-gradient-to-tr from-amber-600 to-amber-500 scale-95"
                      : "w-36 h-36 bg-gradient-to-tr from-[#25234A] to-[#383466]"
                  }`}
                >
                  <span className="text-3xl font-extrabold tracking-tight">
                    {isBreathingRunning ? phaseSecondsLeft : "4-7-8"}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider mt-1 opacity-90">
                    {breathPhase === "ready" && "Ready"}
                    {breathPhase === "inhale" && "Inhale (නාසයෙන්)"}
                    {breathPhase === "hold" && "Hold (රඳවන්න)"}
                    {breathPhase === "exhale" && "Exhale (පිටකරන්න)"}
                  </span>
                </div>
              </div>

              {/* Status & Cycles */}
              <div className="flex items-center gap-4 text-xs text-[#5B5875]">
                <span>සම්පූර්ණ කළ වට: <strong className="text-[#25234A]">{cycleCount}</strong></span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setChimeEnabled(!chimeEnabled)}
                  className="flex items-center gap-1 hover:text-[#25234A]"
                >
                  {chimeEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{chimeEnabled ? "Chime On" : "Chime Muted"}</span>
                </button>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsBreathingRunning(!isBreathingRunning)}
                  className={`px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-xs transition-colors ${
                    isBreathingRunning
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-[#25234A] hover:bg-[#383466] text-white"
                  }`}
                >
                  {isBreathingRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isBreathingRunning ? "Pause" : "Start Breathing"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsBreathingRunning(false);
                    setBreathPhase("ready");
                    setPhaseSecondsLeft(4);
                    setCycleCount(0);
                  }}
                  className="p-2.5 rounded-2xl border border-[#E8E5DF] text-[#5B5875] hover:text-[#25234A] hover:bg-[#FAF9F7]"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: 5-4-3-2-1 SENSORY GROUNDING */}
          {activeTab === "sensory" && (
            <div className="space-y-4">
              <div className="text-center space-y-1 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#383466] bg-[#EDE7F6] px-3 py-1 rounded-full">
                  Cognitive Grounding Exercise
                </span>
                <h3 className="text-lg font-bold text-[#25234A]">පංච ඉන්ද්‍රිය සන්සුන් කිරීමේ අභ්‍යාසය</h3>
                <p className="text-xs text-[#5B5875]">
                  සිත කලබල වූ විට ඔබ සිටින සැබෑ මොහොතට මනස රැගෙන ඒමට මේ පියවර 5 එකින් එක සම්පූර්ණ කරන්න.
                </p>
              </div>

              {/* Progress bar */}
              <div className="bg-[#FAF9F7] p-3 rounded-2xl border border-[#E8E5DF] flex items-center justify-between text-xs">
                <span className="text-[#5B5875]">ප්‍රගතිය (Progress):</span>
                <span className="font-bold text-[#25234A]">
                  {checkedSensoryCount} / {totalSensoryItems} සම්පූර්ණයි ({Math.round((checkedSensoryCount / totalSensoryItems) * 100)}%)
                </span>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {sensorySteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.id}
                      className="p-4 rounded-2xl border border-[#E8E5DF] bg-white hover:border-[#D4C7E8] transition-colors space-y-2.5"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-[#EDE7F6] text-[#25234A] flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="w-4 h-4 text-[#383466]" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-[#25234A]">{step.title}</h4>
                          <p className="text-xs text-[#5B5875]">{step.subtitle}</p>
                          <div className="text-[11px] text-[#383466] italic mt-0.5">උදාහරණ: {step.examples}</div>
                        </div>
                      </div>

                      {/* Tickable item pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1 pl-9">
                        {step.items.map((itemText, idx) => {
                          const itemId = `${step.id}_${idx}`;
                          const isChecked = Boolean(checkedItems[itemId]);
                          return (
                            <button
                              key={itemId}
                              type="button"
                              onClick={() => toggleSensoryItem(itemId)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                                isChecked
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs"
                                  : "bg-[#FAF9F7] border-[#E8E5DF] text-[#5B5875] hover:bg-[#EDE7F6]"
                              }`}
                            >
                              <CheckCircle2
                                className={`w-3.5 h-3.5 ${isChecked ? "text-emerald-600 fill-emerald-100" : "text-slate-300"}`}
                              />
                              <span>{itemText}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {checkedSensoryCount === totalSensoryItems && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center text-xs font-semibold animate-fadeIn">
                  🌸 ඉතාම විශිෂ්ටයි! ඔබ සන්සුන්ව පියවර 5ම සම්පූර්ණ කළා. ඔබේ ශරීරය සහ මනස දැන් වඩාත් සන්සුන් බව මතක තබාගන්න.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAF9F7] border-t border-[#E8E5DF] flex items-center justify-between text-xs text-[#5B5875]">
          <span>හදිසි උපකාර සඳහා 24/7 නොමිලේ අමතන්න: <strong className="text-[#25234A]">1926</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#25234A] text-white font-bold hover:bg-[#383466] transition-colors"
          >
            සම්පූර්ණයි (Done)
          </button>
        </div>
      </div>
    </div>
  );
}

