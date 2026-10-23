import {createDocument,reviewDocument,defaultBrand,templates,providers,type ContentDocument} from '@hots/content-kit';
import type {ContentState} from '../types';
import type {PortableStudio} from './model';
/** Synthetic business examples only. No client workbooks or personal reference data included. */
export function createPortableSeed(now=new Date()):PortableStudio{
  const at=now.toISOString(),day=86400000,brand={...defaultBrand(),name:'Cineva',handle:'@cineva.demo',tagline:'Cerita brand Anda, lebih terarah.',color:'#b58a36'};
  function doc(id:string,title:string,phase:'draft'|'in_review'|'approved',templateId='golden'):ContentDocument{
    let d=createDocument({id,title,count:3,brand,templateId},at);
    d.slides=[{id:'slide-1',title,body:'Mulai dari pesan yang jelas. Pilih satu tujuan untuk setiap konten.'},{id:'slide-2',title:'Bangun cerita yang mudah diikuti',body:'Gunakan visual yang konsisten, isi ringkas, dan contoh yang relevan.'},{id:'slide-3',title:'Ajak audiens mengambil langkah',body:'Tutup dengan ajakan yang spesifik. Evaluasi hasilnya sebelum membuat konten berikutnya.'}];
    d.caption='Konten yang konsisten dimulai dari cerita yang terarah. Ini adalah contoh sintetis untuk demo Cineva.';d.hashtags='#CinevaDemo #ContentStudio';
    if(phase!=='draft')d=reviewDocument(d,'submit',{id:'demo-creator'},1,'',at);
    if(phase==='approved')d=reviewDocument(d,'approve',{id:'demo-reviewer',canApprove:true},2,'Contoh persetujuan QC untuk demo.',at);
    return d;
  }
  function state(role:'hq'|'creator'):ContentState{
    const prefix=`${role}-demo`,documents=[doc(`${prefix}-draft`,'3 langkah konten yang konsisten','draft'),doc(`${prefix}-review`,'Cerita brand yang layak dibagikan','in_review','editorial'),doc(`${prefix}-ready`,'Rencana konten minggu ini','approved','impact'),doc(`${prefix}-published`,'Ide kecil, cerita yang berarti','approved','golden')];
    const accounts=providers.map(provider=>({id:`demo-${provider}`,provider,name:`Cineva Demo · ${provider}`,active:true,formats:['feed','carousel']}));
    const targets=providers.map((provider,i)=>({id:`${prefix}-post-${i}`,documentId:documents[3].id,revision:documents[3].revision,provider,accountId:`demo-${provider}`,format:'carousel',status:'published',scheduledAt:new Date(+now-(i+1)*day).toISOString(),publishedAt:new Date(+now-(i+1)*day).toISOString(),templateId:'golden',title:documents[3].title,postId:`DEMO-${provider}`}));
    targets.push({id:`${prefix}-scheduled`,documentId:documents[2].id,revision:documents[2].revision,provider:'instagram',accountId:'demo-instagram',format:'carousel',status:'scheduled',scheduledAt:new Date(+now+2*3600000).toISOString(),publishedAt:undefined,templateId:'impact',title:documents[2].title,postId:undefined});
    const snapshots=targets.filter(t=>t.status==='published').map((target,i)=>({id:`${prefix}-metric-${i}`,targetId:target.id,capturedAt:at,source:'synthetic-portable-demo',metrics:{views:[1240,980,720,460][i],likes:[48,36,25,18][i],comments:[8,5,4,2][i],shares:[6,4,3,2][i],saves:[10,7,5,3][i],reposts:0,followers:null}}));
    return {schema_version:1,revision:0,brand:structuredClone(brand),documents,accounts,targets,snapshots,usage:{generation:0,render:0,publish:5},settings:{defaultTemplate:'golden',favoriteTemplates:['golden','editorial']},templates,plan:{generation:50,render:100,publish:100,removeWatermark:true},capabilities:providers.map(provider=>({provider,formats:['feed','carousel'],audio:provider==='tiktok'})),mode:'preview'};
  }
  return {schema_version:1,createdAt:at,workspaces:{hq:state('hq'),creator:state('creator')}};
}
