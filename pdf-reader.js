export const MAX_BYTES = 10 * 1024 * 1024;
export const MAX_PAGES = 30;
export const MAX_TEXT = 60000;
export function validateFile(file) {
  if (!file || !/\.pdf$/i.test(file.name)) throw new Error('Choose a PDF file (.pdf).');
  if (!file.size) throw new Error('This PDF is empty. Choose another file.');
  if (file.size > MAX_BYTES) throw new Error('This PDF is too large. Choose a file under 10 MB.');
}
export function pageText(items) {
  let result = '', lastY;
  for (const item of items) {
    if (typeof item.str !== 'string') continue;
    const y = item.transform?.[5];
    if (lastY !== undefined && y !== undefined && Math.abs(y-lastY)>3 && !result.endsWith('\n')) result += '\n';
    result += item.str + (item.hasEOL ? '\n' : ' ');
    lastY = y;
  }
  return result.replace(/[ \t]+\n/g,'\n').trim();
}
export async function extractPdf(file, {onProgress = ()=>{}, signal, loadParser = ()=>import('./vendor/pdf.min.mjs')} = {}) {
  validateFile(file);
  const check = ()=>{if(signal?.aborted) throw new DOMException('Cancelled','AbortError');};
  check();
  const data = new Uint8Array(await file.arrayBuffer());
  if (!new TextDecoder().decode(data.slice(0,1024)).includes('%PDF-')) throw new Error('This file is not a valid PDF. Export your resume as PDF and try again.');
  check();
  let parser;
  try { parser = await loadParser(); } catch { throw new Error('The PDF reader could not load. Refresh the page and try again in a current browser.'); }
  check();
  parser.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs',import.meta.url).href;
  const task = parser.getDocument({data, isEvalSupported:false, useSystemFonts:true, disableFontFace:true, useWasm:false, stopAtErrors:true});
  const abort = ()=>{void task.destroy().catch(()=>{});};
  signal?.addEventListener('abort',abort,{once:true});
  let timedOut = false;
  const timer = setTimeout(()=>{timedOut=true;abort();},45000);
  try {
    const pdf = await task.promise;
    check();
    if (pdf.numPages > MAX_PAGES) throw new Error('This PDF has too many pages. Choose a resume with 30 pages or fewer.');
    const pages = []; let length = 0, emptyPages = 0;
    for (let n=1;n<=pdf.numPages;n++) {
      check(); onProgress(n,pdf.numPages);
      const page = await pdf.getPage(n);
      const text = pageText((await page.getTextContent()).items);
      page.cleanup();
      if (!text.trim()) emptyPages++;
      length += text.length+2;
      if (length > MAX_TEXT) throw new Error('This PDF contains more than 60,000 characters. Choose a shorter resume.');
      pages.push(text);
    }
    const text = pages.join('\n\n').trim();
    if (!/[\p{L}\p{N}]/u.test(text)) throw new Error('No selectable text was found. Scanned or image-only PDFs need OCR first; upload a PDF with selectable text.');
    return {text,pages:pdf.numPages,emptyPages};
  } catch(error) {
    check();
    if(timedOut) throw new Error('Reading this PDF took too long. Try a smaller or simpler PDF.');
    if(error.name === 'PasswordException') throw new Error('This PDF is password-protected. Upload an unlocked copy.');
    if(error.name === 'InvalidPDFException' || error.name === 'FormatError') throw new Error('This PDF is invalid or damaged. Export a fresh PDF and try again.');
    if(error.name === 'UnknownErrorException' || /worker|destroyed|terminated/i.test(error.message)) throw new Error('The PDF could not be read. Try a simpler PDF or a current browser.');
    throw error;
  } finally { clearTimeout(timer); signal?.removeEventListener('abort',abort); await task.destroy().catch(()=>{}); }
}
