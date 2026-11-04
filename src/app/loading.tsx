import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return <div role="status" className="flex min-h-64 flex-1 items-center justify-center gap-3 px-6 py-16 text-sm text-[#806890]"><LoaderCircle className="h-5 w-5 animate-spin" /> Getting your space ready…</div>;
}
