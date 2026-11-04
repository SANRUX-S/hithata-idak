"use client";

import Link from "next/link";
import { HeartHandshake, RotateCcw } from "lucide-react";

export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <HeartHandshake className="mb-5 h-10 w-10 text-[#9975AE]" strokeWidth={1.5} />
      <h1 className="text-2xl font-bold text-[#352A53]">Let’s try that again.</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#776982]">This page couldn’t load. Please check your connection and try again. If you were chatting, you can return to your conversation in this tab.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={retry} className="button-primary"><RotateCcw size={16} /> Try again</button>
        <Link href="/chat" className="button-secondary">Return to chat</Link>
      </div>
    </div>
  );
}
