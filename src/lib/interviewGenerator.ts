export type InterviewQuestion = { category: string; question: string; expectedTopics?: string[] };

const TECH_TEMPLATES: Record<string, string[]> = {
  react: [
    'Explain the virtual DOM in React and why it matters.',
    'How does useEffect work and when would you use it?',
    'Describe props vs state in React and best practices.'
  ],
  typescript: [
    'What are the advantages of TypeScript over plain JavaScript?',
    'Explain generics in TypeScript with an example.',
    'How does TypeScript structural typing work?'
  ],
  python: [
    'Explain list comprehensions and give an example.',
    'How would you manage virtual environments in Python?',
    'Describe the GIL and its implications.'
  ],
};

const BEHAVIORAL = [
  'Tell me about a time you faced a difficult technical problem. How did you solve it?',
  'Describe a situation where you worked in a team and faced disagreement. What did you do?'
];

const HR = ['Why are you interested in this role and where do you see yourself in 2 years?'];

export function generateInterviewQuestions(skills: string[]): InterviewQuestion[] {
  const lower = skills.map(s => s.toLowerCase());
  const questions: InterviewQuestion[] = [];

  // Technical: prefer templates for detected skills
  const techCandidates: string[] = [];
  for (const s of lower) {
    if (TECH_TEMPLATES[s as keyof typeof TECH_TEMPLATES]) techCandidates.push(s);
  }

  // Fill up to 3 technical questions
  if (techCandidates.length === 0 && lower.length > 0) techCandidates.push(lower[0]);

  let techCount = 0;
  for (const candidate of techCandidates) {
    const tmpl = TECH_TEMPLATES[candidate as keyof typeof TECH_TEMPLATES] || [
      `Explain core concepts of ${candidate}.`,
      `How would you debug a performance problem in ${candidate}?`,
      `Describe a project you built using ${candidate}.`
    ];
    for (const q of tmpl) {
      if (techCount >= 3) break;
      questions.push({ category: 'technical', question: q, expectedTopics: [candidate] });
      techCount++;
    }
    if (techCount >= 3) break;
  }

  // Behavioral
  for (let i = 0; i < Math.min(2, BEHAVIORAL.length); i++) {
    questions.push({ category: 'behavioral', question: BEHAVIORAL[i] });
  }

  // HR
  questions.push({ category: 'hr', question: HR[0] });

  return questions;
}

export default generateInterviewQuestions;
