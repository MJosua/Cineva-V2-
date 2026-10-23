import crypto from 'node:crypto';
import {fail} from '../../../../../1.Frontend/packages/content-kit/src/index.mjs';
/** OAuth endpoints/scopes/account resolver are explicit per deployment and provider app version.
 * Generic authorization-code/PKCE mechanics; no guessed account type or Facebook Page ownership.
 */
export function createOAuthCodeAdapter({authorizationEndpoint,tokenEndpoint,clientId,clientSecret,redirectUri,scopes,pkce=true,resolveAccount,fetchImpl=fetch}){
  for(const value of [authorizationEndpoint,tokenEndpoint,redirectUri]){const u=new URL(value);fail(u.protocol==='https:'&&!u.username&&!u.password,'OAUTH_HTTPS_CONFIGURATION');}
  fail(typeof clientId==='string'&&clientId.length>0&&Array.isArray(scopes)&&scopes.length>0&&typeof resolveAccount==='function','OAUTH_CONFIGURATION');
  async function token(fields){const response=await fetchImpl(tokenEndpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},redirect:'error',signal:AbortSignal.timeout(20000),body:new URLSearchParams({...fields,client_id:clientId,...(clientSecret?{client_secret:clientSecret}:{})})});const result=await response.json();fail(response.ok&&typeof result.access_token==='string'&&!result.error,'OAUTH_EXCHANGE_FAILED',502);return result;}
  return {
    async begin({state}){const url=new URL(authorizationEndpoint),verifier=crypto.randomBytes(32).toString('base64url');url.searchParams.set('response_type','code');url.searchParams.set('client_id',clientId);url.searchParams.set('redirect_uri',redirectUri);url.searchParams.set('scope',scopes.join(' '));url.searchParams.set('state',state);if(pkce){url.searchParams.set('code_challenge_method','S256');url.searchParams.set('code_challenge',crypto.createHash('sha256').update(verifier).digest('base64url'));}return {url:url.href,privateState:pkce?{verifier}:{}};},
    async finish({code,privateState}){fail(typeof code==='string'&&code.length>0&&code.length<4000,'INVALID_OAUTH_CODE');if(pkce)fail(typeof privateState?.verifier==='string','PKCE_VERIFIER_REQUIRED');const tokens=await token({grant_type:'authorization_code',code,redirect_uri:redirectUri,...(pkce?{code_verifier:privateState.verifier}:{})});const account=await resolveAccount({accessToken:tokens.access_token,scopes:tokens.scope});fail(account?.verified===true&&typeof account.remoteId==='string'&&Array.isArray(account.formats),'OAUTH_ACCOUNT_NOT_ELIGIBLE',403);return {...account,accessToken:tokens.access_token,refreshToken:tokens.refresh_token,expiresAt:Number.isFinite(tokens.expires_in)?Date.now()+tokens.expires_in*1000:null};},
    async refresh(refreshToken){fail(typeof refreshToken==='string'&&refreshToken.length>0,'REFRESH_TOKEN_REQUIRED',503);const result=await token({grant_type:'refresh_token',refresh_token:refreshToken});return {accessToken:result.access_token,refreshToken:result.refresh_token??refreshToken,expiresAt:Number.isFinite(result.expires_in)?Date.now()+result.expires_in*1000:null};}
  };
}
