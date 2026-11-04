// Use an international number, including country code, without a leading zero.
const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/[\s()+-]/g, "");
export const whatsappUrl = /^[1-9]\d{7,14}$/.test(whatsappNumber)
  ? `https://wa.me/${whatsappNumber}`
  : null;

export function getWhatsAppHref(topic?: string): string | null {
  if (!whatsappUrl) return null;
  const message = topic?.trim()
    ? `Hello Hithata Idak, I'd like to talk about ${topic.trim()}.`
    : "Hello Hithata Idak, I'd like someone to talk to.";
  return `${whatsappUrl}?text=${encodeURIComponent(message)}`;
}
