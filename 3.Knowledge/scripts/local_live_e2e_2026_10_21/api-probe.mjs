import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../../..');
/** Real local API integration probe. Credentials/token stay in memory and are never reported. */
export async function runProbe({username,password,apiBase='http://localhost:9999',foreignTicketId}) {
 if(!/^http:\/\/(localhost|127\.0\.0\.1):9999$/.test(apiBase))throw Error('EXPLICIT_LOCAL_API_REQUIRED');
 const report={apiBase,account:username,fixture:false,interception:false,checks:[],companies:[]};
 const request=async(endpoint,token)=>{
  const response=await fetch(apiBase+endpoint,{headers:token?{Authorization:`Bearer ${token}`}:{},signal:AbortSignal.timeout(20000)});
  const text=await response.text();let body;try{body=JSON.parse(text);}catch{}
  return {status:response.status,json:body,contentType:response.headers.get('content-type')};
 };
 for(const endpoint of ['/api/tenant/v1/bootstrap','/oauth/.well-known/openid-configuration','/engine/par-document/tickets?limit=1&page=1']){
  const response=await request(endpoint);report.checks.push({endpoint,status:response.status,json:!!response.json,contentType:response.contentType,code:response.json?.error?.code||null});
 }
 for(const company of [{code:'indousa',id:2,country:704},{code:'indocanada',id:3,country:716}]){
  const response=await fetch(apiBase+'/hots_auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({uid:username,asin:password,country_id:company.country,company_code:company.code}),signal:AbortSignal.timeout(20000)});
  const body=await response.json();
  if(!response.ok||!body.success||!body.hots_tokek){
   if(body.message!=='bukan negara area akun tersebut')throw Error('LOCAL_AUTHENTICATION_FAILED');
   report.companies.push({company:company.code,requestedCompany:company.id,loginStatus:response.status,loginAllowed:false,message:body.message});continue;
  }
  const token=body.hots_tokek,claims=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString('utf8'));
  // Decode is observational only: it is never used as a signature verifier or access grant.
  const entry={company:company.code,requestedCompany:company.id,user_id:body.userData?.user_id,role_id:body.userData?.role_id,claims:{login_company_id:claims.login_company_id??null,login_country_id:claims.login_country_id??null,program_id:claims.program_id??null},reads:[]};
  for(const suffix of ['',`&company_id=${company.id}`,`&company_id=${company.id===2?3:2}`]){
   const endpoint='/engine/par-document/tickets?limit=20&page=1'+suffix;
   const answer=await request(endpoint,token),rows=Array.isArray(answer.json?.data)?answer.json.data:[];
   entry.reads.push({endpoint,status:answer.status,total:answer.json?.pagination?.total??answer.json?.pagination?.totalRows??null,rowCount:rows.length,companyIds:[...new Set(rows.map(r=>r.company_id))],rowSetFingerprint:crypto.createHash('sha256').update(JSON.stringify(rows.map(r=>r.ticket_id).sort())).digest('hex')});
  }
  const refreshed=await request('/hots_auth/keeplogin?boot=1',token);
  if(refreshed.json?.hots_tokek){const next=JSON.parse(Buffer.from(refreshed.json.hots_tokek.split('.')[1],'base64url').toString('utf8'));entry.refreshClaims={login_company_id:next.login_company_id??null,login_country_id:next.login_country_id??null};}
  const summary=await request('/engine/par-document/dashboard-summary?company_id='+company.id,token);
  entry.dashboard={status:summary.status,keys:Object.keys(summary.json?.data||{}),counts:summary.json?.data?.metrics||null};
  if(foreignTicketId){
   if(!/^[A-Za-z0-9_-]{1,36}$/.test(foreignTicketId))throw Error('INVALID_TICKET_ID');
   const detail=await request('/engine/par-document/tickets/'+foreignTicketId+'/form-data',token);
   entry.foreignDetail={status:detail.status,ok:detail.json?.ok??null};
   const other=await request('/engine/par-document/dashboard-summary?company_id='+(company.id===2?3:2),token);
   const all=await request('/engine/par-document/dashboard-summary',token);
   entry.otherCompanyDashboard={status:other.status,metrics:other.json?.data?.metrics||null};
   entry.unscopedDashboard={status:all.status,metrics:all.json?.data?.metrics||null};
  }
  report.companies.push(entry);
 }
 await fs.mkdir(path.join(root,'3.Knowledge/reports/local_live_e2e_2026_10_21'),{recursive:true});
 if(!/^[a-z0-9_.-]+$/i.test(username))throw Error('INVALID_REPORT_ACCOUNT');
 await fs.writeFile(path.join(root,'3.Knowledge/reports/local_live_e2e_2026_10_21/api.'+username+'.json'),JSON.stringify(report,null,2));
 return report;
}
