import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=path.resolve(import.meta.dirname,'../../..'),require=createRequire(path.join(root,'2.Backend/Integrated-API/package.json'));
const env=require('dotenv').parse(await fs.readFile('D:/Kantor/2.Backend/Integrated-API/.env'));
const result={source:'HOTS existing configuration',client_id:env.SSO_CLIENT_ID||'hots-web',clientSecretConfigured:!!env.SSO_CLIENT_SECRET,discoveryVerified:false};
try{
 const configured=new URL(env.OIDC_ISSUER);
 const issuer=configured.protocol==='https:'?configured:new URL('https://www.indofoodinternational.com/oauth');
 result.issuerSource=configured.protocol==='https:'?'existing environment':'candidate from confirmed HOTS origin and existing provider mount; metadata must verify';
 if(issuer.protocol!=='https:'||issuer.username||issuer.password||issuer.search||issuer.hash)throw Error('HTTPS_ISSUER_REQUIRED');
 result.issuer=issuer.href.replace(/\/$/,'');
 const response=await fetch(result.issuer+'/.well-known/openid-configuration',{redirect:'manual',signal:AbortSignal.timeout(10000)});
 result.httpStatus=response.status;
 if(!response.ok)throw Error('DISCOVERY_UNAVAILABLE');
 const metadata=await response.json();
 if(metadata.issuer!==result.issuer)throw Error('ISSUER_MISMATCH');
 for(const key of ['authorization_endpoint','token_endpoint','jwks_uri']){
  const url=new URL(metadata[key]);if(url.protocol!=='https:'||url.origin!==issuer.origin||url.username||url.password||url.hash)throw Error('ENDPOINT_ORIGIN_MISMATCH');result[key]=url.href;
 }
 result.discoveryVerified=true;
}catch(error){result.error=/^[A-Z_]+$/.test(error.message)?error.message:'SSO_DISCOVERY_CHECK_FAILED';if(/^[A-Z0-9_]+$/.test(error.cause?.code||''))result.transportError=error.cause.code;}
await fs.writeFile(path.join(root,'3.Knowledge/reports/tenant_foundation_2026_10_21/sso-readiness.json'),JSON.stringify(result,null,2));
process.stdout.write(`[TENANT-SSO][INFO] : discovery verified=${result.discoveryVerified}; secret configured=${result.clientSecretConfigured}; no credentials printed\n`);
