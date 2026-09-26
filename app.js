import {analyze} from './analyzer.js';
import {extractPdf} from './pdf-reader.js';
const $ = id => document.getElementById(id);
let resumeText = '', uploadController;
function resetReport() {$('report').hidden=true;$('report').replaceChildren();$('empty').hidden=false;$('error').textContent='';$('status').textContent='';}
$('job').addEventListener('input',resetReport);
function clearUpload() { uploadController?.abort(); uploadController=null; resumeText=''; $('analyze').disabled=true; $('pdf-status').textContent=''; $('pdf-error').textContent=''; $('preview').textContent=''; $('preview-wrap').hidden=true; $('form').setAttribute('aria-busy','false'); resetReport(); }
$('clear').addEventListener('click',()=>{clearUpload();$('form').reset();$('pdf').focus();});
$('pdf').addEventListener('change',async()=>{
  clearUpload(); const file=$('pdf').files[0]; if(!file)return;
  const controller=new AbortController(); uploadController=controller;
  $('form').setAttribute('aria-busy','true'); $('pdf-status').textContent='Reading PDF on your device…';
  try {
    const result=await extractPdf(file,{signal:controller.signal,onProgress:(n,total)=>{$('pdf-status').textContent=`Reading page ${n} of ${total}…`;}});
    if(controller.signal.aborted)return;
    resumeText=result.text; $('preview').textContent=result.text; $('preview-wrap').hidden=false;
    $('pdf-status').textContent=`Ready: ${file.name} · ${result.pages} page(s) · ${result.text.split(/\s+/).length} words.${result.emptyPages ? ` ${result.emptyPages} page(s) had no selectable text and were skipped.` : ''} Review the extracted text before analyzing.`;
    $('analyze').disabled=false;
  } catch(error) { if(!controller.signal.aborted) { $('pdf-status').textContent=''; $('pdf-error').textContent=error.message; } }
  finally { if(uploadController===controller) $('form').setAttribute('aria-busy','false'); }
});
function el(tag, text, className) {const n=document.createElement(tag);n.textContent=text;if(className)n.className=className;return n;}
function chips(parent, items) {const row=el('div','','chips');for(const item of items)row.append(el('span',item.label,`chip${item.found?'':' missing'}`));parent.append(row);}
$('form').addEventListener('submit',event=>{
  event.preventDefault();
  try {
    if (!resumeText) throw new Error('Upload a readable resume PDF first.');
    const r=analyze(resumeText,$('job').value);const report=$('report');report.replaceChildren();
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
