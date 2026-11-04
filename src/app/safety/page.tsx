"use client";

import { useState } from "react";
import {
  AlertTriangle,
  PhoneCall,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

export default function SafetyAndPrivacyPage() {
  const [reportData, setReportData] = useState({
    reportType: "supporter_behavior",
    ticketRef: "",
    description: "",
    contactEmail: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState("");

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setReportError("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit report");
      }

      setReportSuccess(true);
      setReportData({
        reportType: "supporter_behavior",
        ticketRef: "",
        description: "",
        contactEmail: "",
      });
    } catch (err: unknown) {
      setReportError(err instanceof Error && err.message ? err.message : "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = [
    {
      id: "anonymous-conversations",
      num: "01",
      title: "Anonymous Conversations",
      content:
        "You do not need to register an account, log in with Google, or provide your real name, email address, phone number, home address, or social media handles. When you begin a conversation, our system automatically generates an unpredictable, non-sequential ticket reference (such as HID-7F2K9M) and a private cryptographic recovery credential. You remain in control of your identity at all times.",
    },
    {
      id: "what-we-collect",
      num: "02",
      title: "What Information We Collect",
      content:
        "We follow strict data minimization principles under the Sri Lankan Personal Data Protection Act (PDPA No. 9 of 2022). We collect only: (a) your chosen conversation language (Sinhala or English); (b) an optional general topic preference if selected; (c) the message text you willingly type; (d) timestamps for message ordering; and (e) optional voluntary feedback ratings after a chat. We do not use third-party behavioral ad trackers, commercial marketing pixels, or device fingerprinting scripts.",
    },
    {
      id: "how-we-protect",
      num: "03",
      title: "How We Protect Your Messages",
      content:
        "All traffic between your device and our servers is encrypted in transit using industry-standard HTTPS / TLS. Sensitive conversation messages are stored encrypted at rest using AES-256-GCM authenticated encryption with keys managed in secure server environments. Recovery codes are never stored in plaintext; only a one-way HMAC-SHA256 hash verifier with a unique cryptographic salt is retained.",
    },
    {
      id: "who-can-access",
      num: "04",
      title: "Who Can Access Conversations",
      content:
        "Chat contents are strictly accessible only to: (1) you, while in possession of your active session cookie or matching private recovery credential; (2) the single trained volunteer supporter assigned to your active chat; and (3) authorized platform supervisors exclusively when safety escalation, serious self-harm risk, or user misconduct is flagged. Volunteers cannot browse or inspect other volunteers' conversations.",
    },
    {
      id: "retention-deletion",
      num: "05",
      title: "Data Retention & Deletion",
      content:
        "We do not store conversations indefinitely. Active conversation records are subject to a configurable 30-day retention schedule, after which expired message contents are systematically deleted. Visitors can also request immediate permanent data shredding at the conclusion of their chat or via our privacy interface, which completely purges message bodies and recovery credentials from the database.",
    },
    {
      id: "volunteer-confidentiality",
      num: "06",
      title: "Volunteer Confidentiality",
      content:
        "Every approved volunteer supporter and supervisor signs a binding volunteer confidentiality agreement before being assigned shifts. Volunteers are strictly prohibited from copying, capturing screenshots, discussing, or disseminating any visitor conversation outside supervised peer debriefings. Supporter display names are aliases or approved first names to protect mutual dignity.",
    },
    {
      id: "choices-privacy-requests",
      num: "07",
      title: "Your Choices & Privacy Requests",
      content:
        "You have complete autonomy over your interaction. You can end a conversation at any moment by clicking 'End Chat'. You can request immediate cryptographic shredding of your conversation. If you have questions regarding personal data or wish to exercise rights under the Sri Lankan Personal Data Protection Act, you can contact our privacy supervisory channel directly.",
    },
    {
      id: "safety-limitations",
      num: "08",
      title: "Important Safety Limitations",
      content:
        "No online system can honestly guarantee 100% absolute anonymity or unbreakable encryption. Furthermore, if a visitor discloses immediate, life-threatening intent to inflict severe harm upon themselves or another identifiable person, or discloses active child abuse, our duty of care and ethical safeguarding protocols require supervisors to provide immediate crisis intervention hotlines and take responsible action.",
    },
    {
      id: "reporting-misconduct",
      num: "09",
      title: "Reporting Misconduct",
      content:
        "If you ever experience inappropriate behavior, disrespectful language, boundary violations, or privacy concerns from a supporter, we take it with utmost seriousness. Use the secure reporting form below to lodge an immediate incident report. Reports bypass general volunteers and land directly with senior supervisors.",
    },
    {
      id: "contacting-our-team",
      num: "10",
      title: "Contacting Our Team",
      content:
        "For non-emergency questions regarding platform governance, research collaboration, ethics compliance, or safeguarding partnerships, contact us at privacy@hithataidak.lk or through the feedback form on our Help & Resources page.",
    },
  ];

  return (
    <div className="flex flex-col bg-[#faf9f6]">
      {/* HERO SECTION */}
      <section className="relative py-20 md:py-24 bg-[#faf9f6] border-b border-[#e5e1db]/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="text-sm font-medium tracking-wide text-[#655f6a]">
            <span>Integrity, Safeguards & Legal Grounding</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#3c3654] tracking-tight">
            Your Trust Matters to Us.
          </h1>

          <p className="text-lg sm:text-xl text-[#655f6a] max-w-2xl mx-auto leading-relaxed">
            We aim to create a respectful space where you can share your thoughts while understanding how your information is handled and protected.
          </p>
        </div>
      </section>

      {/* CORE BOUNDARIES & IMMEDIATE CRISIS ASSISTANCE */}
      <section className="py-12 bg-white border-b border-[#e5e1db]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Support Boundaries Notice */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#edf2eb] border border-[#dce4d8] space-y-3">
            <div className="flex items-center gap-2 text-[#3c3654] font-bold text-base sm:text-lg">
              <span>Clear Support Boundaries</span>
            </div>
            <p className="text-base text-[#3c3654] font-medium leading-relaxed">
              &ldquo;Hithata Idak offers emotional listening and supportive conversations. Our volunteers do not diagnose mental health conditions, prescribe treatment, or replace qualified healthcare professionals.&rdquo;
            </p>
            <p className="text-base text-[#655f6a] leading-relaxed">
              We provide empathetic human presence for life challenges, feelings of loneliness, and everyday stress. If you are experiencing acute psychiatric distress or clinical disorders, we strongly encourage speaking with a licensed psychiatrist or psychologist.
            </p>
          </div>

          {/* Immediate Assistance & Crisis Hotlines */}
          <div className="p-6 sm:p-8 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-base sm:text-lg">
              <AlertTriangle className="w-6 h-6 text-amber-700" />
              <span>Immediate Assistance & Emergency Services</span>
            </div>
            <p className="text-base text-amber-900 leading-relaxed">
              Hithata Idak is <strong>not an emergency or crisis intervention service</strong>. If you or someone you know is in immediate danger of self-harm, medical emergency, or physical violence, please use these verified 24/7 resources:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-amber-200 space-y-1">
                <span className="text-sm font-semibold text-amber-900 uppercase tracking-wider block">
                  Sri Lanka National Mental Health Helpline
                </span>
                <a href="tel:1926" className="text-xl font-extrabold text-[#3c3654] hover:underline flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-emerald-700" />
                  <span>1926 (Toll-Free, 24/7)</span>
                </a>
                <a
                  href="https://nimh.health.gov.lk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#655f6a] hover:text-[#3c3654] inline-flex items-center gap-1 mt-1"
                >
                  National Institute of Mental Health (NIMH)
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-amber-200 space-y-1">
                <span className="text-sm font-semibold text-amber-900 uppercase tracking-wider block">
                  Sumithrayo Emotional Support Helpline
                </span>
                <a href="tel:+94112692909" className="text-base font-bold text-[#3c3654] hover:underline flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-700" />
                  <span>011 269 2909 / 011 269 6666</span>
                </a>
                <p className="text-base text-[#655f6a]">
                  Providing compassionate befriending across Sri Lanka since 1974.
                </p>
              </div>
            </div>

            <p className="text-base text-amber-800 pt-1">
              * For visitors outside Sri Lanka: Please dial your local national emergency number (such as 911, 999, 112) or reach out to local crisis hotlines immediately.
            </p>
          </div>

          {/* Protecting Younger Visitors */}
          <div className="p-6 rounded-2xl bg-white border border-[#e5e1db] space-y-3">
            <div className="flex items-center gap-2 text-[#3c3654] font-bold text-base">
              <span>Protecting Younger Visitors</span>
            </div>
            <p className="text-base text-[#655f6a] leading-relaxed">
              We apply strict age-appropriate safeguards for children and teenagers. Our supporters are specifically instructed never to ask young visitors for unnecessary personal details, school names, addresses, or private photos. When young people express overwhelming family distress or safety concerns, supporters provide clear, gentle routing to trusted adults, school counselors, or child protection hotlines (Sri Lanka ChildLine: <strong>1929</strong>).
            </p>
          </div>
        </div>
      </section>

      {/* 10 REQUIRED PRIVACY SECTIONS */}
      <section className="py-20 bg-[#faf9f6]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-sm font-medium tracking-wide text-[#655f6a]">
              Privacy Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#3c3654] tracking-tight">
              Detailed Privacy & Safety Commitments
            </h2>
            <p className="text-base text-[#655f6a] leading-relaxed">
              Read how your data is treated at every stage of your visit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sections.map((sec) => {
              return (
                <div
                  key={sec.id}
                  id={sec.id}
                  className="p-7 rounded-2xl bg-white border border-[#e5e1db] shadow-none hover:border-[#ded9e2] transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#655f6a]">
                      Section {sec.num}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#3c3654]">{sec.title}</h3>
                  <p className="text-base text-[#655f6a] leading-relaxed">{sec.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION: REPORTING MISCONDUCT */}
      <section id="reporting" className="py-20 bg-white border-t border-[#e5e1db]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <span className="text-sm font-medium tracking-wide text-[#655f6a]">
              Accountability Channel
            </span>
            <h2 className="text-3xl font-bold text-[#3c3654]">Report Misconduct or Safety Concerns</h2>
            <p className="text-base text-[#655f6a] leading-relaxed">
              If a supporter violated boundaries, acted disrespectfully, or you observed technical/privacy misuse, please let our supervisory team know immediately.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-[#faf9f6] border border-[#e5e1db] shadow-none">
            {reportSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center font-bold">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-emerald-900">Report Delivered to Supervisors</h3>
                <p className="text-base text-emerald-800 leading-relaxed">
                  Thank you for bringing this to our attention. Your report has been dispatched to lead platform supervisors for independent review.
                </p>
                <button
                  type="button"
                  onClick={() => setReportSuccess(false)}
                  className="mt-2 px-5 py-2 rounded-xl bg-[#3c3654] text-white text-sm font-semibold"
                >
                  Submit Another Report
                </button>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                {reportError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{reportError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-[#3c3654] mb-1.5">
                    Incident Type *
                  </label>
                  <select
                    value={reportData.reportType}
                    onChange={(e) => setReportData({ ...reportData, reportType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1db] text-base bg-white"
                  >
                    <option value="supporter_behavior">Inappropriate Supporter Behavior</option>
                    <option value="privacy_concern">Privacy / Data Concern</option>
                    <option value="harassment">Harassment or Insensitive Conduct</option>
                    <option value="platform_misuse">Platform Misuse or Spam</option>
                    <option value="technical_issue">Technical Vulnerability or Error</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#3c3654] mb-1.5">
                    Ticket Reference (Optional, if related to a specific chat)
                  </label>
                  <input
                    type="text"
                    value={reportData.ticketRef}
                    onChange={(e) => setReportData({ ...reportData, ticketRef: e.target.value })}
                    placeholder="e.g. HID-7F2K9M"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1db] text-base bg-white font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#3c3654] mb-1.5">
                    Description of What Happened *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={reportData.description}
                    onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                    placeholder="Please explain the incident with as much detail as you feel comfortable sharing..."
                    className="w-full p-3 rounded-xl border border-[#e5e1db] text-base bg-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#3c3654] mb-1.5">
                    Your Contact Email (Optional, if you wish to receive an outcome update)
                  </label>
                  <input
                    type="email"
                    value={reportData.contactEmail}
                    onChange={(e) => setReportData({ ...reportData, contactEmail: e.target.value })}
                    placeholder="optional.email@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1db] text-base bg-white"
                  />
                  <p className="text-base text-[#655f6a] mt-1">
                    You may leave this blank to remain completely anonymous.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-6 rounded-2xl text-base font-bold text-white bg-[#3c3654] hover:bg-[#504962] shadow-sm transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting Incident Report..." : "Submit Incident Report to Supervisors"}
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

