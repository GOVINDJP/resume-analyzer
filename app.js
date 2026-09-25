import {analyze} from './analyzer.js';
const $ = id => document.getElementById(id);
const sample = `Alex Morgan
alex@example.com

Summary
Software developer building accessible web applications.

Experience
Software Developer | Example Studio | 2022–2025
- Built React and TypeScript dashboards for 500 users.
- Reduced reporting time by 30 percent through SQL automation.
- Collaborated with designers to improve customer workflows.

Education
BSc Computer Science | Example University | 2022

Skills
JavaScript, TypeScript, React, SQL, HTML, CSS, Git, testing`;
const sampleJob = 'We seek a developer with React, TypeScript, SQL, Docker and AWS. Build accessible applications. Collaborate on accessible applications and improve testing.';
const count = () => {$('count').textContent = `${$('resume').value.trim() ? $('resume').value.trim().split(/\s+/).length : 0} words`;};
function resetReport() {$('report').hidden=true;$('report').replaceChildren();$('empty').hidden=false;$('error').textContent='';$('status').textContent='';}
for (const id of ['resume','job']) $(id).addEventListener('input',()=>{count();resetReport();});
$('sample').addEventListener('click',()=>{$('resume').value=sample;$('job').value=sampleJob;count();resetReport();});
$('clear').addEventListener('click',()=>{$('form').reset();count();resetReport();$('resume').focus();});
function el(tag, text, className) {const n=document.createElement(tag);n.textContent=text;if(className)n.className=className;return n;}
function chips(parent, items) {const row=el('div','','chips');for(const item of items)row.append(el('span',item.label,`chip${item.found?'':' missing'}`));parent.append(row);}
$('form').addEventListener('submit',event=>{
  event.preventDefault();
  try {
    const r=analyze($('resume').value,$('job').value);const report=$('report');report.replaceChildren();
    const stats=el('div','','stats');for(const [value,label] of [[r.words,'words'],[r.bullets,'bullet points'],[r.quantified,'measured bullets']]){const stat=el('div','','stat');stat.append(el('b',String(value)),el('span',label));stats.append(stat);}report.append(stats);
    report.append(el('h3','Structure check','section-title'));
    chips(report,r.sections.map(s=>({label:`${s.found?'✓':'○'} ${s.name}`,found:s.found})));
    report.append(el('p',`Email ${r.contact?'detected':'not detected'} · ${r.action} bullet(s) begin with a recognized action verb. Headings must appear on their own line; a summary is optional.`,'review-note'));
    report.append(el('h3','Recognized skills','section-title'));
    if(r.skills.length)chips(report,r.skills.map(s=>({label:s,found:true})));else report.append(el('p','No terms from the small built-in skill list were detected. This does not mean you lack skills.','review-note'));
    report.append(el('h3','Job keyword overlap','section-title'));
    if(r.overlap!==null){report.append(el('p',`${r.overlap}% of extracted terms found (${r.keywords.filter(k=>k.found).length}/${r.keywords.length}). Green = found; amber = not found.`,'review-note'));chips(report,r.keywords.map(k=>({label:`${k.found?'✓':'○'} ${k.term}`,found:k.found})));report.append(el('p','Uses recognized skills plus up to 15 repeated non-common words. Exact, case-insensitive matches only; no synonym or context analysis. This percentage is not a job-fit score.','review-note'));}else report.append(el('p',$('job').value.trim()?'No supported skills or repeated keywords found in this description.':'Add a job description to compare terms.','review-note'));
    report.append(el('h3','Your next edits','section-title'));const list=el('ol','','suggestions');r.suggestions.forEach(s=>list.append(el('li',s)));report.append(list);
    const download=el('button','Download review ↓','secondary download');download.type='button';download.addEventListener('click',()=>{const content=['Resume Analyzer — heuristic review',`${r.words} words; ${r.bullets} bullets; ${r.quantified} measured bullets`,...r.sections.map(s=>`${s.name}: ${s.found?'detected':'not detected'}`),`Recognized skills: ${r.skills.join(', ') || 'None'}`,`Keyword overlap: ${r.overlap===null?'Not available':r.overlap+'%'}`,...r.keywords.map(k=>`${k.found?'Found':'Missing'}: ${k.term}`),'Next edits:',...r.suggestions,'Rule-based aid; not AI analysis, an ATS score, or a hiring prediction.'].join('\n');const url=URL.createObjectURL(new Blob([content],{type:'text/plain'}));const a=el('a','');a.href=url;a.download='resume-review.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});report.append(download);
    $('empty').hidden=true;report.hidden=false;$('error').textContent='';$('status').textContent='Review complete. Results are ready.';report.focus();
  } catch(error){$('error').textContent=error.message;}
});
