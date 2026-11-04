"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  PhoneCall,
  ExternalLink,
  Search,
  AlertCircle,
} from "lucide-react";

export default function HelpAndResourcesPage() {
  const [selectedArticleIndex, setSelectedArticleIndex] = useState<number | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Feedback form state
  const [feedbackType, setFeedbackType] = useState("general");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const articles = [
    {
      title: "Managing Everyday Stress",
      sinhala: "දෛනික මානසික ආතතිය පාලනය කර ගැනීම",
      readTime: "4 min read",
      category: "Self-Care & Calm",
      summary:
        "Practical, groundable strategies for recognizing sensory tension, regulating your nervous system with mindful breathing, and reducing daily overwhelm.",
      content: `When stress accumulates over days or weeks, our bodies often register it before our conscious thoughts do. You might notice tightness in your shoulders, clenched jaws, shallow breathing, or difficulty sleeping.

### What is Happening in the Body?
When life demands exceed our perceived resources, the sympathetic nervous system triggers the natural fight-or-flight response. Adrenaline and cortisol rise. This is an adaptive physiological mechanism, but when sustained without rest, it leads to exhaustion and irritability.

### Evidence-Informed Grounding Techniques:
1. **The 4-7-8 Breathing Rhythm:**
   Inhale gently through your nose for 4 counts. Hold softly for 7 counts. Exhale slowly and completely through your mouth for 8 counts. Repeat 4 times to signal safety to your vagus nerve.
2. **The 5-4-3-2-1 Sensory Reset:**
   When thoughts race, anchor yourself in your immediate environment. Name:
   - 5 things you can see around you
   - 4 things you can physically touch (the chair beneath you, fabric of your shirt)
   - 3 sounds you can hear in the distance
   - 2 scents you can notice
   - 1 taste or sensation in your mouth
3. **Gentle Boundary Setting:**
   Grant yourself permission to say 'not right now'. You do not have to reply to every message instantly or take on others' crises when your own vessel is depleted.`,
    },
    {
      title: "Understanding Difficult Emotions",
      sinhala: "දුෂ්කර හැඟීම් තේරුම් ගැනීම සහ පිළිගැනීම",
      readTime: "5 min read",
      category: "Emotional Awareness",
      summary:
        "Learning to observe grief, sadness, anger, and anxiety without immediately judging yourself or trying to force them away.",
      content: `In many cultural environments, we are taught to suppress negative emotions. We hear phrases like "don't cry", "be strong", or "think positive". However, psychological research shows that suppressing painful emotions often amplifies them over time.

### Emotions are Messengers, Not Verdicts
Sadness points toward something or someone you cared about deeply. Anger often signals that a personal boundary has been crossed or an unfairness has occurred. Fear signals that you feel vulnerable or uncertain about the future.

### Practical Steps for Difficult Days:
- **Name the Emotion Specifically:** Instead of saying "I feel terrible", try exploring: "I feel disappointed", "I feel abandoned", or "I feel overlooked". Naming creates cognitive distance from the overwhelming surge.
- **Allow the Physical Wave to Peak:** Emotions are like ocean waves. They rise, reach a crest, and gradually subside if we don't fight them. Give yourself 10 minutes to simply breathe and allow the feeling to exist without attempting to fix it immediately.
- **Replace Self-Criticism with Self-Compassion:** Ask yourself: *How would I speak to a dear friend experiencing this exact feeling right now?* Speak to yourself with that same gentle tone.`,
    },
    {
      title: "Communication and Relationships",
      sinhala: "සබඳතා සහ නිරවුල් සන්නිවේදනය",
      readTime: "4 min read",
      category: "Relationships",
      summary:
        "How to express your boundaries, listen without becoming defensive, and navigate painful disagreements with care.",
      content: `Healthy human connection requires both empathy and clear personal boundaries. When disagreements arise, emotional distress often stems from feeling unheard rather than the disagreement itself.

### Key Principles of Nonviolent Communication:
- **Use 'I' Statements Instead of Accusatory 'You' Statements:**
  Instead of: *"You never listen to me and you don't care about my feelings!"*
  Try: *"When you look at your phone while I'm talking, I feel lonely and unheard because our connection matters to me."*
- **Listen to Understand, Not to Defend:**
  Notice the impulse to prepare your rebuttal while the other person is still speaking. Try pausing and summarizing what you heard before responding: *"It sounds like you felt really stressed by how that was handled. Did I get that right?"*
- **Take a Time-Out When Flooded:**
  If heart rates spike and voices rise, rational thinking diminishes. It is completely healthy to say: *"I care about our relationship and I want to resolve this, but I'm feeling overwhelmed right now. Can we take a 30-minute break and return to this calmly?"*`,
    },
    {
      title: "Coping With Change",
      sinhala: "ජීවිතයේ වෙනස්වීම් හමුවේ නොසැලී සිටීම",
      readTime: "4 min read",
      category: "Transitions",
      summary:
        "Finding your footing during major life transitions—moving, relationship changes, health shifts, or unexpected disruptions.",
      content: `Human beings are biologically wired to crave predictability and routine. When life takes an unexpected turn—whether through relocation, loss of employment, a breakup, or health shifts—our equilibrium is profoundly shaken.

### The Stages of Adapting to Change:
Transition involves ending what was, navigating an uncomfortable in-between space (often called the neutral zone), and gradually beginning a new chapter.

### Helpful Practices During Uncertainty:
1. **Identify What Remains Stable:** In times of turmoil, list 3 to 5 things that have not changed: your core values, a trusting friendship, your ability to take a walk, or the sunrise each morning.
2. **Focus on the Next Small Step:** Do not try to plan the next five years when you are adjusting to an acute shift. Focus solely on: *What is the kindest, most responsible thing I can do in the next 2 hours?*
3. **Mourn What Was Lost:** Every major change involves a quiet form of grief for what might have been. Honor that sadness rather than rushing yourself to adapt instantly.`,
    },
    {
      title: "Study and Work Pressure",
      sinhala: "අධ්‍යාපනික සහ රැකියා පීඩනය සමනය කර ගැනීම",
      readTime: "5 min read",
      category: "Burnout Prevention",
      summary:
        "Recognizing burnout before it takes hold, untangling your self-worth from achievement, and structuring sustainable daily rhythms.",
      content: `In hyper-competitive academic and professional cultures, our self-worth is frequently conflated with productivity, grades, and external validation.

### Signs of Looming Burnout:
- Chronic fatigue that sleep does not seem to resolve
- Cynicism or emotional detachment from tasks you once enjoyed
- Difficulty concentrating and memory lapses
- Feeling that no matter how much you do, it is never enough

### Reclaiming Balance:
- **Protect Deliberate Rest:** Rest is not a reward you earn after finishing every chore; it is a biological prerequisite for living.
- **The 25-Minute Focus Block (Pomodoro):** Break overwhelming study sessions into 25 minutes of single-task focus followed by 5 minutes of moving away from all screens.
- **Separate Identity from Outcome:** A difficult exam, rejected job application, or critical review reflects a snapshot of a circumstance—it does not define your intrinsic dignity as a human being.`,
    },
    {
      title: "Building Healthy Support Networks",
      sinhala: "යහපත් මිතුරු හා ආධාරක ජාලයක් ගොඩනගා ගැනීම",
      readTime: "4 min read",
      category: "Community",
      summary:
        "Recognizing reciprocal relationships, cultivating friendships that nurture your wellbeing, and letting go of draining dynamics.",
      content: `Loneliness is not simply the absence of people; it is the absence of meaningful, emotionally safe connection.

### Characteristics of Safe Relationships:
- You feel calmer and lighter after speaking with them, rather than drained or walking on eggshells.
- They celebrate your milestones without subtle jealousy.
- They respect your "no" without guilt-tripping or withdrawal.
- Both vulnerability and joy are welcomed in equal measure.

### Cultivating Connection:
Start small. Reach out to one acquaintance with an authentic inquiry: *"I was thinking of you today. How has your week truly been?"* Shared interest groups, volunteer work, and community gatherings provide organic soil for enduring friendships.`,
    },
    {
      title: "Understanding When to Seek Professional Help",
      sinhala: "වෘත්තීය උපදේශනය හෝ වෛද්‍ය සහාය ලබාගත යුතු අවස්ථා",
      readTime: "5 min read",
      category: "Clinical Care",
      summary:
        "Clear guidance on recognizing the boundary between everyday emotional strain and clinical conditions that benefit from psychotherapy or psychiatric care.",
      content: `Peer listening and emotional support platforms like Hithata Idak provide immense warmth, but they are not a substitute for clinical psychotherapy or psychiatric diagnosis.

### Indicators That Warrant Professional Consultation:
- Emotional distress persisting nearly every day for more than two consecutive weeks
- Inability to perform basic daily functions (eating, sleeping, hygiene, attending school/work)
- Severe panic attacks, intrusive traumatic flashbacks, or uncontrollable racing thoughts
- Relying on alcohol, substances, or self-harming behaviors to cope with psychic pain
- Persistent feelings of worthlessness, hopelessness, or thoughts of not wanting to wake up

### Types of Mental Health Professionals:
- **Clinical Psychologist / Psychotherapist:** Provides structured talk therapy (such as Cognitive Behavioral Therapy - CBT) to explore patterns and develop coping skills.
- **Psychiatrist:** A medical doctor specializing in mental health who can diagnose psychiatric illnesses and prescribe medical treatments if appropriate.
- **Psychiatric Social Worker / Counselor:** Offers community support, crisis guidance, and family interventions.

*Seeking professional care is a profound act of courage and self-respect, never a weakness.*`,
    },
    {
      title: "Supporting a Friend Who Is Struggling",
      sinhala: "අපහසුතාවකට පත්ව සිටින මිතුරෙකුට සහාය වීම",
      readTime: "4 min read",
      category: "Befriending",
      summary:
        "How to hold space, listen without offering unsolicited fixes, and provide compassionate accompaniment to someone in pain.",
      content: `When someone we care about is hurting, our initial instinct is often to offer quick solutions: *"Have you tried working out?", "Look at the bright side!", "Everything happens for a reason."* While well-intentioned, unsolicited advice can inadvertently make the person feel invalidated.

### What Actually Helps:
1. **Listen with Undivided Attention:** Put away your phone. Make gentle eye contact. Allow comfortable silences without rushing to fill the gap.
2. **Validate Their Experience:**
   - *"That sounds really exhausting. Thank you for telling me."*
   - *"I don't have all the answers, but I am right here with you."*
3. **Offer Specific, Concrete Help:**
   Instead of: *"Let me know if you need anything!"* (which places the burden of asking on the exhausted person)
   Try: *"I am going to the grocery store today. Can I pick up dinner for you?"* or *"Can I sit with you quietly while you study?"*
4. **Know When to Encourage Help:** If your friend hints at hopelessness or self-harm, stay calm, stay with them, and gently offer to call the national helpline (1926) together.`,
    },
  ];

  const faqs = [
    {
      q: "Is Hithata Idak free?",
      a: "Yes. Hithata Idak is 100% free for all visitors. We believe compassionate emotional listening should be universally accessible without financial barriers.",
    },
    {
      q: "Do I need to create an account?",
      a: "No. You never need an account, password, full name, email address, or phone number to talk. We automatically generate an unpredictable ticket reference for your conversation.",
    },
    {
      q: "Can I chat in Sinhala?",
      a: "Yes. Our platform fully supports Sinhala Unicode (සිංහල යුනිකෝඩ්), English, and informal Singlish (Sinhala written in English letters).",
    },
    {
      q: "Can I speak with a real person?",
      a: "Yes. All conversations are answered by trained human volunteers. We never substitute artificial intelligence or scripted bots for human empathy.",
    },
    {
      q: "Will my conversation remain private?",
      a: "Yes. Messages are encrypted in transit via HTTPS and encrypted at rest using AES-256-GCM. Only you and your assigned supporter (or a supervisor during safety escalations) have access.",
    },
    {
      q: "What happens if no supporter is available?",
      a: "We are honest about availability. If all volunteers are assisting others or outside active hours (8:00 AM – 10:00 PM IST), we display our status clearly and provide verified 24/7 crisis hotlines.",
    },
    {
      q: "Can I resume an old conversation?",
      a: "Yes. When you start, you receive a private Recovery Key shown once. You can return from any browser using your Ticket Reference and Recovery Key.",
    },
    {
      q: "How can I delete my chat?",
      a: "You can click 'End Chat' and select 'Permanently Delete Conversation'. This immediately queues all encrypted message content for complete shredding.",
    },
    {
      q: "Is this professional counselling?",
      a: "No. Hithata Idak provides compassionate peer listening and emotional support. Our volunteers do not diagnose mental health conditions or replace licensed medical/psychiatric care.",
    },
    {
      q: "How can I become a volunteer?",
      a: "You can submit an expression of interest via our Our Story page. All applicants undergo identity verification, listening training, and supervisory review before supporting visitors.",
    },
  ];

  const directories = [
    {
      name: "National Mental Health Helpline",
      number: "1926",
      desc: "Free, toll-free 24/7 government mental health emergency helpline operated by the National Institute of Mental Health (NIMH) Angoda.",
      badge: "24/7 Official Helpline",
    },
    {
      name: "Sumithrayo Befriending Service",
      number: "011 269 2909 / 011 269 6666",
      desc: "Pioneering emotional support and suicide prevention charity in Sri Lanka, offering nonjudgmental confidential listening since 1974.",
      badge: "Befriending Organization",
    },
    {
      name: "CCCline (Courage Compassion Commitment)",
      number: "1333",
      desc: "Free 24-hour telephone counseling service providing telephone befriending across all major languages in Sri Lanka.",
      badge: "Toll-Free 24/7",
    },
    {
      name: "Sri Lanka ChildLine",
      number: "1929",
      desc: "National Child Protection Authority toll-free emergency helpline dedicated to children and teenagers in distress.",
      badge: "Youth & Child Protection",
    },
    {
      name: "Shanthi Maargam",
      number: "071 763 9898",
      desc: "Youth-focused community center providing free professional counseling and emotional support for adolescents and young adults.",
      badge: "Youth Focused",
    },
  ];

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingFeedback(true);
    setFeedbackError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackType,
          rating: feedbackRating,
          message: feedbackMessage,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit feedback");
      }

      setFeedbackSuccess(true);
      setFeedbackMessage("");
    } catch (err: unknown) {
      setFeedbackError(err instanceof Error && err.message ? err.message : "Failed to submit feedback.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.sinhala.includes(searchQuery)
  );

  return (
    <div className="flex flex-col bg-[#FAF9F7]">
      {/* HERO SECTION */}
      <section className="relative py-20 md:py-24 bg-gradient-to-b from-[#EDE7F6]/50 via-[#FAF9F7] to-[#FAF9F7] border-b border-[#E8E5DF]/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#D4C7E8] text-xs font-semibold text-[#25234A] shadow-2xs">
            <BookOpen className="w-4 h-4 text-[#25234A]" />
            <span>Practical Insights & Frequently Asked Questions</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#25234A] tracking-tight">
            Helpful Resources for Difficult Days.
          </h1>

          <p className="text-lg sm:text-xl text-[#5B5875] max-w-2xl mx-auto leading-relaxed">
            Short, accessible, evidence-informed guides and verified professional contacts to support you when life feels heavy.
          </p>
        </div>
      </section>

      {/* VERIFIED CRISIS DIRECTORY */}
      <section className="py-12 bg-white border-b border-[#E8E5DF]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#383466] bg-[#EDE7F6] px-3 py-1 rounded-full">
                Verified Directory
              </span>
              <h2 className="text-2xl font-bold text-[#25234A] mt-2">
                Emergency & Professional Support in Sri Lanka
              </h2>
            </div>
            <p className="text-xs text-[#5B5875] max-w-md">
              These verified organizations provide free, confidential assistance across Sri Lanka.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {directories.map((dir, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#FAF9F7] border border-[#E8E5DF] hover:border-[#D4C7E8] shadow-2xs transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-[#E8E5DF] text-[#5B5875]">
                      {dir.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#25234A]">{dir.name}</h3>
                  <p className="text-xs text-[#5B5875] leading-relaxed">{dir.desc}</p>
                </div>
                <div className="pt-3 border-t border-[#E8E5DF]/60">
                  <a
                    href={`tel:${dir.number.split("/")[0].trim().replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-2 text-sm font-extrabold text-[#25234A] hover:text-[#383466]"
                  >
                    <PhoneCall className="w-4 h-4 text-emerald-700" />
                    <span>{dir.number}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 EVIDENCE-INFORMED SELF-CARE ARTICLES */}
      <section className="py-20 bg-[#FAF9F7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#383466] bg-[#EDE7F6] px-3.5 py-1 rounded-full">
              Self-Care & Understanding
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#25234A] tracking-tight">
              Evidence-Informed Guides
            </h2>
            <p className="text-base text-[#5B5875] leading-relaxed">
              Explore short, grounded reads on navigating stress, relationships, boundaries, and emotional awareness.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-[#5B5875] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides by topic or keyword..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#E8E5DF] bg-white text-sm focus:border-[#25234A] focus:ring-1 focus:ring-[#25234A] shadow-2xs"
            />
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredArticles.map((art, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-[#E8E5DF] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-[#5B5875]">
                    <span className="font-semibold text-[#25234A] px-2 py-0.5 rounded-full bg-[#EDE7F6]">
                      {art.category}
                    </span>
                    <span>{art.readTime}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#25234A] leading-snug">
                    {art.title}
                  </h3>
                  <div className="text-xs font-sinhala text-[#5B5875]">{art.sinhala}</div>
                  <p className="text-xs text-[#5B5875] leading-relaxed">{art.summary}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#E8E5DF]/60">
                  <button
                    type="button"
                    onClick={() => setSelectedArticleIndex(idx)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#25234A] hover:text-[#383466]"
                  >
                    <span>Read Full Guide</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-center text-[#5B5875] italic max-w-xl mx-auto">
            * Note: These educational articles provide everyday self-care reflections and do not guarantee emotional recovery or substitute for clinical medical intervention.
          </p>
        </div>
      </section>

      {/* ARTICLE MODAL / FULL READER */}
      {selectedArticleIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E8E5DF] max-h-[85vh] overflow-y-auto space-y-5 animate-scaleUp">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E8E5DF]">
              <div className="space-y-1">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EDE7F6] text-[#25234A]">
                  {articles[selectedArticleIndex].category}
                </span>
                <h3 className="text-2xl font-bold text-[#25234A]">
                  {articles[selectedArticleIndex].title}
                </h3>
                <p className="text-xs font-sinhala text-[#5B5875]">
                  {articles[selectedArticleIndex].sinhala}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArticleIndex(null)}
                className="w-8 h-8 rounded-full bg-[#FAF9F7] border border-[#E8E5DF] text-[#5B5875] hover:text-[#25234A] flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="prose prose-sm text-[#25234A] space-y-4 leading-relaxed">
              {articles[selectedArticleIndex].content.split("\n\n").map((para, pIdx) => {
                if (para.startsWith("### ")) {
                  return (
                    <h4 key={pIdx} className="text-base font-bold text-[#25234A] pt-2">
                      {para.replace("### ", "")}
                    </h4>
                  );
                }
                return (
                  <p key={pIdx} className="text-xs sm:text-sm text-[#5B5875] leading-relaxed">
                    {para}
                  </p>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#E8E5DF] flex items-center justify-between">
              <span className="text-xs text-[#5B5875]">Hithata Idak Wellbeing Series</span>
              <button
                type="button"
                onClick={() => setSelectedArticleIndex(null)}
                className="px-5 py-2 rounded-xl bg-[#25234A] text-white text-xs font-semibold"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: FAQ ACCORDION (ALL 10 REQUIRED QUESTIONS) */}
      <section className="py-20 bg-white border-t border-[#E8E5DF]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#383466] bg-[#EDE7F6] px-3.5 py-1 rounded-full">
              Common Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#25234A]">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#5B5875]">
              Everything you need to know about our free emotional listening service.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#E8E5DF] bg-[#FAF9F7] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#25234A]"
                  >
                    <span>{faq.q}</span>
                    <span className="w-6 h-6 rounded-full bg-white border border-[#E8E5DF] flex items-center justify-center shrink-0 text-[#5B5875]">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#5B5875] leading-relaxed border-t border-[#E8E5DF]/60 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION: GENERAL CONTACT & FEEDBACK FORM */}
      <section className="py-20 bg-[#FAF9F7] border-t border-[#E8E5DF]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#383466] bg-[#EDE7F6] px-3.5 py-1 rounded-full">
              We Value Your Voice
            </span>
            <h2 className="text-3xl font-bold text-[#25234A]">Contact & General Feedback</h2>
            <p className="text-xs sm:text-sm text-[#5B5875] leading-relaxed">
              Have questions about our nonprofit project, suggestions for resources, or general website feedback? This form is kept completely separate from private support conversations.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E5DF] shadow-md space-y-4">
            {feedbackSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center font-bold">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-emerald-900">Thank You for Your Message</h3>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Your comments help us continue refining our platform to be welcoming, accessible, and safe.
                </p>
                <button
                  type="button"
                  onClick={() => setFeedbackSuccess(false)}
                  className="px-5 py-2 rounded-xl bg-[#25234A] text-white text-xs font-semibold"
                >
                  Submit Another Feedback Note
                </button>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                {feedbackError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{feedbackError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#25234A] mb-1.5">
                    Feedback Category *
                  </label>
                  <select
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DF] text-xs sm:text-sm bg-[#FAF9F7]"
                  >
                    <option value="general">General Inquiries / Greetings</option>
                    <option value="website_experience">Website Usability & Accessibility</option>
                    <option value="resource_suggestion">Suggesting a Community Resource / Clinic</option>
                    <option value="partnership">Academic / Non-profit Collaboration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#25234A] mb-1.5">
                    Your Overall Impression (1 - 5)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-colors ${
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
                  <label className="block text-xs font-bold text-[#25234A] mb-1.5">
                    Your Message / Suggestions *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Share your general feedback or suggestions here..."
                    className="w-full p-3.5 rounded-xl border border-[#E8E5DF] text-xs sm:text-sm bg-[#FAF9F7] resize-none"
                  />
                  <p className="text-[11px] text-[#5B5875] mt-1">
                    * Please do not share private emotional crisis details here. Use our <Link href="/chat" className="underline font-semibold text-[#25234A]">Start Chat</Link> page for confidential support.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="w-full py-3 px-6 rounded-2xl text-xs sm:text-sm font-bold text-white bg-[#25234A] hover:bg-[#383466] shadow-sm transition-all disabled:opacity-50"
                  >
                    {isSubmittingFeedback ? "Sending Feedback..." : "Submit Feedback"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

