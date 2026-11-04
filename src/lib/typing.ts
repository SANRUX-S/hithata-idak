// In-memory typing tracker for real activity pings
// Automatically expires typing status after 4.5 seconds

interface TypingState {
  isTyping: boolean;
  name: string;
  role: "visitor" | "supporter";
  lastPing: number;
}

declare global {
  var __hithata_typing: Map<string, TypingState> | undefined;
}

// Route bundles and development reloads must see the same tracker in this process.
const typingRegistry = globalThis.__hithata_typing ??= new Map<string, TypingState>();

export function setTyping(ticketId: string, role: "visitor" | "supporter", name: string, isTyping: boolean): void {
  const key = `${ticketId}:${role}`;
  if (isTyping) {
    typingRegistry.set(key, {
      isTyping: true,
      name,
      role,
      lastPing: Date.now(),
    });
  } else {
    typingRegistry.delete(key);
  }
}

export function getOtherPartyTyping(ticketId: string, myRole: "visitor" | "supporter"): { isTyping: boolean; name: string } {
  const otherRole = myRole === "visitor" ? "supporter" : "visitor";
  const key = `${ticketId}:${otherRole}`;
  const state = typingRegistry.get(key);

  if (!state) {
    return { isTyping: false, name: "" };
  }

  // Check if expired (more than 4.5 seconds since last keystroke ping)
  if (Date.now() - state.lastPing > 4500) {
    typingRegistry.delete(key);
    return { isTyping: false, name: "" };
  }

  return { isTyping: true, name: state.name };
}

