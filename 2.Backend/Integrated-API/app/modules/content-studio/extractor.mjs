import https from 'node:https';
import dns from 'node:dns/promises';
import {fail} from '../../../../../1.Frontend/packages/content-kit/src/index.mjs';
/** Fixed allowlist + pinned public IPv4 resolution prevents redirects/DNS rebinding to internal hosts. */
export function createArticleExtractor({hosts,lookup=dns.lookup,request=https.request}){
  fail(Array.isArray(hosts)&&hosts.length>0,'ARTICLE_HOST_ALLOWLIST_REQUIRED');
  return {async extract(value){const url=new URL(value);fail(url.protocol==='https:'&&!url.username&&!url.password&&(!url.port||url.port==='443')&&hosts.includes(url.hostname),'SOURCE_HOST_UNSUPPORTED');const ip=await lookup(url.hostname,{family:4});
    fail(!/^(0|10|127|169\.254|172\.(1[6-9]|2\d|3[01])|192\.168|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])|198\.(18|19)|22[4-9]|23\d|24\d|25[0-5])\./.test(ip.address),'SOURCE_NETWORK_FORBIDDEN');
    const html=await new Promise((resolve,reject)=>{const req=request(url,{method:'GET',timeout:15000,headers:{Accept:'text/html','User-Agent':'CinevaArticleReader/1.0'},lookup:(_host,_opts,done)=>done(null,ip.address,4)},res=>{if(res.statusCode!==200||!String(res.headers['content-type']).includes('text/html')){res.resume();reject(new Error('SOURCE_RESPONSE_UNSUPPORTED'));return;}let size=0,parts=[];res.on('data',b=>{size+=b.length;if(size>1000000){res.destroy();reject(new Error('SOURCE_TOO_LARGE'));}else parts.push(b);});res.on('end',()=>resolve(Buffer.concat(parts).toString('utf8')));res.on('error',reject);});req.on('timeout',()=>req.destroy(new Error('SOURCE_TIMEOUT')));req.on('error',reject);req.end();});
    const title=String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]??url.hostname;
    const text=String(html).replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().slice(0,20000);
    fail(text.length>=40,'SOURCE_EMPTY');return {url:url.href,title:title.slice(0,200),text};
  }};
}
