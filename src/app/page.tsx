import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Flower2,
  GraduationCap,
  HandHeart,
  Heart,
  Headphones,
  Infinity as InfinityIcon,
  Languages,
  Laptop,
  Leaf,
  LockKeyhole,
  MessageCircle,
  MessageSquareHeart,
  ShieldCheck,
  Sprout,
  Users,
  UserRoundCheck,
} from "lucide-react";
import { conversationTopics } from "@/lib/topics";

const topicIcons = [Heart, Users, Flower2, GraduationCap, Headphones, BookOpen];

const trustItems = [
  { icon: Heart, label: "Free emotional support" },
  { icon: UserRoundCheck, label: "No account required" },
  { icon: Languages, label: "Sinhala & English chat" },
  { icon: Users, label: "Real human support" },
  { icon: ShieldCheck, label: "Privacy first, always" },
];

const steps = [
  {
    icon: Laptop,
    title: "Make yourself at home",
    text: "Open the website on your phone or computer. No downloads. No account. Just you.",
  },
  {
    icon: MessageCircle,
    title: "Start a conversation",
    text: "Choose your language and what’s on your mind. Or simply start with a hello.",
  },
  {
    icon: Users,
    title: "Meet a human supporter",
    text: "A volunteer joins when available. If everyone is busy or offline, we’ll let you know.",
  },
  {
    icon: Sprout,
    title: "Go at your own pace",
    text: "Share as much or as little as you like. Take a breath. You’re in control of your conversation.",
  },
];

const values = [
  {
    icon: Users,
    title: "Real people. Real conversations.",
    text: "A caring human on the other side. Someone to listen with patience, warmth, and understanding.",
  },
  {
    icon: InfinityIcon,
    title: "Always free to talk",
    text: "Reaching out should never come with a price. Our listening service is free for everyone.",
  },
  {
    icon: Heart,
    title: "A little kindness. Zero judgment.",
    text: "No criticism, no pressure to explain perfectly. You deserve to feel heard and respected.",
  },
  {
    icon: ShieldCheck,
    title: "Your privacy matters",
    text: "No name or phone number needed for web chat. Your messages are encrypted at rest.",
  },
  {
    icon: Languages,
    title: "Your words. Your language.",
    text: "Sinhala, English, or everyday Singlish. Talk in whatever way feels most like you.",
  },
  {
    icon: HandHeart,
    title: "Support beyond this space",
    text: "When you need more support, find clear pathways to professional help in our resources.",
  },
];

export default function HomePage() {
  return (
    <div className="home-page">
      {/* HERO SECTION */}
      <section className="home-hero" aria-labelledby="hero-title">
        <Image
          src="/images/highlands-sunrise.webp"
          alt="Peaceful Sri Lankan mountain landscape at sunrise"
          fill
          sizes="100vw"
          priority
          className="hero-landscape"
        />
        <div className="hero-wash" />
        <div className="home-container hero-content">
          <span className="eyebrow hero-eyebrow">
            <Heart size={13} className="text-[#9C4B64] fill-[#9C4B64]/20" />
            <span>You deserve to be heard</span>
            <span className="eyebrow-divider">·</span>
            <span className="font-sinhala">ඔබ වෙනුවෙන් අපි ඉන්නවා</span>
          </span>
          <h1 id="hero-title">
            A safe place<br className="sm:hidden" /> to <span>talk.</span>
          </h1>
          <p>
            Whatever is on your mind, you don’t have to carry it alone. Connect with a caring human, share your feelings, and take things at your own pace.
          </p>
          <div className="hero-actions">
            <Link href="/chat" className="button-primary">
              <MessageSquareHeart size={17} /> Start a conversation <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link href="/story" className="button-secondary">
              Our story <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="hero-reassurance">
            <LockKeyhole size={13} className="text-[#3B6B4A]" />
            <span>A listening ear. A little breathing room. Always free.</span>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <div className="home-container trust-wrap">
        <div className="trust-strip">
          {trustItems.map(({ icon: Icon, label }) => (
            <div className="trust-item" key={label}>
              <div className="trust-icon-box">
                <Icon size={17} strokeWidth={1.8} />
              </div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TOPICS SECTION */}
      <section className="home-section topics-section" aria-labelledby="topics-title">
        <div className="home-container">
          <div className="section-heading">
            <span className="eyebrow">A little space for whatever you’re feeling</span>
            <h2 id="topics-title">
              You don’t have to carry<br className="hidden sm:block" /> everything alone.
            </h2>
            <p>
              Some days are harder than others. Whatever brought you here,<br className="hidden sm:block" /> there’s room for it. And there’s someone willing to listen.
            </p>
          </div>

          <div className="topic-grid">
            {conversationTopics.map((topic, i) => {
              const Icon = topicIcons[i] || Heart;
              return (
                <Link
                  key={topic.id}
                  href={`/chat?topic=${encodeURIComponent(topic.title)}`}
                  className={`topic-card topic-${topic.tone}`}
                >
                  <div className="topic-botanical" aria-hidden="true">
                    {i === 0 ? <Flower2 /> : i === 3 ? <BookOpen /> : i === 4 ? <Headphones /> : <Leaf />}
                  </div>
                  <div className="topic-icon">
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                  <span className="topic-badge">{topic.badge}</span>
                  <h3>{topic.title}</h3>
                  <p>{topic.description}</p>
                  <span className="topic-link">
                    Let’s talk about it <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
          <p className="gentle-note">No labels needed. You can choose a topic, write your own, or just say hello.</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="home-section how-section" aria-labelledby="how-title">
        <div className="home-container">
          <div className="section-heading">
            <span className="eyebrow">Simple, gentle, and on your terms</span>
            <h2 id="how-title">A small step. A listening ear.</h2>
            <p>
              Reaching out can feel like a big thing.<br className="sm:hidden" /> We’ve made the next step a little easier.
            </p>
          </div>

          <div className="steps-grid">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <div className="step-card" key={title}>
                <div className="step-card-header">
                  <div className="step-icon">
                    <Icon size={20} strokeWidth={1.8} />
                  </div>
                  <span className="step-number">0{i + 1}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                {i < 3 && <span className="step-connector" aria-hidden="true"><ArrowRight size={16} /></span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="home-section values-section" aria-labelledby="values-title">
        <div className="home-container">
          <div className="section-heading">
            <span className="eyebrow">Real people · Real compassion</span>
            <h2 id="values-title">
              A little more human.<br className="sm:hidden" /> A little less alone.
            </h2>
            <p>
              Hithata Idak is built on a simple belief: being heard matters.<br className="hidden sm:block" /> Here’s what you can always expect from us.
            </p>
          </div>

          <div className="values-grid">
            {values.map(({ icon: Icon, title, text }) => (
              <div className="value-card" key={title}>
                <div className="value-icon">
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DONATION SECTION WITH RESTORED IMAGE */}
      <section className="donation-section" aria-labelledby="donation-title">
        <div className="home-container">
          <div className="donation-grid">
            <div className="donation-copy">
              <span className="eyebrow">
                <Heart size={13} className="text-[#9C4B64]" /> Kindness that reaches a little further
              </span>
              <h2 id="donation-title">Support with kindness.</h2>
              <p className="donation-lead">
                Our listening service is free. If you’d like to give, you can <strong>support Hithata Idak and the work we do</strong>, or contribute directly to community healthcare like <strong>Apeksha Hospital, Maharagama</strong>.
              </p>
              <p>
                Every conversation starts with someone making space to listen. If you’d like to help us keep this space open, get in touch with our team for donation details.
              </p>
              <div className="hero-actions">
                <Link href="/donate" className="button-primary">
                  <Heart size={15} /> Support Hithata Idak
                </Link>
                <Link href="/donate#how-it-works" className="button-secondary">
                  How to donate <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="donation-visual">
              <Image
                src="/images/apeksha-hospital.png"
                alt="Apeksha Hospital courtyard in Maharagama"
                fill
                sizes="(max-width: 767px) 100vw, 45vw"
                className="object-cover"
              />
              <div className="donation-photo-shade" />
              <div className="donation-photo-caption">
                <ShieldCheck size={20} className="text-[#3B6B4A]" />
                <span>
                  100% transparent<br />
                  <strong>Direct Giving & Support</strong>
                </span>
                <span className="donation-caption-heart">
                  <Heart size={16} />
                </span>
              </div>
            </div>
          </div>

          <p className="donation-transparency">
            <ShieldCheck size={15} className="text-[#3B6B4A] flex-shrink-0" />
            <span>
              <strong>Giving is optional.</strong> Donations support Hithata Idak and healthcare causes. Our team shares donation details on WhatsApp; this website does not take direct payments. Talking with us stays 100% free.
            </span>
          </p>
        </div>
      </section>

      {/* CLOSING SECTION */}
      <section className="closing-section" aria-labelledby="closing-title">
        <div className="home-container">
          <div className="closing-heart-badge">
            <Heart size={20} strokeWidth={1.8} className="text-[#9C4B64]" />
          </div>
          <h2 id="closing-title">
            Your feelings matter.<br className="sm:hidden" /> Your voice matters.
          </h2>
          <p>
            You don’t need to have it all figured out.<br />
            If you need someone to listen, there’s a space for you here.
          </p>
          <div className="hero-actions justify-center">
            <Link href="/chat" className="button-primary">
              <MessageSquareHeart size={16} /> Talk to someone <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link href="/resources" className="button-secondary">
              Explore helpful resources
            </Link>
          </div>
          <p className="closing-sinhala font-sinhala">කතා කරන්න. අපි අහගෙන ඉන්නවා.</p>
        </div>
      </section>
    </div>
  );
}
