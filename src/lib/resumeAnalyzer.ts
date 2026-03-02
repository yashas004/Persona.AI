export type ExperienceLevel = 'student' | 'fresher' | 'experienced';

const LANGUAGES = ['javascript','typescript','python','java','c++','c#','go','rust','ruby','php','swift','kotlin'];
const FRAMEWORKS = ['react','vue','angular','svelte','next.js','nestjs','express','spring','django','flask','tensorflow','pytorch'];
const TOOLS = ['git','docker','kubernetes','aws','gcp','azure','postgresql','mysql','mongodb','redis','jira','figma','webpack','vite'];

export function analyzeResumeText(text: string): { skills: string[]; experienceLevel: ExperienceLevel } {
  const normalized = (text || '').toLowerCase();
  const found = new Set<string>();

  for (const w of LANGUAGES) if (normalized.includes(w)) found.add(capitalizeToken(w));
  for (const f of FRAMEWORKS) if (normalized.includes(f)) found.add(capitalizeToken(f));
  for (const t of TOOLS) if (normalized.includes(t)) found.add(capitalizeToken(t));

  // If no matches, try extracting camel-case-ish tokens as fallback
  if (found.size === 0) {
    const tokens = normalized.match(/[A-Za-z+#.\-]{2,}/g) || [];
    tokens.slice(0, 8).forEach(t => found.add(capitalizeToken(t)));
  }

  // Estimate experience: look for years or keywords
  let level: ExperienceLevel = 'fresher';
  if (/\b(student|intern|b\.sc|m\.sc|btech|bachelor)\b/.test(normalized)) level = 'student';
  else if (/\b(fresher|entry[- ]level|0\s?years|0yrs)\b/.test(normalized)) level = 'fresher';
  else {
    const years = normalized.match(/(\d{1,2})\+?\s+years?/);
    if (years) {
      const n = parseInt(years[1], 10);
      if (n >= 3) level = 'experienced';
      else level = 'fresher';
    }
  }

  return { skills: Array.from(found), experienceLevel: level };
}

function capitalizeToken(t: string) {
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default analyzeResumeText;
