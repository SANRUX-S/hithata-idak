/**
 * High-performance Singlish to Sinhala Unicode Transliteration Engine.
 * Translates phonetic English representations into authentic Sinhala Unicode.
 */

// Special dictionary for common high-frequency words for natural typing
const WORD_DICT: Record<string, string> = {
  mama: "මම",
  mata: "මට",
  oyata: "ඔයාට",
  oya: "ඔයා",
  oba: "ඔබ",
  obata: "ඔබට",
  kohomada: "කොහොමද",
  sthuthi: "ස්තූතියි",
  sthuthiy: "ස්තූතියි",
  godak: "ගොඩක්",
  inna: "ඉන්න",
  inne: "ඉන්නේ",
  innawa: "ඉන්නවා",
  karanna: "කරන්න",
  katha: "කතා",
  hithata: "හිතට",
  idak: "ඉඩක්",
  sahana: "සහන",
  sahane: "සහනය",
  duka: "දුක",
  dukay: "දුකයි",
  epa: "එපා",
  ow: "ඔව්",
  ne: "නෑ",
  naha: "නැහැ",
  mokakda: "මොකක්ද",
  puluwanda: "පුළුවන්ද",
  puluwan: "පුළුවන්",
  hari: "හරි",
  bohoma: "බොහෝම",
  subha: "සුභ",
  dawasak: "දවසක්",
  ayubowan: "ආයුබෝවන්",
  thaniwela: "තනිවෙලා",
  hithanna: "හිතන්න",
  prashna: "ප්‍රශ්න",
  karadarayak: "කරදරයක්",
};

// Consonant character mappings
const CONSONANTS: [string, string][] = [
  ["sh", "ශ්"],
  ["th", "ත්"],
  ["dh", "ද්"],
  ["ch", "ච්"],
  ["ph", "ෆ්"],
  ["bh", "භ්"],
  ["kh", "ඛ්"],
  ["gh", "ඝ්"],
  ["jh", "ඣ්"],
  ["gn", "ඥ්"],
  ["kn", "ඤ්"],
  ["k", "ක්"],
  ["g", "ග්"],
  ["c", "ච්"],
  ["j", "ජ්"],
  ["t", "ට්"],
  ["d", "ඩ්"],
  ["n", "න්"],
  ["p", "ප්"],
  ["b", "බ්"],
  ["m", "ම්"],
  ["y", "ය්"],
  ["r", "ර්"],
  ["l", "ල්"],
  ["v", "ව්"],
  ["w", "ව්"],
  ["s", "ස්"],
  ["h", "හ්"],
  ["f", "ෆ්"],
];

// Vowel modifier mappings on a hal consonant
const VOWEL_MODIFIERS: [string, string][] = [
  ["aae", "ෑ"],
  ["ae", "ැ"],
  ["aa", "ා"],
  ["ii", "ී"],
  ["uu", "ූ"],
  ["ee", "ේ"],
  ["oo", "ෝ"],
  ["ai", "ෛ"],
  ["au", "ෞ"],
  ["a", ""],
  ["i", "ි"],
  ["u", "ු"],
  ["e", "ෙ"],
  ["o", "ො"],
];

// Standalone vowel mappings
const STANDALONE_VOWELS: [string, string][] = [
  ["aae", "ඈ"],
  ["ae", "ඇ"],
  ["aa", "ආ"],
  ["ii", "ඊ"],
  ["uu", "ඌ"],
  ["ee", "ඒ"],
  ["oo", "ඕ"],
  ["ai", "ඓ"],
  ["au", "ඖ"],
  ["a", "අ"],
  ["i", "ඉ"],
  ["u", "උ"],
  ["e", "එ"],
  ["o", "ඔ"],
];

function transliterateWord(rawWord: string): string {
  const lower = rawWord.toLowerCase();
  if (WORD_DICT[lower]) {
    // Preserve initial capitalization if present
    return WORD_DICT[lower];
  }

  let result = "";
  let i = 0;
  const len = rawWord.length;

  while (i < len) {
    // 1. Check for standalone vowels at start or after a completed syllable
    let matchedConsonant: [string, string] | null = null;
    for (const c of CONSONANTS) {
      if (rawWord.toLowerCase().startsWith(c[0], i)) {
        matchedConsonant = c;
        break;
      }
    }

    if (matchedConsonant) {
      i += matchedConsonant[0].length;
      // Look ahead for vowel modifier
      let matchedVowelMod: [string, string] | null = null;
      for (const vm of VOWEL_MODIFIERS) {
        if (rawWord.toLowerCase().startsWith(vm[0], i)) {
          matchedVowelMod = vm;
          break;
        }
      }

      if (matchedVowelMod) {
        i += matchedVowelMod[0].length;
        // Strip the virama/al-lakuna ('්') from the consonant and attach vowel modifier
        const baseChar = matchedConsonant[1].replace("්", "");
        if (matchedVowelMod[1].startsWith("ෙ") || matchedVowelMod[1].startsWith("ෛ")) {
          // Kombuwa comes before in Unicode rendering
          result += baseChar + matchedVowelMod[1];
        } else {
          result += baseChar + matchedVowelMod[1];
        }
      } else {
        // Just the hal consonant (e.g. "k" with virama)
        result += matchedConsonant[1];
      }
    } else {
      // Check standalone vowel
      let matchedVowel: [string, string] | null = null;
      for (const sv of STANDALONE_VOWELS) {
        if (rawWord.toLowerCase().startsWith(sv[0], i)) {
          matchedVowel = sv;
          break;
        }
      }

      if (matchedVowel) {
        result += matchedVowel[1];
        i += matchedVowel[0].length;
      } else {
        result += rawWord[i];
        i++;
      }
    }
  }

  return result;
}

/**
 * Transliterates text from Singlish to Sinhala Unicode.
 * Words separated by whitespace or punctuation are converted intelligently.
 */
export function transliterateSinglishToSinhala(text: string): string {
  if (!text) return "";

  // Split keeping delimiters intact
  const tokens = text.split(/(\s+|[.,!?;:()\[\]{}"'\-\n])/);

  return tokens
    .map((token) => {
      if (!token || /^\s+$/.test(token) || /^[.,!?;:()\[\]{}"'\-]+$/.test(token)) {
        return token;
      }
      return transliterateWord(token);
    })
    .join("");
}

