/**
 * Automated Safety & Content Moderation Guardrails for Community Posts & Replies.
 * Enforces a respectful, non-toxic, safe peer-support space.
 */

// Prohibited terms, severe insults, hate speech, explicit abuse, self-harm suicide instructions
const PROHIBITED_PATTERNS = [
  // Extreme self-harm instructions / encouragement (rather than seeking help)
  /\b(how to commit suicide|ways to kill myself|instruction to hang|how to slit|promote suicide)\b/i,
  /\b(මැරෙන හැටි|දිවි නසාගන්න විදිහ|ගෙල වැලලාගන්න|මැරියන්|මැරෙන්න ඕන විදිහ)\b/i,
  
  // Severe sexual solicitation / explicit harassment
  /\b(porn|xxx|nude|sex chat|call girl|escort|valaththa|hukanna|ponnaya|kariya|pakaya|huththa)\b/i,
  
  // Bullying / telling others to harm themselves
  /\b(go kill yourself|you should kill yourself|kill yourself|kill urself|kill yrself|you should die|kys|worthless scum|die trash)\b/i,
  /\b(තෝ මැරියන්|මැරිලා පලයන්|විෂ බීජයක්|නැතිවෙලා පලයන්)\b/i,

  // Commercial spam / scam links
  /\b(whatsapp group link|telegram crypto|earn money fast|binance pump|free cash)\b/i,
];

export interface ModerationResult {
  isSafe: boolean;
  reason?: string;
}

export function checkContentSafety(text: string): ModerationResult {
  if (!text || text.trim().length === 0) {
    return { isSafe: false, reason: "Content cannot be empty." };
  }

  const normalized = text.toLowerCase();

  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        isSafe: false,
        reason:
          "Your message contains language or content that does not comply with our compassionate community guidelines. If you are experiencing acute distress, please reach out to our confidential chat or call the 1926 helpline.",
      };
    }
  }

  return { isSafe: true };
}
