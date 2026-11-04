import type { Metadata, Viewport } from "next";
import "../../public/fonts/fonts.css";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Hithata Idak — A Safe Place to Talk | හිතට ඉඩක්",
  description:
    "A free, welcoming emotional support platform offering compassionate, human-to-human listening in Sinhala, English, and Singlish. No account required, privacy-focused.",
  keywords: [
    "Hithata Idak",
    "හිතට ඉඩක්",
    "emotional support Sri Lanka",
    "mental health listening",
    "free support chat",
    "Sinhala chat support",
    "peer listening",
    "1926 Sri Lanka",
  ],
  authors: [{ name: "Hithata Idak Team" }],
  openGraph: {
    title: "Hithata Idak — A Safe Place to Talk | හිතට ඉඩක්",
    description:
      "Whatever is on your mind, you deserve to be heard. Connect with a caring human supporter, share your feelings, and take things at your own pace.",
    url: "https://hithataidak.lk",
    siteName: "Hithata Idak",
    locale: "en_LK",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen flex flex-col bg-[#FAF9F7] text-[#25234A] antialiased">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <Navbar />
        <main id="main-content" className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
