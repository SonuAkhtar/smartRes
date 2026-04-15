export type SkillCategory = 'technical' | 'tool' | 'soft' | 'other'

const TECH_KW = [
  'react', 'angular', 'vue', 'next.js', 'nextjs', 'typescript', 'javascript',
  'node.js', 'nodejs', 'python', 'django', 'fastapi', 'flask', 'sql',
  'postgresql', 'mysql', 'mongodb', 'redis', 'graphql', 'rest', 'api',
  'html', 'css', 'tailwind', 'sass', 'scss', 'swift', 'kotlin', 'flutter',
  'rust', 'go', 'java', 'c++', 'c#', 'express', 'spring', 'rails', 'php',
  'laravel', 'testing', 'jest', 'cypress', 'machine learning', 'deep learning',
  'tensorflow', 'pytorch', 'oauth', 'jwt', 'websockets', 'socket.io',
  'microservices', 'serverless', 'trpc', 'prisma', 'supabase', 'redux',
  'zustand', 'mobx', 'a11y', 'accessibility', 'seo', 'analytics',
]

const TOOL_KW = [
  'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'terraform', 'ci/cd', 'git',
  'github', 'gitlab', 'bitbucket', 'linux', 'bash', 'shell', 'devops',
  'datadog', 'prometheus', 'grafana', 'webpack', 'vite', 'vercel', 'netlify',
  'firebase', 'kafka', 'rabbitmq', 'elasticsearch', 'figma', 'sketch',
  'excel', 'powerpoint', 'word', 'tableau', 'power bi', 'jira', 'confluence',
  'notion', 'salesforce', 'zendesk', 'hubspot', 'stripe', 'postman', 'insomnia',
]

const SOFT_KW = [
  'leadership', 'communication', 'problem-solving', 'collaboration', 'mentoring',
  'teamwork', 'agile', 'scrum', 'kanban', 'management', 'presentation',
  'negotiation', 'adaptability', 'creativity', 'empathy', 'organisation',
  'organization', 'planning', 'critical thinking', 'time management',
  'stakeholder', 'product', 'strategy', 'roadmap',
]

function normalise(s: string) {
  return s.toLowerCase().replace(/\.js$/i, '').replace(/\s+/g, ' ').trim()
}

export function categorizeSkill(skill: string): SkillCategory {
  const n = normalise(skill)
  if (TECH_KW.some(k => n.includes(k) || k.includes(n))) return 'technical'
  if (TOOL_KW.some(k => n.includes(k) || k.includes(n))) return 'tool'
  if (SOFT_KW.some(k => n.includes(k) || k.includes(n))) return 'soft'
  return 'other'
}
