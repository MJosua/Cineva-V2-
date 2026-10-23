import {formats, validateDocument, fail} from './model.mjs';
import {findTemplate} from './templates.mjs';
const esc = x => String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function lines(input, capacity) {
  const result=[];let line='';
  for(const token of input.split(/\s+/).filter(Boolean)) {
    const chunks=Array.from(token).length>capacity ? token.match(new RegExp(`.{1,${capacity}}`,'gu')) : [token];
    for(const word of chunks) {if(line&&Array.from(`${line} ${word}`).length>capacity){result.push(line);line=word;}else line+=`${line?' ':''}${word}`;}
  }
  if(line)result.push(line);return result;
}
/** Fixed-size deterministic SVG. Same renderer used by browser PNG export and server renderer port. */
export function renderSlide(doc,index) {
  validateDocument(doc);const t=findTemplate(doc.templateId),size=formats[doc.format],closing=index===doc.slides.length&&doc.brand.closing;
  fail(closing||Number.isSafeInteger(index)&&index>=0&&index<doc.slides.length,'INVALID_SLIDE_INDEX');
  const slide=closing?{title:doc.brand.name,body:doc.brand.tagline}:doc.slides[index];
  const title=lines(slide.title,25),body=lines(slide.body,43);
  fail(title.length<=6&&body.length<=14,'TEXT_OVERFLOW');
  const white=!slide.image&&(t.background==='#ffffff'||t.background==='#f5f0e7'),fg=white?'#30261f':'#ffffff';
  const y=t.layout==='quote'?310:t.layout==='headline'?380:270;
  const titleY=y,bodyY=y+title.length*83+65;
  fail(bodyY+body.length*46<size.height-160,'TEXT_OVERFLOW');
  const textLines=(texts,start,step,font,bold)=>texts.map((line,i)=>`<text x="82" y="${start+i*step}" font-family="Arial, sans-serif" font-size="${font}" font-weight="${bold}" fill="${fg}">${esc(line)}</text>`).join('');
  const logo=(slide.image?`<image href="${esc(slide.image)}" x="0" y="0" width="1080" height="${size.height}" preserveAspectRatio="xMidYMid slice"/><rect width="1080" height="${size.height}" fill="#000000" opacity="0.65"/>`:'')+(doc.brand.logo?`<image href="${esc(doc.brand.logo)}" x="82" y="65" width="80" height="80" preserveAspectRatio="xMidYMid meet"/>`:'');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}"><rect width="1080" height="${size.height}" fill="${t.background}"/><rect x="0" y="0" width="22" height="${size.height}" fill="${esc(doc.brand.color)}"/><circle cx="1040" cy="60" r="330" fill="${t.accent}" opacity="0.08"/><path d="M 82 192 L 998 192" stroke="${t.accent}" stroke-width="3"/>${logo}<text x="${doc.brand.logo?180:82}" y="115" font-family="Arial, sans-serif" font-size="29" font-weight="700" fill="${t.accent}">${esc(doc.brand.name)}</text>${t.layout==='quote'?`<text x="80" y="245" font-family="Georgia" font-size="125" fill="${t.accent}">“</text>`:''}${textLines(title,titleY,83,69,700)}${textLines(body,bodyY,46,35,400)}<path d="M 82 ${size.height-135} L 998 ${size.height-135}" stroke="${t.accent}" opacity="0.45"/><text x="82" y="${size.height-85}" font-family="Arial, sans-serif" font-size="27" fill="${t.accent}">${esc(doc.brand.handle)}</text><text x="995" y="${size.height-85}" text-anchor="end" font-family="Arial, sans-serif" font-size="25" fill="${t.accent}">${index+1}/${doc.slides.length+(doc.brand.closing?1:0)}</text>${doc.brand.watermark?`<text x="995" y="${size.height-40}" text-anchor="end" font-family="Arial, sans-serif" font-size="18" fill="${fg}" opacity="0.55">Made with Cineva</text>`:''}</svg>`;
}
export function renderManifest(doc) {validateDocument(doc);const template=findTemplate(doc.templateId);const slides=Array.from({length:doc.slides.length+(doc.brand.closing?1:0)},(_,i)=>renderSlide(doc,i));return {schema_version:1,documentId:doc.id,revision:doc.revision,templateId:template.id,templateVersion:template.version,format:doc.format,...formats[doc.format],rendererVersion:'1',font:'Arial',slides};}
