'use strict';
const fs=require('node:fs'),path=require('node:path');
const dump='C:/Users/Administrator/.pm2/dump.pm2';
const result={apps:[]};
const activeRoot='D:/hehe/hehehe/hehehehe/hehe/[PRODUCTION] IOD-INTEGRATED_API v2.8.x';
function publicSettings(env){
 const output={};
 for(const key of ['OIDC_ISSUER','SSO_ISSUER','SSO_REDIRECT_URI','SSO_CALLBACK_URL'])if(env?.[key]){try{const url=new URL(env[key]);if(!url.username&&!url.password&&!url.search&&!url.hash)output[key]=url.href;}catch{}}
 for(const key of ['SSO_CLIENT_SECRET','OIDC_SESSION_COOKIE_KEYS','OIDC_JWKS_FILE'])output[key+'_configured']=!!env?.[key];
 if(env?.SSO_CLIENT_ID)output.SSO_CLIENT_ID=env.SSO_CLIENT_ID;
 if(/^\d+$/.test(String(env?.PORT)))output.PORT=Number(env.PORT);
 return output;
}
if(fs.existsSync(dump))for(const app of JSON.parse(fs.readFileSync(dump,'utf8'))){
 const root=app.pm_cwd||path.dirname(app.pm_exec_path||'');
 result.apps.push({name:app.name,root,settings:publicSettings({...app.env,...app}),oidcModulePresent:fs.existsSync(path.join(root,'app/modules/oidc/config.js')),legacyOidcModulePresent:fs.existsSync(path.join(root,'service/oidc/config.js'))});
}
const current={root:activeRoot,modules:{},env:{}};
for(const rel of ['app/modules/oidc/config.js','service/oidc/config.js','app/registerRoutes.js','index.js','package.json'])current.modules[rel]=fs.existsSync(path.join(activeRoot,rel));
const envfile=path.join(activeRoot,'.env');
if(fs.existsSync(envfile)){
 const parsed={};for(const line of fs.readFileSync(envfile,'utf8').split(/\r?\n/)){const match=line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/);if(match)parsed[match[1]]=match[2].trim().replace(/^['"]|['"]$/g,'');}
 current.env=publicSettings(parsed);
}
if(current.modules['package.json']){const pkg=JSON.parse(fs.readFileSync(path.join(activeRoot,'package.json'),'utf8'));current.oidcDependency=!!pkg.dependencies?.['oidc-provider'];}
result.activeProcessRoot=current;
process.stdout.write(JSON.stringify(result)+'\n');
