const SKILLS = ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'react', 'angular', 'vue', 'node.js', 'sql', 'postgresql', 'mysql', 'mongodb', 'html', 'css', 'git', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'excel', 'power bi', 'tableau', 'figma', 'project management', 'communication', 'leadership', 'data analysis', 'machine learning', 'customer service', 'sales', 'marketing', 'budgeting', 'accounting', 'research', 'agile', 'scrum', 'testing', 'rest', 'api', 'linux'];
const STOP = new Set('the and for with that this from your you our are will have has must can all any not but into about their they work team role years experience required preferred skills ability strong using including such other looking responsibilities qualifications company candidate excellent knowledge working join based'.split(' '));
export function hasTerm(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('(?<![a-z0-9])' + escaped + '(?![a-z0-9])', 'i').test(text);
}
export function analyze(resume, job = '') {
  if (typeof resume !== 'string' || !resume.trim()) throw new Error('Paste your resume to begin.');
  if (resume.length > 60000 || job.length > 60000) throw new Error('Keep each text under 60,000 characters.');
  const words = resume.trim().split(/\s+/).length;
  const sections = [
    ['Experience', /^(?:work |professional |employment )?(?:experience|employment history|work history)\s*:?$/im],
    ['Education', /^(?:education|academic background|qualifications)\s*:?$/im],
    ['Skills', /^(?:(?:technical|core|key) )?(?:skills|competencies)\s*:?$/im],
    ['Summary', /^(?:(?:professional|career|personal) )?(?:summary|profile|objective)\s*:?$/im]
  ].map(([name, pattern]) => ({name, found: pattern.test(resume.trim())}));
  const bullets = resume.split(/\r?\n/).map(s => s.trim()).filter(s => /^(?:[-*•‣]|\d+[.)])\s+/.test(s));
  const quantified = bullets.filter(s => /(?:\d[\d,.]*\s*(?:%|percent|hours?|days?|weeks?|months?|users?|customers?|projects?|people|million|thousand)|[$£€₹]\s*\d)/i.test(s)).length;
  const action = bullets.filter(s => /^(?:[-*•‣]|\d+[.)])\s+(?:built|led|created|improved|reduced|increased|designed|developed|launched|managed|delivered|analyzed|automated|implemented|coordinated|resolved|supported|trained|organized|achieved)\b/i.test(s)).length;
  const skills = SKILLS.filter(s => hasTerm(resume, s));
  const contact = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(resume);
  let keywords = [];
  if (job.trim()) {
    const recognized = SKILLS.filter(s => hasTerm(job, s));
    const frequency = new Map();
    for (const word of job.toLowerCase().match(/[a-z][a-z-]{3,}/g) || []) {
      if (!STOP.has(word) && !recognized.includes(word)) frequency.set(word, (frequency.get(word) || 0) + 1);
    }
    const repeated = [...frequency].filter(([, n]) => n >= 2).sort((a,b) => b[1]-a[1]).slice(0,15).map(([s])=>s);
    keywords = [...new Set([...recognized, ...repeated])].map(term => ({term, found: hasTerm(resume, term)}));
  }
  const suggestions = [];
  for (const s of sections.filter(s => !s.found && s.name !== 'Summary')) suggestions.push(`Make your ${s.name.toLowerCase()} easy to find with a separate, standard heading.`);
  if (!contact) suggestions.push('Add a professional email address if this is the version you plan to send.');
  if (words < 150) suggestions.push('Add more detail about relevant responsibilities, projects, and outcomes; this text is quite brief.');
  if (words > 900) suggestions.push('Review lengthy or older details and prioritize evidence relevant to your target role.');
  if (!bullets.length) suggestions.push('Use short bullets under each role to make accomplishments easier to scan.');
  else {
    if (quantified < Math.ceil(bullets.length / 2)) suggestions.push('Where accurate, add scope or outcomes to bullets: time saved, customers supported, or measurable improvements.');
    if (action < Math.ceil(bullets.length / 2)) suggestions.push('Start more bullets with specific actions such as built, led, improved, or delivered.');
  }
  if (keywords.some(k=>!k.found)) suggestions.push('Review the missing job terms below. Include them only when they accurately describe your experience.');
  if (!suggestions.length) suggestions.push('Review each accomplishment for clarity and verify that dates, claims, and contact details are accurate.');
  return {words, sections, bullets: bullets.length, quantified, action, skills, contact, keywords, overlap: keywords.length ? Math.round(keywords.filter(k=>k.found).length / keywords.length * 100) : null, suggestions};
}
