import ChatClient from "@/components/ChatClient";
import { conversationTopics } from "@/lib/topics";

export default async function ChatPage({ searchParams }: {
  searchParams: Promise<{ topic?: string | string[] }>;
}) {
  const query = (await searchParams).topic;
  const requested = Array.isArray(query) ? query[0] : query;
  const selected = conversationTopics.find((item) => item.id === requested || item.title === requested);
  return <ChatClient initialTopic={(selected?.title || requested || "").slice(0, 200)} />;
}
