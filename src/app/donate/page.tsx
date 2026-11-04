import type { Metadata } from "next";
import Link from "next/link";
import { donationContactUrl } from "@/lib/donations";

export const metadata: Metadata = {
  title: "Support Hithata Idak — Help Keep This Space Open",
  description:
    "If you would like to support Hithata Idak, contact our team for donation details. Giving is optional, and our emotional listening service remains free.",
};

const questions = [
  {
    question: "Who am I supporting?",
    answer:
      "Your contribution supports Hithata Idak and the work of keeping this emotional listening space available. You can ask our team how your contribution would be used before deciding to give.",
  },
  {
    question: "Do I need to donate to use the chat?",
    answer:
      "No. Our emotional listening service is free. Giving is entirely optional and has no effect on your access to support or your place in the conversation queue.",
  },
  {
    question: "How can I get the donation details?",
    answer:
      "Use the WhatsApp link on this page to ask our team for the current details. The link opens a conversation; it does not make a payment. You can review the details and ask questions before choosing whether to donate.",
  },
  {
    question: "Who can help with payment or confirmation questions?",
    answer:
      "Please speak with the Hithata Idak team through the same WhatsApp conversation. Ask them about the available payment method and how your contribution will be confirmed before sending money.",
  },
  {
    question: "Can I help in another way?",
    answer:
      "You are welcome to ask our team about other ways to help. If you would like to offer your time as a listener, you can also read about volunteering on our story page.",
  },
];

const steps = [
  {
    title: "Get in touch",
    text: "Send a short message to the Hithata Idak team and let us know you would like to support our work.",
  },
  {
    title: "Ask for the details",
    text: "Our team can share the current donation details. Ask any questions you have about giving or how your contribution would be used.",
  },
  {
    title: "Choose what feels right",
    text: "Take your time to review the information. Whether you decide to give or simply spend some time here, you are welcome.",
  },
];

export default function DonatePage() {
  return (
    <div className="bg-[#FAF9F7] text-[#3c3654]">
      <section className="border-b border-[#e3e0d9] px-5 py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div>
            <p className="text-sm font-medium text-[#617465]">Support Hithata Idak</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl">
              Help us keep this space open.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#696574] sm:text-lg">
              Sometimes, having someone listen can make a difficult day a little easier. If you would like to support the work we do at Hithata Idak, we would be grateful to hear from you.
            </p>
            <p lang="si" className="mt-4 text-base leading-relaxed text-[#696574]">
              හිතට ඉඩක් වැඩකටයුතුවලට ඔබටත් සහය විය හැකියි.
            </p>
            {donationContactUrl ? (
              <>
                <a
                  href={donationContactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#3c3654] px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-[#514967]"
                >
                  Get donation details on WhatsApp
                </a>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#696574]">
                  This opens a conversation with our team. It does not make a payment. WhatsApp shares your phone number with the support account.
                </p>
              </>
            ) : (
              <p className="mt-6 text-base leading-relaxed text-[#696574]">Donation contact details are being prepared. Please check back here soon.</p>
            )}
          </div>

          <aside className="border-l-2 border-[#b9c7b8] bg-[#eff1eb] px-6 py-7 sm:px-8 sm:py-8" aria-labelledby="team-note-title">
            <h2 id="team-note-title" className="text-xl font-semibold">A note from our team</h2>
            <p className="mt-4 text-base leading-relaxed text-[#636a60]">
              Hithata Idak exists to make room for honest conversations. Your support can help us continue that work and keep this service free for the people who need a listening ear.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[#636a60]">
              There is no pressure to give. Being heard should never depend on what you can afford.
            </p>
            <ul className="mt-6 list-disc space-y-2 pl-5 text-base leading-relaxed text-[#636a60]">
              <li>Contributions support Hithata Idak.</li>
              <li>You can ask our team for details before giving.</li>
              <li>Chat support remains free for everyone.</li>
            </ul>
          </aside>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-14 sm:py-16" aria-labelledby="donation-steps-title">
        <div className="max-w-2xl">
          <h2 id="donation-steps-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">If you would like to help</h2>
          <p className="mt-4 text-base leading-relaxed text-[#696574]">Start with a conversation. Our team will help you understand the next steps.</p>
        </div>
        <div className="mt-9 grid gap-7 md:grid-cols-3 md:gap-9">
          {steps.map((step, index) => (
            <div key={step.title} className="border-t border-[#d7ddd1] pt-5">
              <p className="text-sm text-[#617465]">Step {index + 1}</p>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-[#696574]">{step.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-base font-medium text-[#526654]">
          <Link href="/story" className="underline decoration-[#bdc8b8] underline-offset-4 hover:text-[#3c3654]">Read our story</Link>
          <Link href="/story#volunteer" className="underline decoration-[#bdc8b8] underline-offset-4 hover:text-[#3c3654]">Find out about volunteering</Link>
        </div>
      </section>

      <section className="border-y border-[#e3e0d9] bg-[#f3f2ee] px-5 py-14 sm:py-16" aria-labelledby="donation-faq-title">
        <div className="mx-auto max-w-3xl">
          <h2 id="donation-faq-title" className="text-2xl font-semibold">A few things you may want to know</h2>
          <div className="mt-7 divide-y divide-[#dedcd5] border-y border-[#dedcd5]">
            {questions.map((item) => (
              <details key={item.question} className="py-5">
                <summary className="cursor-pointer text-base font-medium leading-relaxed marker:text-[#71816b]">{item.question}</summary>
                <p className="mt-3 text-base leading-relaxed text-[#696574]">{item.answer}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-base leading-relaxed text-[#696574]">We do not collect card or bank details through this website. Please confirm the donation details with our team before sending money.</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14 sm:py-16">
        <h2 className="text-2xl font-semibold">There is space for you here, too.</h2>
        <p className="mt-4 text-base leading-relaxed text-[#696574]">If you have something on your mind, you are welcome to talk. You never need to donate to be heard.</p>
        <Link href="/chat" className="mt-6 inline-flex items-center rounded-lg bg-[#3c3654] px-5 py-3 text-base font-medium text-white transition-colors hover:bg-[#514967]">Talk to someone</Link>
      </section>
    </div>
  );
}
