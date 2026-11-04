/**
 * Empathetic Canned Responses & Crisis Quick Action Templates
 * Designed for trained supporters to offer compassionate, structured listening.
 */

export interface CannedResponse {
  id: string;
  category: "listening" | "validation" | "grounding" | "crisis" | "closing";
  categoryLabel: string;
  title: string;
  sinhalaText: string;
  englishText: string;
}

export const CANNED_RESPONSES: CannedResponse[] = [
  // 1. Compassionate Listening
  {
    id: "listen_01",
    category: "listening",
    categoryLabel: "සවන්දීම (Listening)",
    title: "මම අහගෙන ඉන්නේ (I am listening)",
    sinhalaText: "මම ඔබ කියන දේ ඉතාම අවධානයෙන් සහ කරුණාවෙන් අහගෙන ඉන්නවා. ඔබේ සිතේ ඇති ඕනෑම දෙයක් නිදහසේ මෙහි ලියන්න.",
    englishText: "I am here with you, listening attentively and with compassion. Please feel free to share whatever is on your mind.",
  },
  {
    id: "listen_02",
    category: "listening",
    categoryLabel: "සවන්දීම (Listening)",
    title: "ඔබේ වේගයෙන් බෙදාගන්න (Take your time)",
    sinhalaText: "කිසිම කලබලයක් නැහැ. ඔබේ පහසු වේගයකින්, ඔබට කියන්න පහසු දේ පමණක් බෙදාගන්න. මම මෙහි රැඳී සිටිනවා.",
    englishText: "There is no rush at all. Take all the time you need and share only what you feel comfortable sharing. I am right here with you.",
  },

  // 2. Emotional Validation
  {
    id: "valid_01",
    category: "validation",
    categoryLabel: "පිළිගැනීම (Validation)",
    title: "ඔබේ හැඟීම් සාධාරණයි (Your feelings are valid)",
    sinhalaText: "ඔබ මුහුණ දෙන තත්ත්වයත් සමඟ ඔබට මෙහෙම දැනෙන එක ගැන පුදුම වෙන්න දෙයක් නැහැ. ඔබේ හැඟීම් සම්පූර්ණයෙන්ම සාධාරණයි.",
    englishText: "Given what you have been experiencing, it is completely understandable that you feel this way. Your feelings are entirely valid.",
  },
  {
    id: "valid_02",
    category: "validation",
    categoryLabel: "ඔබ තනිවෙලා නැහැ (You are not alone)",
    title: "ඔබ තනිවෙලා නැහැ (You are not alone)",
    sinhalaText: "සමහර වෙලාවට මේ වගේ හැඟීම් දරාගන්න අමාරු බව මට තේරෙනවා. නමුත් මතක තබාගන්න, මේ මොහොතේ ඔබ තනිවෙලා නැහැ.",
    englishText: "I understand how heavy these feelings can become. Please remember that you do not have to carry everything alone right now.",
  },

  // 3. Grounding & Gentle Support
  {
    id: "ground_01",
    category: "grounding",
    categoryLabel: "සන්සුන් වීම (Grounding)",
    title: "ගැඹුරු හුස්මක් ගන්න (Take a breath)",
    sinhalaText: "අපි මේ මොහොතේ මොහොතකට නතර වෙලා ගැඹුරු හුස්මක් ගනිමු. ඔබට මේ වෙලාවේ වැඩිපුරම දැනෙන්නේ මොන වගේ හැඟීමක්ද?",
    englishText: "Let us pause for a gentle moment together and take a slow, deep breath. What feeling feels heaviest for you right now?",
  },

  // 4. Crisis Referral (1-Click Emergency Numbers)
  {
    id: "crisis_01",
    category: "crisis",
    categoryLabel: "හදිසි උපකාර (Crisis Referral)",
    title: "හදිසි මානසික සුවතා ක්ෂණික ඇමතුම් (Helpline 1926 & CCCline 1333)",
    sinhalaText: "ඔබගේ ආරක්ෂාව සහ යහපැවැත්ම අපිට අංක එකේ වටිනාකමයි. ඔබට දැඩි පීඩනයක් හෝ තමාටම හානි කරගැනීමේ සිතුවිලි ඇති වේ නම්, කරුණාකර ජාතික මානසික සුවතා නොමිලේ ක්ෂණික ඇමතුම් අංකය 1926 (පැය 24 පුරා, නොමිලේ) හෝ CCCline 1333 අමතා ක්ෂණික සහය ලබාගන්න. අපිත් දිගටම මෙහි ඔබ සමඟ රැඳී සිටිනවා.",
    englishText: "Your safety, health, and wellbeing are paramount. If you are experiencing overwhelming distress or thoughts of self-harm, please reach out immediately to the National Mental Health 24/7 Toll-Free Helpline at 1926 or CCCline at 1333 for immediate professional support. We are also staying right here with you.",
  },

  // 5. Gentle Closing
  {
    id: "close_01",
    category: "closing",
    categoryLabel: "සමුගැනීම (Gentle Closing)",
    title: "අවසාන කාරුණික සුබපැතුම (Warm Closing)",
    sinhalaText: "අද ඔබ ඔබේ හැඟීම් මා සමඟ බෙදාගැනීම ගැන බොහෝම ස්තූතියි. ඉදිරියේදීත් ඔබට කතා කරන්න අවශ්‍ය ඕනෑම වේලාවක හිතට ඉඩක් වෙත නැවත පැමිණෙන්න. ඔබට සාමකාමී දවසක් ප්‍රාර්ථනා කරනවා.",
    englishText: "Thank you so much for courageously sharing your feelings today. Whenever you need someone who listens, you are always welcome back to Hithata Idak. Wishing you peace and comfort.",
  },
];

