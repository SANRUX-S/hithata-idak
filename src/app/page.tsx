import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { conversationTopics } from "@/lib/topics";

const trustItems = [
  "Free emotional support",
  "No account required",
  "Sinhala & English chat",
  "Real human support",
  "Privacy first, always",
];
const steps = [
  { title: "Make yourself at home", text: "Open the website on your phone or computer. No downloads. No account. Just you." },
  { title: "Start a conversation", text: "Choose your language and what’s on your mind. Or simply start with a hello." },
  { title: "Meet a human supporter", text: "A volunteer joins when available. If everyone is busy or offline, we’ll let you know." },
  { title: "Go at your own pace", text: "Share as much or as little as you like. Take a breath. You’re in control of your conversation." },
];
const values = [
  { title: "Real people. Real conversations.", text: "A caring human on the other side. Someone to listen with patience, warmth, and understanding." },
  { title: "Always free to talk", text: "Reaching out should never come with a price. Our listening service is free for everyone." },
  { title: "A little kindness. Zero judgment.", text: "No criticism, no pressure to explain perfectly. You deserve to feel heard and respected." },
  { title: "Your privacy matters", text: "No name or phone number needed for web chat. Your messages are encrypted at rest." },
  { title: "Your words. Your language.", text: "Sinhala, English, or everyday Singlish. Talk in whatever way feels most like you." },
  { title: "Support beyond this space", text: "When you need more support, find clear pathways to professional help in our resources." },
];

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="hero-title">
        <Image src="/images/highlands-sunrise.webp" alt="" fill sizes="100vw" preload className="hero-landscape" />
        <div className="hero-wash" />
        <div className="home-container hero-content">
          <span className="eyebrow hero-eyebrow">You deserve to be heard <span className="eyebrow-divider">·</span> <span className="font-sinhala">ඔබ වෙනුවෙන් අපි ඉන්නවා</span></span>
          <h1 id="hero-title">A safe place<br className="sm:hidden" /> to <span>talk.</span></h1>
          <p>Whatever is on your mind, you don’t have to carry it alone. Connect with a caring human, share your feelings, and take things at your own pace.</p>
          <div className="hero-actions">
            <Link href="/chat" className="button-primary">Start a conversation <ArrowRight size={17} aria-hidden="true" /></Link>
            <Link href="/story" className="button-secondary">Our story</Link>
          </div>
          <div className="hero-reassurance">A listening ear. A little breathing room. Always free.</div>
        </div>
      </section>
      <div className="home-container trust-wrap"><div className="trust-strip">
        {trustItems.map(label => <div className="trust-item" key={label}><span>{label}</span></div>)}
      </div></div>
      <section className="home-section topics-section" aria-labelledby="topics-title">
        <div className="home-container">
          <div className="section-heading">
            <span className="eyebrow">A little space for whatever you’re feeling</span>
            <h2 id="topics-title">You don’t have to carry<br className="hidden sm:block" /> everything alone.</h2>
            <p>Some days are harder than others. Whatever brought you here,<br className="hidden sm:block" /> there’s room for it. And there’s someone willing to listen.</p>
          </div>
          <div className="topic-grid">{conversationTopics.map(topic => {
            return <Link key={topic.id} href={`/chat?topic=${encodeURIComponent(topic.title)}`} className={`topic-card topic-${topic.tone}`}>
              <span className="topic-badge">{topic.badge}</span><h3>{topic.title}</h3><p>{topic.description}</p>
              <span className="topic-link">Let’s talk about it <ArrowRight size={16} aria-hidden="true" /></span>
            </Link>;
          })}</div>
          <p className="gentle-note">No labels needed. You can choose a topic, write your own, or just say hello.</p>
        </div>
      </section>
      <section className="home-section how-section" aria-labelledby="how-title">
        <div className="home-container">
          <div className="section-heading"><span className="eyebrow">Simple, gentle, and on your terms</span><h2 id="how-title">A small step. A listening ear.</h2><p>Reaching out can feel like a big thing.<br className="sm:hidden" /> We’ve made the next step a little easier.</p></div>
          <div className="steps-grid">{steps.map(({ title, text }, i) => <div className="step-card" key={title}>
            <span className="step-number">0{i + 1}</span><h3>{title}</h3><p>{text}</p>
          </div>)}</div>
        </div>
      </section>
      <section className="home-section values-section" aria-labelledby="values-title">
        <div className="home-container">
          <div className="section-heading"><span className="eyebrow">Real people · Real compassion</span><h2 id="values-title">A little more human.<br className="sm:hidden" /> A little less alone.</h2><p>Hithata Idak is built on a simple belief: being heard matters.<br className="hidden sm:block" /> Here’s what you can always expect from us.</p></div>
          <div className="values-grid">{values.map(({ title, text }) => <div className="value-card" key={title}><h3>{title}</h3><p>{text}</p></div>)}</div>
        </div>
      </section>
      <section className="donation-section" aria-labelledby="donation-title">
        <div className="home-container">
          <div className="donation-grid">
            <div className="donation-copy"><span className="eyebrow">Kindness that reaches a little further</span><h2 id="donation-title">Support with kindness.</h2>
              <p className="donation-lead">Our listening service is free. If you’d like to give, you can <strong>support Hithata Idak and the work we do.</strong></p>
              <p>Every conversation starts with someone making space to listen. If you’d like to help us keep this space open, get in touch with our team for donation details.</p>
              <div className="hero-actions"><Link href="/donate" className="button-primary">Support Hithata Idak</Link><Link href="/donate#how-it-works" className="button-secondary">How to donate <ArrowRight size={16} aria-hidden="true" /></Link></div>
            </div>
            <div className="donation-note"><span className="eyebrow">From all of us at Hithata Idak</span><p>A little help.<br />More room to listen.</p><span>Whether you choose to give or simply need someone to talk to, you’re welcome here.</span><Link href="/donate">Get donation details <ArrowRight size={17} aria-hidden="true" /></Link></div>
          </div>
          <p className="donation-transparency"><strong>Giving is optional.</strong> Donations support Hithata Idak. Our team shares donation details on WhatsApp; this website does not take payments. Talking with us stays free.</p>
        </div>
      </section>
      <section className="closing-section" aria-labelledby="closing-title">
        <div className="home-container"><h2 id="closing-title">Your feelings matter.<br className="sm:hidden" /> Your voice matters.</h2><p>You don’t need to have it all figured out.<br />If you need someone to listen, there’s a space for you here.</p><div className="hero-actions justify-center"><Link href="/chat" className="button-primary">Talk to someone <ArrowRight size={17} aria-hidden="true" /></Link><Link href="/resources" className="button-secondary">Explore helpful resources</Link></div><p className="closing-sinhala font-sinhala">කතා කරන්න. අපි අහගෙන ඉන්නවා.</p></div>
      </section>
    </div>
  );
}
