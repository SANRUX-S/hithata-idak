"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  AlertCircle,
  FileCheck,
} from "lucide-react";

export default function OurStoryPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    languages: "Sinhala and English",
    motivation: "",
    background: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const values = [
    {
      title: "Compassion",
      sinhala: "කරුණාව සහ සහකම්පනය",
      desc: "Meeting people where they are, without judgment, impatience, or prejudice. Recognizing that suffering takes many forms.",
      color: "bg-white border-[#e5e1db]",
    },
    {
      title: "Respect",
      sinhala: "ගෞරවය",
      desc: "Treating every visitor's lived experience with profound dignity. We listen with reverence to every story shared with us.",
      color: "bg-white border-[#e5e1db]",
    },
    {
      title: "Privacy",
      sinhala: "රහස්‍යභාවය",
      desc: "Protecting vulnerability. We design our technology to minimize data footprint, encrypt conversations, and never ask for identity.",
      color: "bg-white border-[#e5e1db]",
    },
    {
      title: "Inclusivity",
      sinhala: "සැමට විවෘතභාවය",
      desc: "Providing a welcoming space across ethnicities, religions, gender identities, and backgrounds, in Sinhala, English, and Singlish.",
      color: "bg-white border-[#e5e1db]",
    },
    {
      title: "Responsibility",
      sinhala: "වගකීම",
      desc: "Honoring our boundaries as emotional listeners. Knowing when to guide someone toward verified clinical care or crisis hotlines.",
      color: "bg-white border-[#e5e1db]",
    },
  ];

  const handleVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/volunteers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit application");
      }

      setSubmitSuccess(true);
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        languages: "Sinhala and English",
        motivation: "",
        background: "",
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error && err.message ? err.message : "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#faf9f6]">
      {/* HERO SECTION */}
      <section className="relative py-20 md:py-28 bg-[#faf9f6] border-b border-[#e5e1db]/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="text-sm font-medium tracking-wide text-[#655f6a]">
            <span>Our Origin & Purpose</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#3c3654] tracking-tight leading-tight">
            Every Voice Deserves to Be Heard.
          </h1>

          <p className="text-lg sm:text-xl text-[#655f6a] leading-relaxed max-w-3xl mx-auto">
            Hithata Idak began with a simple belief: no one should feel that their thoughts and feelings are too small, too complicated, or too difficult to share.
          </p>
        </div>
      </section>

      {/* SECTION: WHY WE EXIST */}
      <section className="py-20 bg-[#faf9f6]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="text-sm font-medium tracking-wide text-[#655f6a]">
                The Need in Our Communities
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#3c3654] tracking-tight">
                Why We Exist
              </h2>
              <p className="text-base text-[#655f6a] leading-relaxed">
                In Sri Lanka and around the world, countless individuals carry heavy emotional burdens in quiet isolation. Often, people struggle to discuss their personal challenges because of the fear of social judgment, financial limitations, the stigma surrounding vulnerability, or simply not knowing where to turn.
              </p>
              <div className="p-5 rounded-2xl bg-[#f1f0eb]/50 border-l-4 border-[#3c3654] text-[#3c3654] font-medium text-base italic">
                &ldquo;Our purpose is to create a welcoming space where meaningful conversations begin with listening.&rdquo;
              </div>
              <p className="text-base text-[#655f6a] leading-relaxed">
                We believe that human presence, patience, and nonjudgmental acceptance can break the cycle of loneliness. When someone has a safe container to articulate their pain, they discover that their feelings are valid and that they are not alone.
              </p>
            </div>

            {/* Visual Callout Box */}
            <div className="lg:col-span-6">
              <div className="p-8 rounded-2xl bg-white border border-[#e5e1db] shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-[#3c3654] flex items-center gap-2">
                  <span>The Spirit of &ldquo;Hithata Idak&rdquo;</span>
                </h3>
                <p className="text-base text-[#655f6a] leading-relaxed">
                  In Sinhala, the phrase <strong className="text-[#3c3654]">&ldquo;හිතට ඉඩක්&rdquo; (Hithata Idak)</strong> translates to creating room, space, and breathing capacity for the heart and mind.
                </p>
                <div className="space-y-3 pt-2 text-base text-[#3c3654]">
                  <div className="flex items-start gap-3">
                    <span>Space to speak without rehearsing or pretending to be fine.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span>Space to express fear, confusion, grief, or fatigue.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span>Space to feel genuinely accompanied by another human soul.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: MISSION & VISION */}
      <section className="py-20 bg-[#faf9f6] border-t border-[#e5e1db]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mission Card */}
            <div className="p-8 sm:p-10 rounded-2xl bg-white border border-[#ded9e2] shadow-sm space-y-4">
              <span className="text-sm uppercase font-bold tracking-wider text-[#655f6a]">Our Mission</span>
              <h3 className="text-2xl font-bold text-[#3c3654]">
                Accessible, Compassionate Listening
              </h3>
              <p className="text-base text-[#655f6a] leading-relaxed">
                &ldquo;To make compassionate emotional support more accessible through free, respectful, human-to-human conversations.&rdquo;
              </p>
            </div>

            {/* Vision Card */}
            <div className="p-8 sm:p-10 rounded-2xl bg-white border border-[#dce4d8] shadow-sm space-y-4">
              <span className="text-sm uppercase font-bold tracking-wider text-[#655f6a]">Our Vision</span>
              <h3 className="text-2xl font-bold text-[#3c3654]">
                A Future of Connection
              </h3>
              <p className="text-base text-[#655f6a] leading-relaxed">
                &ldquo;A future where everyone who needs a listening ear can find a safe and supportive place to start a conversation.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: OUR VALUES */}
      <section className="py-20 bg-[#faf9f6] border-t border-[#e5e1db]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-sm font-medium tracking-wide text-[#655f6a]">
              Our Moral Compass
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#3c3654] tracking-tight">
              Our Core Values
            </h2>
            <p className="text-base text-[#655f6a] leading-relaxed">
              Every design decision, conversation guideline, and technology choice is anchored in five foundational pillars.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {values.map((val, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl border ${val.color} shadow-none hover:border-[#c9c4ce] transition-all flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  <div className="text-sm font-sinhala text-[#655f6a]">
                    {val.sinhala}
                  </div>
                  <h3 className="text-xl font-bold text-[#3c3654]">{val.title}</h3>
                  <p className="text-base text-[#655f6a] leading-relaxed">
                    {val.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: THE PEOPLE BEHIND THE PLATFORM */}
      <section className="py-20 bg-[#faf9f6] border-t border-[#e5e1db]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-sm font-medium tracking-wide text-[#655f6a]">
              Real People Behind The Platform
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#3c3654] tracking-tight">
              Authentic & Transparent
            </h2>
            <p className="text-base text-[#655f6a] leading-relaxed">
              In accordance with our strict ethical commitments, we maintain full transparency about our team, operating status, and development phase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Founder Introduction */}
            <div className="p-7 rounded-2xl bg-white border border-[#e5e1db] shadow-none space-y-4">
              <h3 className="text-lg font-bold text-[#3c3654]">Founder & Steering Team</h3>
              <p className="text-base text-[#655f6a] leading-relaxed">
                Founded by passionate Sri Lankan technologists, wellbeing advocates, and community organizers dedicated to bridging the emotional support gap through ethical technology and compassionate peer listening.
              </p>
              <div className="text-sm text-[#655f6a] italic pt-2 border-t border-[#e5e1db]/60">
                Founder details and supervisory bios will be published alongside formal governance appointments.
              </div>
            </div>

            {/* Volunteer Team */}
            <div className="p-7 rounded-2xl bg-white border border-[#e5e1db] shadow-none space-y-4">
              <h3 className="text-lg font-bold text-[#3c3654]">Volunteer Supporter Ethos</h3>
              <p className="text-base text-[#655f6a] leading-relaxed">
                Our supporters are everyday people—university students, community workers, and empathetic listeners—who undergo structured training on nonjudgmental communication, confidentiality, and crisis referral.
              </p>
              <div className="text-sm text-[#655f6a] italic pt-2 border-t border-[#e5e1db]/60">
                Supporters are trained listeners; they are not certified psychotherapists.
              </div>
            </div>

            {/* Advisors & Professional Partnerships */}
            <div className="p-7 rounded-2xl bg-white border border-[#e5e1db] shadow-none space-y-4">
              <h3 className="text-lg font-bold text-[#3c3654]">Advisors & Professional Guidance</h3>
              <p className="text-base text-[#655f6a] leading-relaxed">
                We are actively developing our safeguarding advisory circle with mental health clinicians and legal specialists. We do not claim unverified endorsements or fabricate clinical credentials.
              </p>
              <div className="text-sm text-[#655f6a] italic pt-2 border-t border-[#e5e1db]/60">
                Verified advisory partnerships will be published upon formal agreement.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: BECOME PART OF THE MISSION (VOLUNTEER APPLICATION) */}
      <section id="volunteer" className="py-20 bg-[#faf9f6] border-t border-[#e5e1db]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-sm font-medium tracking-wide text-[#655f6a]">
              Join Our Support Family
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#3c3654]">
              Become Part of the Mission
            </h2>
            <p className="text-base text-[#655f6a] leading-relaxed">
              If you have patience, a calm presence, and a genuine desire to listen to people going through challenging times, we invite you to express your interest in joining our volunteer cohort.
            </p>
          </div>

          {/* Important Onboarding Boundary Box */}
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-base mb-8 flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Important Volunteer Onboarding Protocol:</span>
              <p className="text-amber-800 leading-relaxed text-base">
                Submitting this expression of interest does <strong>not</strong> automatically authorize anyone to provide emotional support on Hithata Idak. All applicants undergo identity screening, reference verification, empathetic listening training, mock practice sessions, and supervisory sign-off before joining active shifts.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-10 rounded-2xl bg-white border border-[#e5e1db] shadow-sm space-y-6">
            {submitSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center font-bold">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-emerald-900">Application Received with Gratitude</h3>
                <p className="text-base text-emerald-800 max-w-md mx-auto leading-relaxed">
                  Thank you for stepping forward to support our community. Our volunteer coordination team will review your application and reach out via email regarding upcoming training cohorts.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitSuccess(false)}
                  className="mt-2 px-5 py-2 rounded-xl bg-[#3c3654] text-white text-sm font-semibold"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleVolunteerSubmit} className="space-y-5">
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#3c3654] mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Your full legal name"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1db] text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#3c3654] mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1db] text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#3c3654] mb-1.5">
                      Phone Number (Optional for WhatsApp screening)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+94 7X XXX XXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1db] text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#3c3654] mb-1.5">
                      Languages You Can Comfortably Chat In *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.languages}
                      onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                      placeholder="e.g. Sinhala, English, Singlish, Tamil"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1db] text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#3c3654] mb-1.5">
                    Why do you wish to volunteer as an emotional listener with Hithata Idak? *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.motivation}
                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                    placeholder="Tell us what motivates you to offer your time and presence to others..."
                    className="w-full p-3 rounded-xl border border-[#e5e1db] text-base resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#3c3654] mb-1.5">
                    Your background, education, or relevant life experience *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.background}
                    onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                    placeholder="Student, professional, caregiver, active listener, prior volunteer work, etc."
                    className="w-full p-3 rounded-xl border border-[#e5e1db] text-base resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-2xl text-base font-bold text-white bg-[#3c3654] hover:bg-[#504962] shadow-sm transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting Application..." : "Submit Volunteer Expression of Interest"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FINAL STORY CTA */}
      <section className="py-20 bg-[#edf2eb] border-t border-[#dce4d8] text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#3c3654]">
            Sometimes, Listening Makes a Difference.
          </h2>
          <p className="text-base text-[#655f6a] max-w-xl mx-auto">
            If you need someone to talk to right now, our doors are open.
          </p>
          <div className="pt-2">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-base font-bold text-white bg-[#3c3654] hover:bg-[#504962] shadow-sm transition-all"
            >
              <span>Start an Anonymous Chat</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

