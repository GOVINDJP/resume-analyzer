import test from 'node:test';
import assert from 'node:assert/strict';
import {extractPdf,validateFile,pageText,MAX_BYTES} from './pdf-reader.js';
const file = {name:'resume.pdf',size:20,arrayBuffer:async()=>new TextEncoder().encode('%PDF-1.7 test').buffer};
function mock(pages, error) {
  let destroyed=false;
  return {parser:{GlobalWorkerOptions:{},getDocument:()=>({promise:error?Promise.reject(error):Promise.resolve({numPages:pages.length,getPage:async n=>({getTextContent:async()=>({items:pages[n-1]}),cleanup(){}})}),destroy:async()=>{destroyed=true;}})},destroyed:()=>destroyed};
}
test('file checks reject wrong type, empty and oversized PDFs',()=>{for(const f of [{name:'x.txt',size:1},{name:'x.pdf',size:0},{name:'x.pdf',size:MAX_BYTES+1}])assert.throws(()=>validateFile(f));assert.doesNotThrow(()=>validateFile(file));});
test('extracts headings and bullet lines',()=>assert.equal(pageText([{str:'Experience',transform:[1,0,0,1,0,700]},{str:'- Built tools',transform:[1,0,0,1,0,680],hasEOL:true}]),'Experience\n- Built tools'));
test('extracts pages and releases parser',async()=>{const m=mock([[{str:'Skills',hasEOL:true},{str:'Python'}],[]]);const r=await extractPdf(file,{loadParser:async()=>m.parser});assert.equal(r.text,'Skills\nPython');assert.equal(r.emptyPages,1);assert.equal(m.destroyed(),true);});
test('rejects image-only and excessive pages',async()=>{for(const [pages,pattern] of [[[[]],/selectable text/],[Array(31).fill([]),/30 pages/]]) {const m=mock(pages);await assert.rejects(extractPdf(file,{loadParser:async()=>m.parser}),pattern);assert.equal(m.destroyed(),true);}});
test('reports protected and damaged PDFs',async()=>{for(const [name,pattern] of [['PasswordException',/password-protected/],['InvalidPDFException',/invalid or damaged/]]){const m=mock([],Object.assign(new Error('bad'),{name}));await assert.rejects(extractPdf(file,{loadParser:async()=>m.parser}),pattern);}});
test('rejects wrong signatures and text above analysis limit',async()=>{await assert.rejects(extractPdf({...file,arrayBuffer:async()=>new TextEncoder().encode('not pdf').buffer}),/not a valid PDF/);const m=mock([[{str:'a'.repeat(60001)}]]);await assert.rejects(extractPdf(file,{loadParser:async()=>m.parser}),/60,000/);});
test('cancellation prevents extraction',async()=>{const c=new AbortController();c.abort();await assert.rejects(extractPdf(file,{signal:c.signal}),{name:'AbortError'});});
