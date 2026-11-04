import { whatsappUrl } from "@/lib/site-config";

// This link coordinates donations with the Hithata Idak team; it is not a
// payment link and does not include a visitor's private conversation content.
export const donationRequestMessage =
  "Hello Hithata Idak, I would like to support your work. Could you share your donation details?";

export const donationContactUrl = whatsappUrl
  ? `${whatsappUrl}?text=${encodeURIComponent(donationRequestMessage)}`
  : null;
