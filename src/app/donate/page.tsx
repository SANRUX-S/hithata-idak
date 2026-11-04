import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ExternalLink,
  HandHeart,
  Heart,
  HeartHandshake,
  Hospital,
  Leaf,
  MessageSquareHeart,
  ShieldCheck,
} from "lucide-react";
import { donationProjectsUrl, hospitalWebsiteUrl, officialDonationUrl } from "@/lib/donations";

export const metadata: Metadata = {
  title: "Support With Kindness — Donate to Apeksha Hospital | Hithata Idak",
  description:
    "Support Apeksha Hospital, Maharagama, through its Development Committee's donation channels. Hithata Idak does not collect donations or retain any portion.",
};

const questions = [
  {
    question: "Where does my donation go?",
    answer:
      "The donation link takes you to Help Apeksha, the National Cancer Institute Sri Lanka Development Committee's website. You donate directly through its channels to support Apeksha Hospital in Maharagama. Hithata Idak never receives, holds, or keeps your donation.",
  },
  {
    question: "Do I need to donate to use the chat?",
    answer:
      "No. Our emotional listening service is free. Giving is entirely optional and has no effect on your access to support or your place in the conversation queue.",
  },
  {
    question: "Can I donate by bank transfer or in person?",
    answer:
      "Yes. Help Apeksha publishes bank deposit instructions and information about giving in person. Open its donation page to check the current details and follow the hospital's confirmation process.",
  },
  {
    question: "Who handles my payment and receipt?",
    answer:
      "The hospital's donation channels handle your payment and confirmation. Their payment terms and privacy policy apply. Contact Help Apeksha through its official website for receipt or payment questions.",
  },
  {
    question: "Can I give supplies or other items?",
    answer:
      "Help Apeksha also accepts enquiries about physical donations. Contact the hospital first to confirm what is needed and arrange approval before bringing items.",
  },
];

export default function DonatePage() {
  return (
    <div className="bg-[#FCFAFD]">
      <section className="relative overflow-hidden border-b border-[#EAE2EF] bg-[radial-gradient(ellipse_at_top_right,#F4DDE8,transparent_60%),linear-gradient(135deg,#F8F4FC,#FFF9F2)] px-5 py-16 sm:py-20">
        <div className="pointer-events-none absolute -right-14 top-8 h-72 w-72 rounded-full border-[38px] border-white/40" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E2D4EA] bg-white/75 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#645181]">
              <Heart className="h-3.5 w-3.5" /> A little kindness. A little hope.
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-[#29234F] sm:text-5xl">
              Support with kindness.<br />Give someone hope.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#645E78] sm:text-lg">
              Our listening service is free. If you would like to give, your kindness can reach patients at <strong className="font-semibold text-[#352A58]">Apeksha Hospital, Maharagama.</strong>
            </p>
            <p lang="si" className="mt-4 text-sm leading-relaxed text-[#776488]">
              ඔබේ කුඩා උපකාරයත් තවත් කෙනෙකුට බලාපොරොත්තුවක්.
            </p>
            <a href={officialDonationUrl} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-[#352B63] px-6 py-3.5 text-sm font-bold text-white shadow-[0_5px_16px_#352B6320] transition-colors hover:bg-[#493B7C]">
              Donate directly to Apeksha <ExternalLink className="h-4 w-4" />
            </a>
            <p className="mt-3 text-xs text-[#746B82]">Opens Help Apeksha, the hospital Development Committee&apos;s website.</p>
          </div>

          <div className="relative rounded-[28px] border border-white bg-white/80 p-7 shadow-[0_15px_60px_#6C477912] sm:p-9">
            <div className="relative mb-6 aspect-[2/1] overflow-hidden rounded-2xl">
              <Image src="/images/apeksha-hospital.png" alt="The courtyard and hospital building at Apeksha Hospital, Maharagama" fill sizes="(max-width: 1024px) 90vw, 480px" className="object-cover" />
            </div>
            <div className="mb-7 flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0E7F8] text-[#75609A]"><HandHeart className="h-8 w-8" strokeWidth={1.5} /></span>
              <div><p className="text-xs font-semibold text-[#887995]">YOUR KINDNESS GOES TO</p><h2 className="mt-1 text-xl font-bold text-[#33294F]">Apeksha Hospital</h2><p className="mt-1 text-sm text-[#776C82]">Maharagama, Sri Lanka</p></div>
            </div>
            <div className="rounded-2xl border border-[#E6DDEB] bg-[#FAF6FD] p-5">
              <p className="flex items-start gap-3 text-sm font-semibold leading-relaxed text-[#493663]"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />All donations go directly to the hospital&apos;s donation channels.</p>
              <p className="ml-8 mt-2 text-xs leading-relaxed text-[#7A6A85]">Hithata Idak collects no money and keeps no portion of your contribution.</p>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-[#6D6178]">
              {["Give directly through the hospital's channels", "Choose an amount that feels right for you", "Your support here is always free"].map((text) => <li key={text} className="flex items-center gap-2.5"><Check className="h-4 w-4 shrink-0 text-[#6B8D75]" />{text}</li>)}
            </ul>
            <Leaf aria-hidden="true" className="pointer-events-none absolute -bottom-4 -right-3 h-20 w-20 -rotate-12 text-[#B4C9B5]/60" strokeWidth={1} />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-14 sm:py-20" aria-labelledby="donation-steps-title">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8A739F]">Simple. Direct. Transparent.</span>
          <h2 id="donation-steps-title" className="mt-3 text-2xl font-bold tracking-tight text-[#30264F] sm:text-3xl">A small act. A meaningful difference.</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#7A6E85]">Make your contribution through the hospital, with no payment details shared with Hithata Idak.</p>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {[
            { icon: Hospital, title: "Visit the official donation page", text: "Open Help Apeksha to see the hospital Development Committee's current ways to give." },
            { icon: HandHeart, title: "Choose how you would like to help", text: "Explore projects or follow the published instructions for an online donation, bank deposit, or giving in person." },
            { icon: HeartHandshake, title: "Give directly, with care", text: "Complete your donation through the hospital's channels and keep the confirmation they provide." },
          ].map((step, index) => <div key={step.title} className="rounded-2xl border border-[#EBE4EF] bg-white p-6 shadow-[0_3px_15px_#42335004]"><div className="mb-5 flex items-center justify-between"><step.icon className="h-7 w-7 text-[#8A72A6]" strokeWidth={1.5} /><span className="text-xs font-semibold text-[#B2A2BE]">0{index + 1}</span></div><h3 className="text-base font-bold text-[#3D305B]">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-[#7A6E85]">{step.text}</p></div>)}
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-semibold text-[#6A5085]">
          <a href={donationProjectsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:underline">Explore hospital projects <ArrowRight className="h-4 w-4" /></a>
          <a href={hospitalWebsiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:underline">Visit the hospital website <ExternalLink className="h-3.5 w-3.5" /></a>
        </div>
      </section>

      <section className="border-y border-[#EDE5F1] bg-[#F6F1FA]/65 px-5 py-14 sm:py-16" aria-labelledby="donation-faq-title">
        <div className="mx-auto max-w-3xl">
          <h2 id="donation-faq-title" className="text-center text-2xl font-bold text-[#352A53]">A few things you may want to know</h2>
          <div className="mt-8 space-y-3">
            {questions.map((item) => <details key={item.question} className="group rounded-2xl border border-[#E8DEEE] bg-white px-5 py-4"><summary className="cursor-pointer text-sm font-semibold leading-relaxed text-[#4E3D65] marker:text-[#9D86B0]">{item.question}</summary><p className="mt-3 text-sm leading-relaxed text-[#7A6E85]">{item.answer}</p></details>)}
          </div>
          <p className="mt-6 text-center text-xs leading-relaxed text-[#8A7A96]">Hithata Idak is an independent emotional listening platform. Sharing these donation links does not imply a formal partnership with Apeksha Hospital.</p>
        </div>
      </section>

      <section className="px-5 py-14 text-center sm:py-16">
        <Heart className="mx-auto h-6 w-6 text-[#AB86B6]" strokeWidth={1.5} />
        <h2 className="mt-4 text-2xl font-bold text-[#352A53]">You deserve kindness, too.</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#7A6E85]">If you have something on your mind, there is space for you here. You never need to donate to be heard.</p>
        <Link href="/chat" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#352B63] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#493B7C]"><MessageSquareHeart className="h-4 w-4" />Talk to someone</Link>
      </section>
    </div>
  );
}
